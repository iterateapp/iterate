'use client';

import {
  ConnectionState,
  type RemoteParticipant,
  type RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  type Participant,
  type TrackPublication,
  type TranscriptionSegment,
} from 'livekit-client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type CallState = 'idle' | 'connecting' | 'connected' | 'ended' | 'error';

export interface TranscriptEntry {
  id: string;
  speaker: 'user' | 'agent';
  text: string;
  isFinal: boolean;
}

export function useInterviewCall(sessionId: string) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  useEffect(() => () => { roomRef.current?.disconnect(); }, []);

  const handleTrackSubscribed = useCallback(
    (track: RemoteTrackPublication['track'], _pub: RemoteTrackPublication, _p: RemoteParticipant) => {
      if (track?.kind === Track.Kind.Audio && audioRef.current) {
        track.attach(audioRef.current);
      }
    },
    [],
  );

  const handleTranscription = useCallback(
    (segments: TranscriptionSegment[], participant?: Participant, _pub?: TrackPublication) => {
      setTranscript((prev) => {
        const updated = [...prev];
        for (const seg of segments) {
          if (!seg.text) continue;
          const isUser = participant?.identity === roomRef.current?.localParticipant?.identity;
          const entry: TranscriptEntry = {
            id: seg.id,
            speaker: isUser ? 'user' : 'agent',
            text: seg.text,
            isFinal: seg.final,
          };
          const idx = updated.findIndex((e) => e.id === seg.id);
          if (idx >= 0) updated[idx] = entry;
          else updated.push(entry);
        }
        return updated;
      });
    },
    [],
  );

  const startCall = async () => {
    setCallState('connecting');
    setError('');
    setElapsed(0);
    setTranscript([]);

    try {
      const res = await fetch('/api/interview/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error((body as { error?: string }).error ?? 'Failed to join interview');
      }

      const { livekitUrl, accessToken } = await res.json() as { livekitUrl: string; accessToken: string };

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.on(RoomEvent.TranscriptionReceived, handleTranscription);
      room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        if (state === ConnectionState.Connected) setCallState('connected');
        else if (state === ConnectionState.Disconnected) setCallState('ended');
      });
      room.on(RoomEvent.Disconnected, () => setCallState('ended'));

      await room.connect(livekitUrl, accessToken);
      await room.localParticipant.setMicrophoneEnabled(true);
      setCallState('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCallState('error');
    }
  };

  const endCall = () => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setCallState('ended');
  };

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    const newMuted = !isMuted;
    await room.localParticipant.setMicrophoneEnabled(!newMuted);
    setIsMuted(newMuted);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return { callState, isMuted, elapsed, error, transcript, audioRef, startCall, endCall, toggleMute, formatTime };
}
