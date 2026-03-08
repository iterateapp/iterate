'use client';

import { Mic, MicOff, PhoneOff, Play } from 'lucide-react';
import { useInterviewCall } from './useInterviewCall';

interface Props {
  sessionId: string;
  title: string;
}

export function InterviewRoom({ sessionId, title }: Props) {
  const { callState, isMuted, elapsed, error, transcript, audioRef, startCall, endCall, toggleMute, formatTime } =
    useInterviewCall(sessionId);

  return (
    <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg overflow-hidden">
      {/* biome-ignore lint/a11y/useMediaCaption: audio-only remote stream */}
      <audio ref={audioRef} autoPlay />

      {/* Header */}
      <div className="border-b px-6 py-4 text-center">
        <h2 className="font-medium text-gray-900">{title}</h2>
        {callState === 'connected' && (
          <div className="mt-1 flex items-center justify-center gap-2">
            <span className="text-sm text-gray-500">通話中 {formatTime(elapsed)}</span>
            <div className="flex items-center gap-0.5">
              {[0,1,2,3,4,5].map((i) => (
                <div
                  key={i}
                  className="w-0.5 rounded-full bg-blue-500 animate-pulse"
                  style={{ height: `${8 + (i % 3) * 4}px`, animationDelay: `${i * 0.08}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transcript or status */}
      <div className="h-80 overflow-y-auto p-4 space-y-3">
        {transcript.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center text-gray-400 text-sm">
            {callState === 'idle' && 'マイクを許可して、インタビューを開始してください。'}
            {callState === 'connecting' && '接続中...'}
            {callState === 'ended' && '終了しました。ご参加ありがとうございました。'}
            {callState === 'error' && error}
          </div>
        ) : (
          transcript.map((entry) => (
            <div key={entry.id} className={`flex gap-2 ${entry.speaker === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                entry.speaker === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              } ${!entry.isFinal ? 'opacity-60' : ''}`}>
                {entry.text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Controls */}
      <div className="border-t p-4 flex items-center justify-center gap-4">
        {callState === 'idle' && (
          <button
            type="button"
            onClick={startCall}
            className="flex items-center gap-2 rounded-full bg-green-500 px-6 py-3 text-white font-medium hover:bg-green-600 transition-colors"
          >
            <Play className="h-4 w-4" />
            インタビューを開始
          </button>
        )}

        {callState === 'connecting' && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            接続中...
          </div>
        )}

        {callState === 'connected' && (
          <>
            <button
              type="button"
              onClick={toggleMute}
              className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={endCall}
              className="h-12 w-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </>
        )}

        {(callState === 'ended' || callState === 'error') && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border px-6 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            再接続
          </button>
        )}
      </div>
    </div>
  );
}
