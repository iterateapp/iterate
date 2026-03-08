/**
 * Google Cloud STT Adapter
 *
 * Implements LiveKit stt.STT for Google Cloud Speech-to-Text API.
 * Uses streaming recognition via @google-cloud/speech client.
 */

import speech from '@google-cloud/speech';
import { stt } from '@livekit/agents';
import type { AudioFrame } from '@livekit/rtc-node';

export interface GoogleSttConfig {
  languageCode: string;
  sampleRate: number;
  apiKey?: string;
  credentials?: { client_email: string; private_key: string };
}

/**
 * Google STT SpeechStream implementation
 */
class GoogleSttStream extends stt.SpeechStream {
  label = 'google-stt.Stream';
  private readonly config: GoogleSttConfig;

  constructor(sttAdapter: GoogleSttAdapter, config: GoogleSttConfig) {
    super(sttAdapter, config.sampleRate);
    this.config = config;
  }

  protected async run(): Promise<void> {
    const { SpeechClient } = speech;
    const client = new SpeechClient(
      this.config.apiKey ? { apiKey: this.config.apiKey } : undefined,
    );

    const languageCode = this.config.languageCode;

    const recognizeStream = client.streamingRecognize({
      config: {
        encoding: 'LINEAR16' as const,
        sampleRateHertz: this.config.sampleRate,
        languageCode,
        enableAutomaticPunctuation: true,
      },
      interimResults: true,
    });

    let startEmitted = false;

    recognizeStream.on(
      'data',
      (response: {
        results?: Array<{
          alternatives?: Array<{ transcript?: string; confidence?: number }>;
          isFinal?: boolean;
          resultEndTime?: { seconds?: string | number; nanos?: number };
        }>;
      }) => {
        const result = response.results?.[0];
        if (!result) return;

        const alternative = result.alternatives?.[0];
        if (!alternative) return;

        const text = alternative.transcript ?? '';
        const confidence = alternative.confidence ?? 0.5;

        // Compute approximate timestamps
        const endTimeSec = result.resultEndTime
          ? Number(result.resultEndTime.seconds ?? 0) + (result.resultEndTime.nanos ?? 0) / 1e9
          : 0;

        if (!startEmitted) {
          this.queue.put({
            type: stt.SpeechEventType.START_OF_SPEECH,
            alternatives: [
              {
                text: '',
                language: languageCode,
                startTime: 0,
                endTime: 0,
                confidence: 0,
              },
            ],
          });
          startEmitted = true;
        }

        if (result.isFinal) {
          this.queue.put({
            type: stt.SpeechEventType.FINAL_TRANSCRIPT,
            alternatives: [
              {
                text,
                language: languageCode,
                startTime: 0,
                endTime: endTimeSec,
                confidence,
              },
            ],
          });
        } else {
          this.queue.put({
            type: stt.SpeechEventType.INTERIM_TRANSCRIPT,
            alternatives: [
              {
                text,
                language: languageCode,
                startTime: 0,
                endTime: endTimeSec,
                confidence: 0.5,
              },
            ],
          });
        }
      },
    );

    recognizeStream.on('error', (err: Error) => {
      console.error('Google STT error:', err.message);
    });

    recognizeStream.on('end', () => {
      if (startEmitted) {
        this.queue.put({
          type: stt.SpeechEventType.END_OF_SPEECH,
          alternatives: [
            {
              text: '',
              language: languageCode,
              startTime: 0,
              endTime: 0,
              confidence: 0,
            },
          ],
        });
      }
    });

    try {
      // Feed audio frames from the input
      for await (const item of this.input) {
        if (typeof item === 'symbol') {
          // FLUSH_SENTINEL - skip
          continue;
        }
        const frame = item as AudioFrame;
        const arrayBuffer = frame.data.buffer.slice(
          frame.data.byteOffset,
          frame.data.byteOffset + frame.data.byteLength,
        ) as ArrayBuffer;
        recognizeStream.write(Buffer.from(arrayBuffer));
      }
    } finally {
      recognizeStream.end();
      // Wait for stream to finish
      await new Promise<void>((resolve) => {
        recognizeStream.on('finish', resolve);
        recognizeStream.on('close', resolve);
        // Resolve after a short timeout in case the stream is already done
        setTimeout(resolve, 100);
      });
    }
  }
}

/**
 * Google Cloud Speech-to-Text adapter
 */
export class GoogleSttAdapter extends stt.STT {
  label = 'google-stt.Adapter';
  private readonly config: GoogleSttConfig;

  constructor(config: GoogleSttConfig) {
    super({ streaming: true, interimResults: true });
    this.config = config;
  }

  protected async _recognize(): Promise<stt.SpeechEvent> {
    throw new Error('Use stream() for Google STT');
  }

  stream(): stt.SpeechStream {
    return new GoogleSttStream(this, this.config);
  }
}

/**
 * Factory function to create Google STT adapter
 */
export function createGoogleSttAdapter(config: GoogleSttConfig): GoogleSttAdapter {
  return new GoogleSttAdapter(config);
}
