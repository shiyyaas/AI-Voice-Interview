'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';
import { ConnectionStatusBadge } from '@/components/interview/ConnectionStatusBadge';
import { VoiceWaveVisualizer } from '@/components/interview/VoiceWaveVisualizer';
import { HardwarePermissionAlert } from '@/components/interview/HardwarePermissionAlert';
import { TranscriptFeed } from '@/components/interview/TranscriptFeed';
import { useVoiceEngine } from '@/context/VoiceEngineContext';
import { PhoneOff, Mic, Play, RefreshCw, VolumeX, AlertTriangle, ArrowLeft } from 'lucide-react';

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

  // Elapsed timer when call is active
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = async () => {
    await startSession({
      assistantOverrides: {
        variableValues: {
          role: blueprint,
          candidateType: 'Guest',
        },
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar isGuest={true} />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Top Control Bar with Status & Timer */}
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
            {/* Live Timer */}
            <div className="px-3.5 py-1.5 rounded-[12px] bg-[#f7fff0] border-2 border-[#a5ed6e] font-mono text-sm font-bold text-[#042c60]">
              ⏱ {formatTimer(elapsedSeconds)}
            </div>

            {/* Dynamic Network & State Indicator */}
            <ConnectionStatusBadge
              connectionState={connectionState}
              networkQuality={networkQuality}
            />
          </div>
        </div>

        {/* Hardware Permission Warning (if any issue) */}
        <HardwarePermissionAlert
          status={microphoneStatus}
          onRequestAccess={verifyMicrophone}
        />

        {/* Generic Error Warning */}
        {error && (
          <div className="mb-6 p-4 rounded-[12px] bg-[#fff0f0] border-2 border-[#ff4b4b] flex items-center justify-between text-xs font-bold text-[#d93838]">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error.message}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={resetSession}
              className="text-[#d93838] border-[#ff4b4b]"
            >
              Reset
            </Button>
          </div>
        )}

        {/* Main Stage Grid: Visualizer + Live Transcript */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">

          {/* Visualizer and Audio Controls Column */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-6">
            <VoiceWaveVisualizer volume={volume} state={connectionState} />

            {/* Controls Bar */}
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
                    <p className="text-xs font-bold text-[#042c60] uppercase tracking-[0.053em]">
                      Session Complete!
                    </p>
                    <p className="text-xs text-[#4b4b4b] mt-1">
                      Your voice interview was completed successfully.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    fullWidth
                    size="md"
                    onClick={resetSession}
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

          {/* Real-time Streaming Transcript Column */}
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
