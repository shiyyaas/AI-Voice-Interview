import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'blue' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-4 py-2 text-xs',
      md: 'px-6 py-3.5 text-[15px]',
      lg: 'px-8 py-4 text-[17px]',
    };

    const variantClasses = {
      primary:
        'bg-[#58cc02] text-white hover:bg-[#52be02] border-b-[3px] border-[#46a302] active:translate-y-[2px] active:border-b-[1px]',
      secondary:
        'bg-white text-[#58cc02] border-2 border-[#a5ed6e] hover:border-[#58cc02] hover:bg-[#f7fff0] active:translate-y-[1px]',
      blue:
        'bg-[#1cb0f6] text-white hover:bg-[#179edc] border-b-[3px] border-[#1899d6] active:translate-y-[2px] active:border-b-[1px]',
      danger:
        'bg-[#ff4b4b] text-white hover:bg-[#ee4343] border-b-[3px] border-[#d93838] active:translate-y-[2px] active:border-b-[1px]',
      ghost:
        'bg-transparent text-[#777777] border-2 border-[#e5e5e5] hover:border-[#3c3c3c] hover:text-[#3c3c3c]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center font-bold tracking-[0.053em] uppercase rounded-[12px] transition-all focus:outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:border-b-0',
          sizeClasses[size],
          variantClasses[variant],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
