import React from 'react';
import { Mic, Volume2 } from 'lucide-react';
import type { VoiceConnectionState } from '@/lib/voice/types';
import { cn } from '@/components/ui/Button';

interface VoiceWaveVisualizerProps {
  volume: number; // 0 to 1
  state: VoiceConnectionState;
  className?: string;
}

export function VoiceWaveVisualizer({
  volume,
  state,
  className,
}: VoiceWaveVisualizerProps) {
  // Normalize visual scale height between 10% and 100%
  const normalizedHeight = Math.max(12, Math.min(100, Math.round(volume * 100)));

  const barCount = 12;
  const bars = Array.from({ length: barCount }, (_, i) => {
    // Generate pseudo wave fluctuation
    const factor = Math.sin((i / barCount) * Math.PI);
    const height = state === 'active' || state === 'interrupted'
      ? Math.max(15, Math.round(normalizedHeight * factor * (0.6 + Math.random() * 0.4)))
      : 8;

    return height;
  });

  return (
    <div
      className={cn(
        'w-full max-w-md mx-auto py-8 px-6 bg-white border-2 rounded-[12px] flex flex-col items-center justify-center transition-all',
        state === 'active' && 'border-[#58cc02]',
        state === 'interrupted' && 'border-[#ff9600]',
        state === 'connecting' && 'border-[#1cb0f6]',
        (state === 'idle' || state === 'completed') && 'border-[#e5e5e5]',
        className
      )}
    >
      {/* Central Visual Pulsing Icon */}
      <div className="relative mb-6">
        <div
          className={cn(
            'w-24 h-24 rounded-[12px] flex items-center justify-center transition-all border-b-4',
            state === 'active' && 'bg-[#58cc02] border-[#46a302] text-white',
            state === 'interrupted' && 'bg-[#ff9600] border-[#d97f00] text-white',
            state === 'connecting' && 'bg-[#1cb0f6] border-[#1899d6] text-white animate-pulse',
            (state === 'idle' || state === 'completed') && 'bg-[#f4f4f4] border-[#3c3c3c] text-[#777777]'
          )}
        >
          {state === 'interrupted' ? (
            <Volume2 className="w-10 h-10" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </div>

        {/* Dynamic Halo for Volume Activity */}
        {state === 'active' && (
          <div
            className="absolute inset-0 rounded-[12px] border-2 border-[#58cc02] pointer-events-none transition-transform duration-75"
            style={{
              transform: `scale(${1 + volume * 0.35})`,
              opacity: Math.max(0.2, volume),
            }}
          />
        )}
      </div>

      {/* Voice Amplitude Wave Bars */}
      <div className="flex items-end justify-center space-x-1.5 h-16 w-full px-4">
        {bars.map((h, idx) => (
          <div
            key={idx}
            className={cn(
              'w-2 rounded-[12px] transition-all duration-75',
              state === 'active' && 'bg-[#58cc02]',
              state === 'interrupted' && 'bg-[#ff9600]',
              state === 'connecting' && 'bg-[#1cb0f6]',
              (state === 'idle' || state === 'completed') && 'bg-[#e5e5e5]'
            )}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      <div className="mt-4 text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
        {state === 'active' && 'Microphone Active • Speak naturally'}
        {state === 'interrupted' && 'Interruption detected • Listening to your answer'}
        {state === 'connecting' && 'Establishing real-time voice channel...'}
        {state === 'idle' && 'Click Start to begin your interview session'}
        {state === 'completed' && 'Interview session has ended'}
      </div>
    </div>
  );
}
