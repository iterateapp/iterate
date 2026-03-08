'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Play, Video, VideoOff } from 'lucide-react';
import { useInterviewCall } from './useInterviewCall';

interface Props {
  interviewId: string;
}

export function InterviewRoom({ interviewId }: Props) {
  const { callState, isMuted, elapsed, error, transcript, audioRef, startCall, endCall, toggleMute, formatTime } =
    useInterviewCall(interviewId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);

  // Start camera when user clicks start (or when connected)
  useEffect(() => {
    if (callState === 'connected' || callState === 'connecting') {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraEnabled(true);
          }
        })
        .catch(() => setCameraError(true));
    }
    // Cleanup camera on end
    if (callState === 'ended' || callState === 'idle') {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        for (const track of stream.getTracks()) track.stop();
        videoRef.current.srcObject = null;
        setCameraEnabled(false);
      }
    }
  }, [callState]);

  // Detect agent speaking from transcript (any new non-final agent segment)
  useEffect(() => {
    const lastEntry = transcript.at(-1);
    if (lastEntry?.speaker === 'agent' && !lastEntry.isFinal) {
      setIsAgentSpeaking(true);
    } else {
      const timer = setTimeout(() => setIsAgentSpeaking(false), 800);
      return () => clearTimeout(timer);
    }
  }, [transcript]);

  const lastAgentText = transcript.filter((t) => t.speaker === 'agent' && t.isFinal).at(-1)?.text ?? '';
  const lastUserText = transcript.filter((t) => t.speaker === 'user').at(-1)?.text ?? '';

  if (callState === 'idle') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-8 px-4">
        {/* biome-ignore lint/a11y/useMediaCaption: audio-only */}
        <audio ref={audioRef} autoPlay />
        <div className="text-center space-y-3">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800">
            <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10">
              {/* Pulsing radar arcs — iterate brand icon */}
              {[28, 20, 12].map((r, i) => (
                <path
                  key={r}
                  d={`M ${20 - r * Math.cos(Math.PI / 6)} ${20 - r * Math.sin(Math.PI / 6)} A ${r} ${r} 0 0 1 ${20 + r * Math.cos(Math.PI / 6)} ${20 - r * Math.sin(Math.PI / 6)}`}
                  stroke="white"
                  strokeWidth={i === 0 ? 1.5 : i === 1 ? 2 : 2.5}
                  strokeLinecap="round"
                  opacity={0.6 + i * 0.2}
                />
              ))}
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white">AI Interviewer</h1>
          <p className="text-zinc-400 text-sm max-w-sm">
            The AI will ask you a few questions. Please allow microphone and camera access.
          </p>
        </div>
        <button
          type="button"
          onClick={startCall}
          className="flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-zinc-900 font-semibold text-base hover:bg-zinc-100 transition-colors"
        >
          <Play className="h-5 w-5" />
          Start Interview
        </button>
      </div>
    );
  }

  if (callState === 'ended') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 px-4">
        <audio ref={audioRef} autoPlay />
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
            <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white">Interview Complete</h2>
          <p className="text-zinc-400 text-sm">Thank you for your participation.<br />Your responses have been saved.</p>
        </div>
      </div>
    );
  }

  if (callState === 'error') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-6 px-4">
        <audio ref={audioRef} autoPlay />
        <div className="text-center space-y-3">
          <p className="text-red-400 text-sm">{error || 'Connection failed'}</p>
          <button type="button" onClick={startCall}
            className="rounded-full border border-zinc-700 px-6 py-2 text-sm text-white hover:bg-zinc-800 transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // connecting or connected states
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* biome-ignore lint/a11y/useMediaCaption: audio-only */}
      <audio ref={audioRef} autoPlay />

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          {callState === 'connected' && (
            <span className="flex items-center gap-1.5 text-xs text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              Recording {formatTime(elapsed)}
            </span>
          )}
          {callState === 'connecting' && (
            <span className="text-xs text-zinc-500">Connecting...</span>
          )}
        </div>
      </div>

      {/* Main area — AI panel full width, camera PiP bottom-right */}
      <div className="flex flex-1 px-6 pb-4 min-h-0 relative">
        {/* AI panel (full width) */}
        <div className="flex-1 rounded-2xl bg-zinc-900 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Pulsing orb when AI is speaking */}
          <div className={`relative flex items-center justify-center transition-all duration-300 ${isAgentSpeaking ? 'scale-110' : 'scale-100'}`}>
            <div className={`absolute rounded-full bg-indigo-500/20 transition-all duration-700 ${isAgentSpeaking ? 'h-40 w-40 opacity-100' : 'h-24 w-24 opacity-0'}`} />
            <div className={`absolute rounded-full bg-indigo-500/10 transition-all duration-1000 ${isAgentSpeaking ? 'h-56 w-56 opacity-100' : 'h-32 w-32 opacity-0'}`} />
            <div className="relative h-20 w-20 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg viewBox="0 0 40 40" fill="none" className="h-10 w-10">
                {[28, 20, 12].map((r, i) => (
                  <path
                    key={r}
                    d={`M ${20 - r * Math.cos(Math.PI / 6)} ${20 - r * Math.sin(Math.PI / 6)} A ${r} ${r} 0 0 1 ${20 + r * Math.cos(Math.PI / 6)} ${20 - r * Math.sin(Math.PI / 6)}`}
                    stroke="white"
                    strokeWidth={i === 0 ? 1.5 : i === 1 ? 2 : 2.5}
                    strokeLinecap="round"
                    opacity={0.6 + i * 0.2}
                  />
                ))}
              </svg>
            </div>
          </div>
          <p className="mt-4 text-zinc-500 text-sm">AI Interviewer</p>
          {/* Agent's latest text */}
          {lastAgentText && (
            <p className="absolute bottom-4 left-4 right-4 text-center text-white text-sm leading-relaxed bg-zinc-950/50 rounded-lg px-3 py-2">
              {lastAgentText}
            </p>
          )}
        </div>

        {/* PiP camera — small overlay bottom-right */}
        <div className="absolute bottom-6 right-8 w-48 h-36 rounded-xl bg-zinc-800 overflow-hidden shadow-2xl ring-1 ring-white/10 z-10">
          {cameraEnabled ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center gap-1">
              {cameraError ? <VideoOff className="h-5 w-5 text-zinc-600" /> : <Video className="h-5 w-5 text-zinc-600" />}
              <p className="text-zinc-600 text-[10px]">{cameraError ? 'No camera' : 'Starting...'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 pb-8">
        {callState === 'connected' && (
          <>
            <button
              type="button"
              onClick={toggleMute}
              className={`h-14 w-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-500 text-white' : 'bg-zinc-800 text-white hover:bg-zinc-700'
              }`}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={endCall}
              className="h-14 w-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </>
        )}
        {callState === 'connecting' && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Connecting...
          </div>
        )}
      </div>
    </div>
  );
}
