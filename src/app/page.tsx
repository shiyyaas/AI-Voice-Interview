import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';
import { Sparkles, Mic, Volume2, ShieldCheck, ArrowRight, Zap, Target, Award } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col bg-white">
      <Navbar isGuest={true} />

      {/* Hero Section */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Heading and Hero CTA Stack */}
          <div className="lg:col-span-7 space-y-8">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-[12px] bg-[#d7ffb8] border border-[#a5ed6e] text-[#042c60] text-xs font-bold uppercase tracking-[0.053em]">
              <Sparkles className="w-3.5 h-3.5 text-[#58cc02]" />
              <span>Phase 1 Voice WebRTC Engine</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#042c60] tracking-tight leading-[1.1]">
              Ace your next tech interview with{' '}
              <span className="text-[#58cc02] inline-block">Real Voice AI</span>
            </h1>

            <p className="text-base sm:text-lg text-[#4b4b4b] leading-relaxed max-w-xl">
              Simulate high-pressure software engineering and behavioral rounds with low-latency,
              interruptible voice conversations. Practice instantly in Guest Mode without OAuth hurdles.
            </p>

            {/* Hero CTA Stack */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link href="/interview/guest" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  <Mic className="w-5 h-5 mr-2" />
                  Try Guest Mock Interview
                </Button>
              </Link>
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base">
                  Browse Roles & Blueprint
                </Button>
              </Link>
            </div>

            {/* Badges / Guarantees */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-bold uppercase tracking-[0.053em] text-[#777777]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#58cc02]" />
                <span>Zero Sign-up Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#1cb0f6]" />
                <span>Sub-500ms Audio Latency</span>
              </div>
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-[#58cc02]" />
                <span>Native Voice Interruption</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Interactive Preview Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#ffffff] border-2 border-[#e5e5e5] rounded-[12px] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b-2 border-[#e5e5e5] pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-[#58cc02]" />
                  <span className="text-xs font-bold uppercase tracking-[0.053em] text-[#042c60]">
                    Live Engine Ready
                  </span>
                </div>
                <span className="text-xs font-bold text-[#1cb0f6] uppercase tracking-[0.053em]">
                  Guest Session
                </span>
              </div>

              <div className="p-4 rounded-[12px] bg-[#f7fff0] border-2 border-[#a5ed6e] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.053em] text-[#58cc02]">
                  Interviewer Prompt
                </span>
                <p className="text-sm font-medium text-[#042c60]">
                  &ldquo;Welcome! Can you explain how you design an idempotent payment processing API?&rdquo;
                </p>
              </div>

              <div className="p-4 rounded-[12px] bg-[#f0f9ff] border-2 border-[#1cb0f6] space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.053em] text-[#1cb0f6]">
                  Candidate Audio Feedback
                </span>
                <p className="text-sm font-medium text-[#000437]">
                  &ldquo;Sure! I usually utilize unique idempotency keys mapped to the idempotency store...&rdquo;
                </p>
              </div>

              <div className="pt-2">
                <Link href="/interview/guest" className="block">
                  <Button variant="blue" fullWidth size="md">
                    Launch Interactive Room
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Feature Grid adhering to DESIGN.md */}
        <section className="mt-24 pt-12 border-t-2 border-[#e5e5e5]">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#042c60] tracking-tight">
              Engineered for Realistic Practice
            </h2>
            <p className="mt-2 text-sm text-[#777777] font-medium">
              Everything built according to Duolingo-inspired tactile UI tokens and WebRTC real-time voice specs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-3">
              <div className="w-12 h-12 rounded-[12px] bg-[#d7ffb8] border-2 border-[#a5ed6e] flex items-center justify-center text-[#58cc02]">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#042c60] tracking-[0.053em] uppercase">
                Natural Interruption
              </h3>
              <p className="text-xs text-[#4b4b4b] leading-relaxed">
                Interrupt the AI mid-sentence just like an in-person conversation. The voice engine yields instantly without delay.
              </p>
            </div>

            <div className="p-6 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-3">
              <div className="w-12 h-12 rounded-[12px] bg-[#f0f9ff] border-2 border-[#1cb0f6] flex items-center justify-center text-[#1cb0f6]">
                <Mic className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#042c60] tracking-[0.053em] uppercase">
                Hardware Permission Flow
              </h3>
              <p className="text-xs text-[#4b4b4b] leading-relaxed">
                Native browser getUserMedia pre-flight checks detect hardware absence, denial, and track status with zero memory leaks.
              </p>
            </div>

            <div className="p-6 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-3">
              <div className="w-12 h-12 rounded-[12px] bg-[#fff9f0] border-2 border-[#ff9600] flex items-center justify-center text-[#ff9600]">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-[#042c60] tracking-[0.053em] uppercase">
                Supabase RLS Architecture
              </h3>
              <p className="text-xs text-[#4b4b4b] leading-relaxed">
                Dual security layers permit guest session isolation alongside authenticated multi-round history and analytics.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#e5e5e5] py-8 text-center text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} VocalPrep AI. Built with Vapi & Supabase.</span>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="hover:text-[#58cc02]">Dashboard</Link>
            <Link href="/interview/guest" className="hover:text-[#58cc02]">Live Interview</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
