'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';
import { ScoreProgressionChart, type ScoreDataPoint } from '@/components/analytics/ScoreProgressionChart';
import { CompetencyRadarChart } from '@/components/analytics/CompetencyRadarChart';
import { SessionReviewDrawer } from '@/components/interview/SessionReviewDrawer';
import { Tooltip } from '@/components/ui/Tooltip';
import type { PortfolioExportData } from '@/lib/export/session-portfolio';
import type { CompetencyMetrics } from '@/lib/supabase/types';
import {
  Briefcase,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Award,
  Layers,
  BarChart3,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

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

const DEFAULT_HISTORICAL_SESSIONS: ScoreDataPoint[] = [
  {
    id: 'sess-1',
    sessionId: 'session-001-uuid',
    date: '3 weeks ago',
    roleTitle: 'Frontend React Specialist',
    overallScore: 68,
    technicalScore: 65,
    communicationScore: 72,
  },
  {
    id: 'sess-2',
    sessionId: 'session-002-uuid',
    date: '2 weeks ago',
    roleTitle: 'Backend Systems Engineer',
    overallScore: 74,
    technicalScore: 76,
    communicationScore: 70,
  },
  {
    id: 'sess-3',
    sessionId: 'session-003-uuid',
    date: '1 week ago',
    roleTitle: 'Senior Full-Stack Engineer',
    overallScore: 82,
    technicalScore: 84,
    communicationScore: 80,
  },
  {
    id: 'sess-4',
    sessionId: 'session-004-uuid',
    date: 'Yesterday',
    roleTitle: 'Senior Full-Stack Engineer',
    overallScore: 89,
    technicalScore: 91,
    communicationScore: 86,
  },
];

const AGGREGATE_COMPETENCY: CompetencyMetrics = {
  syntaxAccuracy: 88,
  systemArchitecture: 84,
  verbalCommunication: 86,
  problemSolving: 90,
  codeQuality: 85,
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'blueprints' | 'analytics'>('blueprints');
  const [selectedRole, setSelectedRole] = useState<string>(DEFAULT_TEMPLATES[0].id);
  const [historicalData, setHistoricalData] = useState<ScoreDataPoint[]>(DEFAULT_HISTORICAL_SESSIONS);
  const [selectedReviewSession, setSelectedReviewSession] = useState<PortfolioExportData | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('vocalprep_guest_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistoricalData(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const openSampleReviewDrawer = (session: ScoreDataPoint) => {
    const portfolio: PortfolioExportData = {
      sessionId: session.sessionId,
      roleTitle: session.roleTitle,
      candidateType: 'Guest Candidate',
      date: session.date,
      durationSeconds: 900,
      evaluation: {
        overall_score: session.overallScore,
        technical_score: session.technicalScore || session.overallScore,
        communication_score: session.communicationScore || session.overallScore,
        confidence_score: Math.min(100, session.overallScore + 2),
        strengths: [
          'Excellent modular architectural explanation of web services',
          'Crisp reasoning around database transaction locks and indexing',
          'Good conversational pacing with concise summaries',
        ],
        weaknesses: [
          'Could formulate deeper edge-case handling around distributed network partitions',
          'Opportunity to mention automated chaos testing principles',
        ],
        suggested_exercises: [
          'System Design: Design an idempotent distributed webhook receiver with Dead Letter Queues',
          'Syntax Accuracy: Implement lock-free concurrent ring buffers in TypeScript',
          'Verbal Fluency: Explain CAP theorem trade-offs in under 60 seconds with concrete examples',
        ],
        key_takeaways: `High-conviction performance for ${session.roleTitle}. Demonstrates senior-level mastery in core architecture patterns and clear verbal articulation.`,
        competency_scores: {
          syntaxAccuracy: session.technicalScore || 85,
          systemArchitecture: session.overallScore,
          verbalCommunication: session.communicationScore || 80,
          problemSolving: Math.min(100, session.overallScore + 3),
          codeQuality: session.technicalScore || 82,
        },
      },
      transcript: [
        {
          id: '1',
          role: 'assistant',
          content: 'Hello! Welcome to your technical session. Could you describe how you approach database migrations in zero-downtime production deployments?',
          timestamp: Date.now() - 600000,
        },
        {
          id: '2',
          role: 'user',
          content: 'I follow expand-and-contract patterns. First adding nullable columns or dual-writing before deprecating old schemas.',
          timestamp: Date.now() - 550000,
        },
      ],
    };

    setSelectedReviewSession(portfolio);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar isGuest={true} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="mb-8 p-6 rounded-[12px] bg-[#d7ffb8] border-2 border-[#a5ed6e] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#58cc02]" />
              <h2 className="font-extrabold text-lg text-[#042c60] uppercase tracking-[0.053em]">
                Guest Mode Ready
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#4b4b4b] font-medium">
              Multi-tenant row isolation active. Your real-time interviews and evaluations are safely isolated.
            </p>
          </div>

          <Link href="/interview/guest">
            <Button size="md" variant="primary" className="shrink-0">
              Launch Instant Session
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="flex items-center space-x-3 mb-8 border-b-2 border-[#e5e5e5] pb-4">
          <button
            onClick={() => setActiveTab('blueprints')}
            className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.053em] rounded-[12px] transition-all flex items-center space-x-2 border-2 ${
              activeTab === 'blueprints'
                ? 'bg-[#58cc02] text-white border-[#46a302] border-b-[4px]'
                : 'bg-white text-[#777777] border-[#e5e5e5] hover:border-[#3c3c3c]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Interview Tracks & Blueprints</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-2.5 text-xs font-extrabold uppercase tracking-[0.053em] rounded-[12px] transition-all flex items-center space-x-2 border-2 ${
              activeTab === 'analytics'
                ? 'bg-[#58cc02] text-white border-[#46a302] border-b-[4px]'
                : 'bg-white text-[#777777] border-[#e5e5e5] hover:border-[#3c3c3c]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Progress Tracking & Analytics</span>
          </button>
        </div>

        {activeTab === 'blueprints' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div>
              <h1 className="text-3xl font-extrabold text-[#042c60] tracking-tight">
                Interview Blueprints & Tracks
              </h1>
              <p className="text-sm text-[#777777] font-medium mt-1">
                Select a specialized AI interviewer blueprint to configure your real-time voice session.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {DEFAULT_TEMPLATES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`cursor-pointer p-6 rounded-[12px] border-2 transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#58cc02] bg-[#f7fff0] border-b-[4px] border-b-[#46a302]'
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
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-[#042c60] tracking-tight">
                  Longitudinal Performance Analytics
                </h1>
                <p className="text-sm text-[#777777] font-medium mt-1">
                  Track your overall score progression, multi-axis competency matrices, and historical session portfolios.
                </p>
              </div>

              <Tooltip content="All metrics computed via Gemini 2.5 Flash evaluation">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-[12px] bg-[#f7fff0] border-2 border-[#a5ed6e] text-xs font-bold text-[#042c60] uppercase tracking-[0.053em] cursor-help">
                  <Sparkles className="w-3.5 h-3.5 text-[#58cc02]" />
                  <span>AI Evaluator Active</span>
                </div>
              </Tooltip>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-1">
                <div className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
                  Total Sessions
                </div>
                <div className="text-3xl font-extrabold text-[#042c60]">
                  {historicalData.length}
                </div>
                <div className="text-[11px] text-[#58cc02] font-bold">
                  +100% completion rate
                </div>
              </div>

              <div className="p-5 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-1">
                <div className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
                  Average Score
                </div>
                <div className="text-3xl font-extrabold text-[#042c60]">
                  {Math.round(
                    historicalData.reduce((acc, c) => acc + c.overallScore, 0) /
                      (historicalData.length || 1)
                  )}%
                </div>
                <div className="text-[11px] text-[#58cc02] font-bold">
                  Trending upwards
                </div>
              </div>

              <div className="p-5 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-1">
                <div className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
                  Strongest Dimension
                </div>
                <div className="text-xl font-extrabold text-[#042c60] truncate">
                  Problem Solving
                </div>
                <div className="text-[11px] text-[#1cb0f6] font-bold">
                  90% proficiency
                </div>
              </div>

              <div className="p-5 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-1">
                <div className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
                  Target Growth Area
                </div>
                <div className="text-xl font-extrabold text-[#042c60] truncate">
                  System Architecture
                </div>
                <div className="text-[11px] text-[#ff9600] font-bold">
                  Sketches & idempotency
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 p-6 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#e5e5e5] pb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-[#58cc02]" />
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.053em] text-[#042c60]">
                      Score Progression Over Time
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
                    Overall Score (0-100)
                  </span>
                </div>

                <ScoreProgressionChart data={historicalData} height={260} />
              </div>

              <div className="lg:col-span-5 p-6 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#e5e5e5] pb-3">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-[#1cb0f6]" />
                    <h2 className="text-sm font-extrabold uppercase tracking-[0.053em] text-[#042c60]">
                      Competency Radar Matrix
                    </h2>
                  </div>
                  <span className="text-xs font-bold text-[#1cb0f6] uppercase tracking-[0.053em]">
                    Sub-metrics
                  </span>
                </div>

                <CompetencyRadarChart metrics={AGGREGATE_COMPETENCY} size={280} />
              </div>
            </div>

            <div className="p-6 rounded-[12px] border-2 border-[#e5e5e5] bg-white space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#e5e5e5] pb-3">
                <h3 className="text-sm font-extrabold uppercase tracking-[0.053em] text-[#042c60]">
                  Session Ledger & Portfolio Exports
                </h3>
                <span className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
                  Multi-tenant RLS Protected
                </span>
              </div>

              <div className="divide-y-2 border-[#e5e5e5]">
                {historicalData.map((session) => (
                  <div
                    key={session.id}
                    className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-[#042c60] text-sm">
                          {session.roleTitle}
                        </span>
                        <span className="px-2 py-0.5 rounded-[12px] bg-[#d7ffb8] border border-[#a5ed6e] text-[10px] font-bold text-[#042c60] uppercase">
                          Score {session.overallScore}%
                        </span>
                      </div>
                      <div className="text-xs text-[#777777] font-medium">
                        Completed {session.date} • Session ID: {session.sessionId.slice(0, 8)}...
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openSampleReviewDrawer(session)}
                        className="w-full sm:w-auto"
                      >
                        <BookOpen className="w-3.5 h-3.5 mr-1" />
                        View Review & Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedReviewSession && (
        <SessionReviewDrawer
          isOpen={Boolean(selectedReviewSession)}
          onClose={() => setSelectedReviewSession(null)}
          portfolioData={selectedReviewSession}
        />
      )}
    </div>
  );
}
