/**
 * Fish Audio TTS Adapter
 *
 * Both FishTtsSynthesizeStream and FishTtsChunkedStream use WebSocket
 * (wss://api.fish.audio/v1/tts/live) for audio synthesis.
 * HTTP is never used.
 */

import { tts } from '@livekit/agents';
import { AudioFrame } from '@livekit/rtc-node';
import { pack, unpack } from 'msgpackr';
import type { RawData } from 'ws';
import WebSocket from 'ws';

export interface FishTtsConfig {
  apiKey: string;
  referenceId: string;
  model: string;
  sampleRate: number;
  latency: 'normal' | 'balanced';
  speed: number;
}

const FISH_TTS_WS_URL = 'wss://api.fish.audio/v1/tts/live';
const FRAME_DURATION_MS = 10;

// ---- WebSocket event types ----

interface FishWsStartEvent {
  event: 'start';
  request: {
    text: string;
    sample_rate: number;
    latency: 'normal' | 'balanced';
    format: 'pcm';
    normalize: boolean;
    prosody: { speed: number; volume: number };
    reference_id?: string;
  };
}

interface FishWsTextEvent {
  event: 'text';
  text: string;
}

interface FishWsFlushEvent {
  event: 'flush';
}

interface FishWsStopEvent {
  event: 'stop';
}

// ---- PCM frame emitter (shared) ----

function emitPcmFrames(
  queue: tts.SynthesizeStream['queue'] | tts.ChunkedStream['queue'],
  combined: Buffer,
  residualBuffer: Buffer<ArrayBufferLike>,
  sampleRate: number,
  segmentId: string,
  frameIndex: number,
  isFinal: boolean,
): { residualBuffer: Buffer<ArrayBufferLike>; frameIndex: number } {
  try {
    const samplesPerFrame = Math.floor((sampleRate * FRAME_DURATION_MS) / 1000);
    const bytesPerFrame = samplesPerFrame * 2;
    const data = Buffer.concat([residualBuffer, combined]);
    let offset = 0;
    let idx = frameIndex;

    while (offset + bytesPerFrame <= data.length) {
      const frameBytes = data.subarray(offset, offset + bytesPerFrame);
      const int16Array = new Int16Array(frameBytes.buffer, frameBytes.byteOffset, samplesPerFrame);
      const frameData = new Int16Array(samplesPerFrame);
      frameData.set(int16Array);

      const audioFrame = new AudioFrame(frameData, sampleRate, 1, samplesPerFrame);
      queue.put({
        frame: audioFrame,
        requestId: `tts-${Date.now()}-${idx}`,
        segmentId,
        final: false,
      });
      offset += bytesPerFrame;
      idx++;
    }

    let newResidual = data.subarray(offset);

    if (isFinal) {
      if (newResidual.length >= 2) {
        const remainingSamples = Math.floor(newResidual.length / 2);
        const frameData = new Int16Array(samplesPerFrame);
        const int16Array = new Int16Array(
          newResidual.buffer,
          newResidual.byteOffset,
          remainingSamples,
        );
        frameData.set(int16Array);
        const audioFrame = new AudioFrame(frameData, sampleRate, 1, remainingSamples);
        queue.put({
          frame: audioFrame,
          requestId: `tts-${Date.now()}-${idx}`,
          segmentId,
          final: true,
        });
      } else {
        const frameData = new Int16Array(samplesPerFrame);
        const audioFrame = new AudioFrame(frameData, sampleRate, 1, 0);
        queue.put({
          frame: audioFrame,
          requestId: `tts-${Date.now()}-${idx}`,
          segmentId,
          final: true,
        });
      }
      newResidual = Buffer.alloc(0);
      idx++;
    }

    return { residualBuffer: newResidual, frameIndex: idx };
  } catch (e) {
    // If the stream was closed externally (e.g. consumer called close()),
    // silently stop emitting frames.
    if (e instanceof Error && e.message === 'Queue is closed') {
      return { residualBuffer: Buffer.alloc(0), frameIndex: frameIndex };
    }
    throw e;
  }
}

// ---- WS start event builder (shared) ----

