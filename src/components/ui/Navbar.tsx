import React from 'react';
import Link from 'next/link';
import { Mic, User, Shield, Sparkles } from 'lucide-react';

interface NavbarProps {
  isGuest?: boolean;
}

export function Navbar({ isGuest = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 bg-[#ffffff] border-b-2 border-[#e5e5e5] h-16 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-10 h-10 rounded-[12px] bg-[#58cc02] flex items-center justify-center text-white border-b-2 border-[#46a302]">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#58cc02]">
            Vocal<span className="text-[#042c60]">Prep</span>
          </span>
        </Link>

        {isGuest && (
          <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-[12px] bg-[#d7ffb8] text-[#042c60] text-xs font-bold border border-[#a5ed6e] tracking-[0.053em] uppercase">
            Guest Session Active
          </span>
        )}
      </div>

      <nav className="flex items-center space-x-3 md:space-x-4">
        <Link
          href="/dashboard"
          className="text-xs md:text-sm font-bold text-[#4b4b4b] hover:text-[#58cc02] transition-colors uppercase tracking-[0.053em]"
        >
          Mock Interviews
        </Link>

        {isGuest ? (
          <div className="flex items-center space-x-2">
            <Link
              href="/dashboard?guest=true"
              className="inline-flex items-center px-4 py-2 text-xs md:text-sm font-bold rounded-[12px] text-[#1cb0f6] border-2 border-[#1cb0f6] hover:bg-[#f0f9ff] tracking-[0.053em] uppercase"
            >
              Guest Hub
            </Link>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-sm font-bold text-[#042c60]">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </div>
        )}
      </nav>
    </header>
  );
}
