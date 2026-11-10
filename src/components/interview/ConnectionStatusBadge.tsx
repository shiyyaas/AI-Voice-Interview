import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import type { VoiceConnectionState, NetworkQuality } from '@/lib/voice/types';
import { cn } from '@/components/ui/Button';

interface ConnectionStatusBadgeProps {
  connectionState: VoiceConnectionState;
  networkQuality: NetworkQuality;
  className?: string;
}

export function ConnectionStatusBadge({
  connectionState,
  networkQuality,
  className,
}: ConnectionStatusBadgeProps) {
  const stateMeta = {
    idle: {
      label: 'Standby / Idle',
      dotColor: 'bg-[#777777]',
      borderColor: 'border-[#e5e5e5]',
      textColor: 'text-[#4b4b4b]',
      bgColor: 'bg-white',
    },
    connecting: {
      label: 'Connecting WebRTC...',
      dotColor: 'bg-[#1cb0f6] animate-ping',
      borderColor: 'border-[#1cb0f6]',
      textColor: 'text-[#1cb0f6]',
      bgColor: 'bg-[#f0f9ff]',
    },
    active: {
      label: 'Live & Listening',
      dotColor: 'bg-[#58cc02] animate-pulse',
      borderColor: 'border-[#a5ed6e]',
      textColor: 'text-[#042c60]',
      bgColor: 'bg-[#f7fff0]',
    },
    interrupted: {
      label: 'Interruption Detected',
      dotColor: 'bg-[#ff9600] animate-bounce',
      borderColor: 'border-[#ff9600]',
      textColor: 'text-[#ff9600]',
      bgColor: 'bg-[#fff9f0]',
    },
    completed: {
      label: 'Session Completed',
      dotColor: 'bg-[#042c60]',
      borderColor: 'border-[#042c60]',
      textColor: 'text-[#042c60]',
      bgColor: 'bg-[#f2f4f8]',
    },
  }[connectionState];

  const networkMeta = {
    excellent: { text: 'Signal: Excellent', icon: Wifi, color: 'text-[#58cc02]' },
    good: { text: 'Signal: Good', icon: Wifi, color: 'text-[#58cc02]' },
    fair: { text: 'Signal: Fair', icon: Wifi, color: 'text-[#ff9600]' },
    poor: { text: 'Signal: Weak', icon: AlertCircle, color: 'text-[#ff4b4b]' },
    offline: { text: 'Offline', icon: WifiOff, color: 'text-[#ff4b4b]' },
  }[networkQuality];

  const NetworkIcon = networkMeta.icon;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Voice State Badge */}
      <div
        className={cn(
          'inline-flex items-center space-x-2 px-3 py-1.5 rounded-[12px] border-2 font-bold text-xs uppercase tracking-[0.053em] transition-all',
          stateMeta.borderColor,
          stateMeta.bgColor,
          stateMeta.textColor
        )}
      >
        <span className={cn('w-2.5 h-2.5 rounded-full', stateMeta.dotColor)} />
        <span>{stateMeta.label}</span>
      </div>

      {/* Network Quality Indicator */}
      <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[12px] border-2 border-[#e5e5e5] bg-white text-xs font-bold text-[#4b4b4b] uppercase tracking-[0.053em]">
        <NetworkIcon className={cn('w-3.5 h-3.5', networkMeta.color)} />
        <span className="hidden sm:inline">{networkMeta.text}</span>
      </div>
    </div>
  );
}