function buildStartEvent(config: FishTtsConfig): FishWsStartEvent {
  const request: FishWsStartEvent['request'] = {
    text: '',
    sample_rate: config.sampleRate,
    latency: config.latency,
    format: 'pcm',
    normalize: true,
    prosody: { speed: config.speed, volume: 0 },
  };
  // Only include reference_id when a valid voice model ID is set.
  // Fish Audio returns "Session not initialized" if reference_id is invalid.
  if (config.referenceId) {
    request.reference_id = config.referenceId;
  }
  return { event: 'start', request };
}

// ---- WebSocket connect with retry (shared) ----

async function connectFishWs(config: FishTtsConfig, label: string): Promise<WebSocket | null> {
  const retryDelaysMs = [500, 1500, 3000];

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    const connectStart = Date.now();
    const candidate = new WebSocket(FISH_TTS_WS_URL, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        model: config.model,
      },
    });

    const opened = await new Promise<boolean>((resolve) => {
      candidate.once('open', () => resolve(true));
      candidate.once('error', (err: Error) => {
        const is429 = err.message.includes('429');
        if (!is429 || attempt === retryDelaysMs.length) {
          console.error(`[Fish:${label}] WS connect error (attempt ${attempt + 1}):`, err.message);
        }
        resolve(false);
      });
    });

    if (opened) {
      console.log(
        `[Fish:${label}] WS connected in ${Date.now() - connectStart}ms (attempt ${attempt + 1})`,
      );
      return candidate;
    }

    candidate.terminate();
    if (attempt < retryDelaysMs.length) {
      const delay = retryDelaysMs[attempt];
      console.log(`[Fish:${label}] Retry in ${delay}ms...`);
      await new Promise<void>((r) => setTimeout(r, delay));
    }
  }

  console.error(`[Fish:${label}] WS connection failed after all retries`);
  return null;
}

// ---- WebSocket connection pool (pre-warms one standby connection) ----

/**
 * Keeps one pre-warmed WebSocket connection ready for the next synthesis request.
 * Starts warming immediately on construction so the first synthesis request has
 * a connection ready, reducing first-speech latency.
 *
 * Each standby connection has the Fish Audio `start` event pre-sent so that
 * the server can initialize the TTS session before synthesis is needed.
 * This eliminates the start-event round-trip (~100-200 ms) from the critical path.
 */
class FishWsPool {
  private standby: Promise<WebSocket | null>;

  constructor(private readonly config: FishTtsConfig) {
    // Pre-warm immediately on construction to reduce first-speech latency
    this.standby = this.warmConnection('init');
  }

  /**
   * Open a WebSocket connection and pre-send the start event so Fish Audio
   * initializes the TTS session in the background.
   */
  private async warmConnection(label: string): Promise<WebSocket | null> {
    const start = Date.now();
    const ws = await connectFishWs(this.config, label);
    if (!ws) return null;
    // Pre-send start event — Fish Audio session initialization happens now,
    // before any synthesis request arrives, removing it from the hot path.
    ws.send(pack(buildStartEvent(this.config)));
    console.log(
      `[Fish:${label}] Warm complete — WS open + start event sent (${Date.now() - start}ms total)`,
    );
    return ws;
  }

  async acquire(): Promise<WebSocket | null> {
    const acquireStart = Date.now();
    // Take the pre-warmed connection and immediately start warming the next one
    const standbyPromise = this.standby;
    this.standby = this.warmConnection('pool');

    const ws = await standbyPromise;

    // If pre-warmed connection is still open, use it
    if (ws && ws.readyState === WebSocket.OPEN) {
      console.log(`[Fish:acquire] Using pre-warmed WS (waited ${Date.now() - acquireStart}ms)`);
      return ws;
    }

    // Pre-warmed connection died; connect fresh (next standby is already warming)
    ws?.terminate();
    console.warn(`[Fish:acquire] Pre-warmed WS was dead, falling back to fresh connect`);
    return this.warmConnection('stream');
  }
}

/**
 * Fish Audio TTS SynthesizeStream — WebSocket bidirectional streaming
 *
 * Sends text tokens one by one to the WebSocket as they arrive from the LLM.
 * Flushes at sentence boundaries so the server can start audio generation early.
 */
class FishTtsSynthesizeStream extends tts.SynthesizeStream {
  label = 'fish-tts.Stream';
  private readonly config: FishTtsConfig;
  private readonly pool: FishWsPool;
  private segmentCounter = 0;

  constructor(
    ttsAdapter: FishTtsAdapter,
    config: FishTtsConfig,
    pool: FishWsPool,
  ) {
    super(ttsAdapter);
    this.config = config;
    this.pool = pool;
  }

