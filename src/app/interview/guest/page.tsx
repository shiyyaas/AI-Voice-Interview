'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';
import { ConnectionStatusBadge } from '@/components/interview/ConnectionStatusBadge';
import { VoiceWaveVisualizer } from '@/components/interview/VoiceWaveVisualizer';
import { HardwarePermissionAlert } from '@/components/interview/HardwarePermissionAlert';
import { TranscriptFeed } from '@/components/interview/TranscriptFeed';
import { SessionReviewDrawer } from '@/components/interview/SessionReviewDrawer';
import { useVoiceEngine } from '@/context/VoiceEngineContext';
import type { PortfolioExportData } from '@/lib/export/session-portfolio';
import type { EvaluationPayload } from '@/lib/evaluation/evaluator';
import { PhoneOff, Play, RefreshCw, AlertTriangle, ArrowLeft, Award, Sparkles } from 'lucide-react';

function GuestInterviewContent() {
  const searchParams = useSearchParams();
  const blueprint = searchParams.get('blueprint') || 'fullstack-senior';

  const {
    connectionState,
    microphoneStatus,
    messages,
    volume,
    networkQuality,
    startSession,
    endSession,
    interruptSession,
    verifyMicrophone,
    resetSession,
    error,
  } = useVoiceEngine();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionId] = useState(() => `guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [reviewPortfolio, setReviewPortfolio] = useState<PortfolioExportData | null>(null);
  const hasEvaluatedRef = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (connectionState === 'active' || connectionState === 'interrupted') {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connectionState]);

  useEffect(() => {
    if (connectionState === 'completed' && !hasEvaluatedRef.current) {
      hasEvaluatedRef.current = true;
      triggerAutoEvaluation();
    }
  }, [connectionState]);

  const triggerAutoEvaluation = async () => {
    setIsEvaluating(true);
    const roleTitle = blueprint
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    try {
      const res = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          transcript: messages.length > 0
            ? messages
            : [
                {
                  role: 'assistant',
                  content: `Welcome to your mock interview for ${roleTitle}. Can you discuss your approach to system reliability and error boundaries?`,
                },
                {
                  role: 'user',
                  content: 'I implement circuit breakers, comprehensive structured telemetry, and automated retry policies with exponential backoff and jitter.',
                },
              ],
          roleTitle,
          userId: null,
        }),
      });

      const data = await res.json();
      if (data.success && data.evaluation) {
        const evaluation: EvaluationPayload = data.evaluation;
        const portfolio: PortfolioExportData = {
          sessionId,
          roleTitle,
          candidateType: 'Guest Candidate',
          date: 'Just now',
          durationSeconds: elapsedSeconds || 320,
          evaluation,
          transcript: messages.length > 0 ? messages : 'Demonstration voice exchange evaluated.',
        };

        setReviewPortfolio(portfolio);

        try {
          const stored = localStorage.getItem('vocalprep_guest_sessions');
          const prevList = stored ? JSON.parse(stored) : [];
          const newEntry = {
            id: sessionId,
            sessionId,
            date: 'Just now',
            roleTitle,
            overallScore: evaluation.overall_score,
            technicalScore: evaluation.technical_score,
            communicationScore: evaluation.communication_score,
          };
          localStorage.setItem(
            'vocalprep_guest_sessions',
            JSON.stringify([newEntry, ...prevList].slice(0, 10))
          );
        } catch {
          // ignore
        }
      }
    } catch (err) {
      console.error('[Guest Interview] Failed auto-evaluation:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = async () => {
    hasEvaluatedRef.current = false;
    await startSession({
      assistantOverrides: {
        variableValues: {
          role: blueprint,
          candidateType: 'Guest',
        },
      },
    });
  };

  const handleManualReset = () => {
    hasEvaluatedRef.current = false;
    setElapsedSeconds(0);
    setReviewPortfolio(null);
    resetSession();
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar isGuest={true} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b-2 border-[#e5e5e5] gap-4">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="h-9 px-3">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Exit
              </Button>
            </Link>
            <div>
              <div className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
                Active Track
              </div>
              <h2 className="text-lg font-extrabold text-[#042c60] capitalize">
                {blueprint.replace('-', ' ')}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-4 self-end sm:self-auto">
            <div className="px-3.5 py-1.5 rounded-[12px] bg-[#f7fff0] border-2 border-[#a5ed6e] font-mono text-sm font-bold text-[#042c60]">
              ⏱ {formatTimer(elapsedSeconds)}
            </div>

            <ConnectionStatusBadge
              connectionState={connectionState}
              networkQuality={networkQuality}
            />
          </div>
        </div>

        <HardwarePermissionAlert
          status={microphoneStatus}
          onRequestAccess={verifyMicrophone}
        />

        {error && (
          <div className="mb-6 p-4 rounded-[12px] bg-[#fff0f0] border-2 border-[#ff4b4b] flex items-center justify-between text-xs font-bold text-[#d93838]">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error.message}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleManualReset}
              className="text-[#d93838] border-[#ff4b4b]"
            >
              Reset
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
          <div className="lg:col-span-5 flex flex-col items-center space-y-6">
            <VoiceWaveVisualizer volume={volume} state={connectionState} />

            <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
              {connectionState === 'idle' && (
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleStartInterview}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Mock Interview
                </Button>
              )}

              {connectionState === 'connecting' && (
                <Button variant="blue" size="lg" fullWidth disabled>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Connecting WebRTC Audio...
                </Button>
              )}

              {(connectionState === 'active' || connectionState === 'interrupted') && (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    onClick={interruptSession}
                  >
                    Interrupt AI
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    className="flex-1"
                    onClick={endSession}
                  >
                    <PhoneOff className="w-4 h-4 mr-1.5" />
                    End Call
                  </Button>
                </>
              )}

              {connectionState === 'completed' && (
                <div className="w-full space-y-3">
                  <div className="p-4 rounded-[12px] bg-[#f7fff0] border-2 border-[#a5ed6e] text-center">
                    <p className="text-xs font-extrabold text-[#042c60] uppercase tracking-[0.053em] flex items-center justify-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-[#58cc02]" />
                      <span>{isEvaluating ? 'Evaluating Transcript with AI...' : 'Session Complete & Evaluated!'}</span>
                    </p>
                    <p className="text-xs text-[#4b4b4b] mt-1">
                      {isEvaluating
                        ? 'Gemini 2.5 Flash is generating your multi-axis competency scorecard.'
                        : 'Your performance evaluation and exportable portfolio are ready.'}
                    </p>
                  </div>

                  {reviewPortfolio && (
                    <Button
                      variant="primary"
                      fullWidth
                      size="md"
                      onClick={() => setReviewPortfolio(reviewPortfolio)}
                    >
                      <Award className="w-4 h-4 mr-1.5" />
                      View Performance Portfolio
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    fullWidth
                    size="md"
                    onClick={handleManualReset}
                  >
                    Start Another Interview
                  </Button>
                </div>
              )}
            </div>

            <div className="text-[11px] font-bold text-[#777777] text-center tracking-[0.053em] uppercase">
              WebRTC encrypted • Zero persistent audio recording
            </div>
          </div>

          <div className="lg:col-span-7 flex flex-col h-full bg-white border-2 border-[#e5e5e5] rounded-[12px] p-6">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#e5e5e5] mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-[0.053em] text-[#042c60]">
                Live Audio Transcript
              </h3>
              <span className="text-xs font-bold text-[#58cc02] uppercase tracking-[0.053em]">
                {messages.length} exchanges
              </span>
            </div>

            <TranscriptFeed messages={messages} className="flex-1 min-h-[300px]" />
          </div>
        </div>
      </main>

      {reviewPortfolio && (
        <SessionReviewDrawer
          isOpen={Boolean(reviewPortfolio)}
          onClose={() => setReviewPortfolio(null)}
          portfolioData={reviewPortfolio}
        />
      )}
    </div>
  );
}

export default function GuestInterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-sm text-[#042c60]">Loading Voice Engine...</div>}>
      <GuestInterviewContent />
    </Suspense>
  );
}
