'use client';

import React, { useState } from 'react';
import { cn } from '@/components/ui/Button';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#042c60] border-x-transparent border-b-transparent border-[6px]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#042c60] border-x-transparent border-t-transparent border-[6px]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#042c60] border-y-transparent border-r-transparent border-[6px]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#042c60] border-y-transparent border-l-transparent border-[6px]',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={cn(
            'absolute z-50 px-3 py-1.5 text-xs font-bold text-white bg-[#042c60] rounded-[12px] border-2 border-[#000437] whitespace-nowrap pointer-events-none tracking-[0.053em] animate-in fade-in zoom-in-95 duration-150',
            positionStyles[position],
            className
          )}
        >
          {content}
          <div className={cn('absolute w-0 h-0', arrowStyles[position])} />
        </div>
      )}
    </div>
  );
}