  protected async run(): Promise<void> {
    const segmentId = `segment-${this.segmentCounter++}`;
    const runStart = Date.now();

    const ws = await this.pool.acquire();
    if (!ws) return;

    // start event was already pre-sent by the pool during warm-up

    // ---- concurrent audio consumer ----
    let residualBuffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let frameIndex = 0;
    const audioChunks: Buffer[] = [];
    let wsClosed = false;
    let audioNotify: (() => void) | null = null;
    let firstAudioLogged = false;

    const wakeAudio = () => {
      audioNotify?.();
      audioNotify = null;
    };

    ws.on('message', (data: RawData) => {
      try {
        const buf = Buffer.isBuffer(data)
          ? data
          : Array.isArray(data)
            ? Buffer.concat(data as Buffer[])
            : Buffer.from(data as ArrayBuffer);

        const msg = unpack(buf) as { event: string; audio?: Uint8Array; message?: string };
        if (msg.event === 'audio' && msg.audio) {
          if (!firstAudioLogged) {
            firstAudioLogged = true;
            console.log(`[Fish:stream] First audio frame received in ${Date.now() - runStart}ms`);
          }
          audioChunks.push(Buffer.from(msg.audio));
          wakeAudio();
        } else if (msg.event === 'finish') {
          wsClosed = true;
          wakeAudio();
        } else if (msg.event === 'error') {
          console.error('Fish Audio WS server error:', msg.message ?? JSON.stringify(msg));
          wsClosed = true;
          wakeAudio();
        }
      } catch {
        // ignore decode errors
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      if (code !== 1000 && code !== 1001) {
        console.error(
          `Fish Audio WS closed unexpectedly: code=${code} reason=${reason?.toString() ?? ''}`,
        );
      }
      wsClosed = true;
      wakeAudio();
    });

    ws.on('error', (err: Error) => {
      console.error('Fish Audio WS error:', err.message);
      wsClosed = true;
      wakeAudio();
    });

    const consumeAudio = async () => {
      while (!wsClosed || audioChunks.length > 0) {
        if (audioChunks.length === 0) {
          await new Promise<void>((resolve) => {
            audioNotify = resolve;
          });
        }
        while (audioChunks.length > 0) {
          const chunk = audioChunks.shift() ?? Buffer.alloc(0);
          const result = emitPcmFrames(
            this.queue,
            chunk,
            residualBuffer,
            this.config.sampleRate,
            segmentId,
            frameIndex,
            false,
          );
          residualBuffer = result.residualBuffer;
          frameIndex = result.frameIndex;
        }
      }
      emitPcmFrames(
        this.queue,
        Buffer.alloc(0),
        residualBuffer,
        this.config.sampleRate,
        segmentId,
        frameIndex,
        true,
      );
    };

    const audioConsumerPromise = consumeAudio();

    // ---- buffer text at boundaries, then flush ----
    // Text is buffered locally so that complete words/phrases are sent together.
    // Fish Audio generates audio after the flush event regardless, so batching
    // at sentence boundaries adds no perceptible latency.
    let pendingText = '';

    const flushPending = () => {
      if (!pendingText) return;
      const textEvent: FishWsTextEvent = { event: 'text', text: pendingText };
      ws.send(pack(textEvent));
      const flushEvent: FishWsFlushEvent = { event: 'flush' };
      ws.send(pack(flushEvent));
      pendingText = '';
    };

    for await (const item of this.input) {
      if (typeof item === 'string') {
        pendingText += item;

        const isHardBoundary = /[。！？.!?\n]/.test(item);
        const isSoftBoundary = pendingText.length >= 15 && /[、,]/.test(item);

        if (isHardBoundary || isSoftBoundary) {
          flushPending();
        }
      }
    }

    // Final flush + stop
    flushPending();
    const flushEvent: FishWsFlushEvent = { event: 'flush' };
    ws.send(pack(flushEvent));
    const stopEvent: FishWsStopEvent = { event: 'stop' };
    ws.send(pack(stopEvent));

    await audioConsumerPromise;
    ws.close();
  }
}

/**
 * Fish Audio TTS ChunkedStream — WebSocket streaming for complete-text synthesis
 *
 * Sends the full text over WebSocket in one shot (no streaming LLM tokens).
 * Used when synthesize() is called with a complete text string.
 */
class FishTtsChunkedStream extends tts.ChunkedStream {
  label = 'fish-tts.Chunked';
  private readonly config: FishTtsConfig;
  private readonly pool: FishWsPool;

