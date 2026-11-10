import React, { useState } from 'react';

export interface TactileTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function TactileTooltip({
  content,
  children,
  position = 'top',
  className = '',
}: TactileTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none transition-opacity duration-150 ${positionClasses[position]}`}
        >
          <div className="bg-[#000437] text-white text-xs font-bold px-3 py-1.5 rounded-[12px] border-2 border-[#1cb0f6] whitespace-nowrap shadow-none tracking-[0.053em] uppercase">
            {content}
          </div>
        </div>
      )}
    </div>
  );
}
