import React from 'react';
import type { VoiceMessage } from '@/lib/voice/types';
import { User, Bot } from 'lucide-react';
import { cn } from '@/components/ui/Button';

interface TranscriptFeedProps {
  messages: VoiceMessage[];
  className?: string;
}

export function TranscriptFeed({ messages, className }: TranscriptFeedProps) {
  if (messages.length === 0) {
    return (
      <div className={cn('p-6 text-center text-sm font-bold text-[#777777] border-2 border-dashed border-[#e5e5e5] rounded-[12px]', className)}>
        Conversation transcript will stream here once the AI asks a question.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4 max-h-[320px] overflow-y-auto pr-2', className)}>
      {messages.map((msg) => {
        const isAssistant = msg.role === 'assistant';
        return (
          <div
            key={msg.id}
            className={cn(
              'flex items-start space-x-3 p-3.5 rounded-[12px] border-2 transition-all',
              isAssistant
                ? 'border-[#a5ed6e] bg-[#f7fff0] text-[#042c60]'
                : 'border-[#1cb0f6] bg-[#f0f9ff] text-[#000437]'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0 border-b-2 font-bold text-xs',
                isAssistant
                  ? 'bg-[#58cc02] border-[#46a302] text-white'
                  : 'bg-[#1cb0f6] border-[#1899d6] text-white'
              )}
            >
              {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.053em] opacity-80">
                  {isAssistant ? 'AI Interviewer' : 'You (Candidate)'}
                </span>
                <span className="text-[10px] text-[#777777]">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {msg.content}
                {msg.isPartial && <span className="inline-block animate-pulse ml-1">...</span>}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