  constructor(ttsAdapter: FishTtsAdapter, text: string, config: FishTtsConfig, pool: FishWsPool) {
    super(text, ttsAdapter);
    this.config = config;
    this.pool = pool;
  }

  protected async run(): Promise<void> {
    const segmentId = 'chunked-0';

    const ws = await this.pool.acquire();
    if (!ws) return;

    // start event was already pre-sent by the pool during warm-up

    // Send full text at once, then flush and stop
    const textEvent: FishWsTextEvent = { event: 'text', text: this.inputText };
    ws.send(pack(textEvent));
    const flushEvent: FishWsFlushEvent = { event: 'flush' };
    ws.send(pack(flushEvent));
    const stopEvent: FishWsStopEvent = { event: 'stop' };
    ws.send(pack(stopEvent));

    // Collect audio from WebSocket
    let residualBuffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let frameIndex = 0;
    const audioChunks: Buffer[] = [];
    let wsClosed = false;
    let audioNotify: (() => void) | null = null;

    const wakeAudio = () => {
      audioNotify?.();
      audioNotify = null;
    };

    ws.on('message', (data: RawData) => {
      try {
        const buf = Buffer.isBuffer(data)
          ? data
          : Array.isArray(data)
            ? Buffer.concat(data as Buffer[])
            : Buffer.from(data as ArrayBuffer);

        const msg = unpack(buf) as { event: string; audio?: Uint8Array; message?: string };
        if (msg.event === 'audio' && msg.audio) {
          audioChunks.push(Buffer.from(msg.audio));
          wakeAudio();
        } else if (msg.event === 'finish') {
          wsClosed = true;
          wakeAudio();
        } else if (msg.event === 'error') {
          console.error('Fish Audio chunked WS server error:', msg.message ?? JSON.stringify(msg));
          wsClosed = true;
          wakeAudio();
        }
      } catch {
        // ignore decode errors
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      if (code !== 1000 && code !== 1001) {
        console.error(
          `Fish Audio chunked WS closed unexpectedly: code=${code} reason=${reason?.toString() ?? ''}`,
        );
      }
      wsClosed = true;
      wakeAudio();
    });

    ws.on('error', (err: Error) => {
      console.error('Fish Audio chunked WS error:', err.message);
      wsClosed = true;
      wakeAudio();
    });

    while (!wsClosed || audioChunks.length > 0) {
      if (audioChunks.length === 0) {
        await new Promise<void>((resolve) => {
          audioNotify = resolve;
        });
      }
      while (audioChunks.length > 0) {
        const chunk = audioChunks.shift() ?? Buffer.alloc(0);
        const result = emitPcmFrames(
          this.queue,
          chunk,
          residualBuffer,
          this.config.sampleRate,
          segmentId,
          frameIndex,
          false,
        );
        residualBuffer = result.residualBuffer;
        frameIndex = result.frameIndex;
      }
    }

    emitPcmFrames(
      this.queue,
      Buffer.alloc(0),
      residualBuffer,
      this.config.sampleRate,
      segmentId,
      frameIndex,
      true,
    );
    ws.close();
  }
}

/**
 * Fish Audio TTS Adapter
 */
export class FishTtsAdapter extends tts.TTS {
  label = 'fish-tts.Adapter';
  private readonly config: FishTtsConfig;
  private readonly pool: FishWsPool;

  constructor(config: FishTtsConfig) {
    super(config.sampleRate, 1, { streaming: true });
    this.config = config;
    this.pool = new FishWsPool(config);
  }

  synthesize(text: string): tts.ChunkedStream {
    return new FishTtsChunkedStream(this, text, this.config, this.pool);
  }

  stream(): tts.SynthesizeStream {
    return new FishTtsSynthesizeStream(this, this.config, this.pool);
  }

  get capabilities(): tts.TTSCapabilities {
    return { streaming: true };
  }

  get sampleRate(): number {
    return this.config.sampleRate;
  }

  get numChannels(): number {
    return 1;
  }
}

/**
 * Factory function to create Fish Audio TTS adapter
 */
export function createFishTtsAdapter(config: FishTtsConfig): FishTtsAdapter {
  return new FishTtsAdapter(config);
}
