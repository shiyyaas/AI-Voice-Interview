'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';
import { Briefcase, Clock, Sparkles, ChevronRight, CheckCircle2, User } from 'lucide-react';

interface MockRole {
  id: string;
  title: string;
  level: string;
  type: string;
  duration: number;
  skills: string[];
  description: string;
}

const DEFAULT_TEMPLATES: MockRole[] = [
  {
    id: 'fullstack-senior',
    title: 'Senior Full-Stack Engineer',
    level: 'Senior',
    type: 'Technical & Architecture',
    duration: 15,
    skills: ['React', 'Next.js', 'PostgreSQL', 'WebSockets'],
    description: 'Deep dive into full-stack architecture, state management, latency optimization, and system design.',
  },
  {
    id: 'frontend-react',
    title: 'Frontend React Specialist',
    level: 'Mid',
    type: 'Component Design & State',
    duration: 15,
    skills: ['React Hooks', 'DOM Rendering', 'Tailwind', 'Performance'],
    description: 'Interactive conversation analyzing state machine architecture, accessibility, and real-time UI.',
  },
  {
    id: 'backend-node',
    title: 'Backend Systems Engineer',
    level: 'Senior',
    type: 'Distributed Systems',
    duration: 20,
    skills: ['Node.js', 'PostgreSQL RLS', 'Caching', 'Concurrency'],
    description: 'Real-time drill on transactional safety, Supabase Row-Level Security, rate-limiting, and microservices.',
  },
];

export default function DashboardPage() {
  const [selectedRole, setSelectedRole] = useState<string>(DEFAULT_TEMPLATES[0].id);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar isGuest={true} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Guest Onboarding Banner */}
        <div className="mb-8 p-6 rounded-[12px] bg-[#d7ffb8] border-2 border-[#a5ed6e] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#58cc02]" />
              <h2 className="font-extrabold text-lg text-[#042c60] uppercase tracking-[0.053em]">
                Guest Mode Ready
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4b4b4b] font-medium">
              You are currently evaluating the voice engine as a Guest. No sign-up or OAuth login required.
            </p>
          </div>

          <Link href="/interview/guest">
            <Button size="md" variant="primary" className="shrink-0">
              Launch Instant Session
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Header Block */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#042c60] tracking-tight">
              Interview Blueprints & Tracks
            </h1>
            <p className="text-sm text-[#777777] font-medium mt-1">
              Select a specialized AI interviewer blueprint to configure your real-time voice session.
            </p>
          </div>

          <Link href="/dashboard/analytics">
            <Button variant="secondary" size="md">
              <Sparkles className="w-4 h-4 mr-1.5 text-[#58cc02]" />
              View Analytics Dashboard
            </Button>
          </Link>
        </div>

        {/* Blueprint Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {DEFAULT_TEMPLATES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <div
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`cursor-pointer p-6 rounded-[12px] border-2 transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#58cc02] bg-[#f7fff0]'
                    : 'border-[#e5e5e5] bg-white hover:border-[#1cb0f6]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-[0.053em] px-2.5 py-1 rounded-[12px] bg-white border border-[#e5e5e5] text-[#042c60]">
                      {role.level}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#58cc02]" />
                    )}
                  </div>

                  <h3 className="font-extrabold text-lg text-[#042c60] mb-2 leading-snug">
                    {role.title}
                  </h3>
                  <p className="text-xs text-[#4b4b4b] mb-4 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#e5e5e5]">
                  <div className="flex flex-wrap gap-1.5">
                    {role.skills.map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] font-bold px-2 py-0.5 rounded-[12px] bg-white border border-[#e5e5e5] text-[#777777]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{role.duration} min</span>
                    </div>
                    <span>{role.type}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Start Selected Track Action */}
        <div className="p-8 rounded-[12px] border-2 border-[#1cb0f6] bg-[#f0f9ff] flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-extrabold text-[#042c60]">
              Ready to test your voice readiness?
            </h3>
            <p className="text-xs sm:text-sm text-[#4b4b4b]">
              Your browser will request native microphone permissions before initializing the Vapi WebRTC session.
            </p>
          </div>

          <Link href={`/interview/guest?blueprint=${selectedRole}`} className="w-full sm:w-auto">
            <Button size="lg" variant="blue" className="w-full sm:w-auto">
              Start Voice Session
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
