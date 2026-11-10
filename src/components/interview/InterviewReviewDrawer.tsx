'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Download, Printer, CheckCircle, AlertCircle, FileText, Sparkles, BookOpen } from 'lucide-react';

export interface SessionReviewData {
  sessionId: string;
  roleTitle: string;
  experienceLevel: string;
  date: string;
  durationSeconds: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestedExercises: string[];
  competencyMetrics: {
    syntax_accuracy: number;
    system_architecture: number;
    verbal_communication_fluency: number;
    problem_solving?: number;
    practical_execution?: number;
  };
  transcript: Array<{
    role: string;
    text?: string;
    content?: string;
    transcript?: string;
    timestamp?: number | string;
  }>;
  keyTakeaways?: string;
}

export interface InterviewReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: SessionReviewData | null;
}

export function InterviewReviewDrawer({
  isOpen,
  onClose,
  sessionData,
}: InterviewReviewDrawerProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !sessionData) return null;

  // Compile full Session Portfolio into Markdown (.md)
  const generateMarkdownPortfolio = (): string => {
    const transcriptLines = sessionData.transcript
      .map((t) => {
        const role = (t.role || 'speaker').toUpperCase();
        const text = t.text || t.content || t.transcript || '';
        return `**${role}:** ${text}\n`;
      })
      .join('\n');

    return `# Interview Session Portfolio: ${sessionData.roleTitle}

**Session ID:** ${sessionData.sessionId}
**Date:** ${sessionData.date}
**Candidate Level:** ${sessionData.experienceLevel}
**Duration:** ${Math.round(sessionData.durationSeconds / 60)} minutes
**Overall Performance Score:** ${sessionData.overallScore} / 100

---

## 📊 Competency Matrix Breakdown
- **Syntax Accuracy:** ${sessionData.competencyMetrics.syntax_accuracy}%
- **System Architecture:** ${sessionData.competencyMetrics.system_architecture}%
- **Verbal Communication Fluency:** ${sessionData.competencyMetrics.verbal_communication_fluency}%
- **Problem Solving & Reasoning:** ${sessionData.competencyMetrics.problem_solving ?? sessionData.overallScore}%
- **Practical Execution:** ${sessionData.competencyMetrics.practical_execution ?? sessionData.overallScore}%

---

## 🎯 Executive Summary & Takeaways
${sessionData.keyTakeaways || 'Candidate exhibited structured technical problem solving and effective communication throughout the session.'}

---

## 🌟 Key Strengths
${sessionData.strengths.map((s) => `- ${s}`).join('\n')}

---

## ⚠️ Constructive Growth Opportunities
${sessionData.weaknesses.map((w) => `- ${w}`).join('\n')}

---

## 🚀 Recommended Practical Exercises
${sessionData.suggestedExercises.map((e) => `1. ${e}`).join('\n')}

---

## 🎙️ Full Interview Dialogue Transcript
${transcriptLines || '_No transcript records recorded for this session._'}

---
*Exported from VocalPrep AI Mock Interview Voice Engine*
`;
  };

  const handleDownloadMarkdown = () => {
    const mdContent = generateMarkdownPortfolio();
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `interview-portfolio-${sessionData.sessionId.slice(0, 8)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-none transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Container adhering to DESIGN.md */}
      <div className="relative w-full max-w-2xl bg-white border-l-2 border-[#e5e5e5] h-full overflow-y-auto flex flex-col z-10 print:max-w-none print:w-full print:border-none">

        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b-2 border-[#e5e5e5] p-5 sm:p-6 flex items-center justify-between z-20">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#58cc02]" />
              <span className="text-xs font-extrabold text-[#58cc02] uppercase tracking-[0.053em]">
                Session Portfolio
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#042c60] mt-0.5">
              {sessionData.roleTitle}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-[12px] border-2 border-[#e5e5e5] hover:border-[#3c3c3c] text-[#777777] transition-all print:hidden"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Action Header: Export Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-[12px] bg-[#f7fff0] border-2 border-[#a5ed6e] print:hidden">
            <div className="space-y-0.5">
              <span className="text-xs font-black uppercase tracking-[0.053em] text-[#042c60]">
                Export Session Portfolio
              </span>
              <p className="text-[11px] text-[#4b4b4b]">
                Download formatted Markdown or save a printable report.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="primary"
                onClick={handleDownloadMarkdown}
                className="text-xs"
              >
                {downloadSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Exported!
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 mr-1" />
                    Download .MD
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handlePrint}
                className="text-xs"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print View
              </Button>
            </div>
          </div>

          {/* Score & Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-[12px] border-2 border-[#e5e5e5] bg-white text-center">
              <div className="text-2xl font-black text-[#58cc02]">
                {sessionData.overallScore}%
              </div>
              <div className="text-[10px] font-bold text-[#777777] uppercase tracking-[0.053em] mt-0.5">
                Overall Score
              </div>
            </div>

            <div className="p-3.5 rounded-[12px] border-2 border-[#e5e5e5] bg-white text-center">
              <div className="text-2xl font-black text-[#042c60]">
                {Math.round(sessionData.durationSeconds / 60)}m
              </div>
              <div className="text-[10px] font-bold text-[#777777] uppercase tracking-[0.053em] mt-0.5">
                Duration
              </div>
            </div>

            <div className="p-3.5 rounded-[12px] border-2 border-[#e5e5e5] bg-white text-center">
              <div className="text-2xl font-black text-[#1cb0f6]">
                {sessionData.competencyMetrics.syntax_accuracy}%
              </div>
              <div className="text-[10px] font-bold text-[#777777] uppercase tracking-[0.053em] mt-0.5">
                Syntax Accuracy
              </div>
            </div>

            <div className="p-3.5 rounded-[12px] border-2 border-[#e5e5e5] bg-white text-center">
              <div className="text-2xl font-black text-[#042c60]">
                {sessionData.competencyMetrics.verbal_communication_fluency}%
              </div>
              <div className="text-[10px] font-bold text-[#777777] uppercase tracking-[0.053em] mt-0.5">
                Verbal Fluency
              </div>
            </div>
          </div>

          {/* Key Takeaways */}
          {sessionData.keyTakeaways && (
            <div className="p-4 rounded-[12px] border-2 border-[#e5e5e5] bg-[#fafafa] space-y-1">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-[#042c60] uppercase tracking-[0.053em]">
                <Sparkles className="w-3.5 h-3.5 text-[#58cc02]" />
                <span>Executive Summary</span>
              </div>
              <p className="text-xs text-[#4b4b4b] leading-relaxed font-medium">
                {sessionData.keyTakeaways}
              </p>
            </div>
          )}

          {/* Strengths & Weaknesses Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="p-4 rounded-[12px] border-2 border-[#a5ed6e] bg-[#f7fff0] space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#58cc02] uppercase tracking-[0.053em]">
                <CheckCircle className="w-4 h-4" />
                <span>Observed Strengths</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#042c60] font-medium">
                {sessionData.strengths.map((st, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-[#58cc02] mr-1.5 font-bold">•</span>
                    <span>{st}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-4 rounded-[12px] border-2 border-[#ff9600] bg-[#fff9f0] space-y-2">
              <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#ff9600] uppercase tracking-[0.053em]">
                <AlertCircle className="w-4 h-4" />
                <span>Growth Areas</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#4b4b4b] font-medium">
                {sessionData.weaknesses.map((wk, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-[#ff9600] mr-1.5 font-bold">•</span>
                    <span>{wk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggested Practical Exercises */}
          <div className="p-4 rounded-[12px] border-2 border-[#1cb0f6] bg-[#f0f9ff] space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-extrabold text-[#1cb0f6] uppercase tracking-[0.053em]">
              <BookOpen className="w-4 h-4" />
              <span>Recommended Practice Exercises</span>
            </div>
            <div className="space-y-2 text-xs text-[#042c60]">
              {sessionData.suggestedExercises.map((ex, i) => (
                <div key={i} className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-[6px] bg-white border border-[#1cb0f6] flex items-center justify-center font-bold text-[10px] shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium pt-0.5">{ex}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Complete Dialogue Transcript Feed */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b-2 border-[#e5e5e5] pb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-[#777777]" />
                <h3 className="text-xs font-extrabold text-[#042c60] uppercase tracking-[0.053em]">
                  Dialogue Transcript
                </h3>
              </div>
              <span className="text-[11px] font-bold text-[#777777] uppercase">
                {sessionData.transcript.length} turns
              </span>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {sessionData.transcript.length === 0 ? (
                <p className="text-xs text-[#777777] italic">
                  No transcript segments recorded for this session.
                </p>
              ) : (
                sessionData.transcript.map((item, idx) => {
                  const isAssistant = item.role === 'assistant';
                  const text = item.text || item.content || item.transcript || '';
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-[12px] border-2 text-xs ${
                        isAssistant
                          ? 'bg-[#f7fff0] border-[#a5ed6e] text-[#042c60]'
                          : 'bg-white border-[#e5e5e5] text-[#4b4b4b]'
                      }`}
                    >
                      <div className="font-extrabold uppercase text-[10px] tracking-[0.053em] mb-1 text-[#777777]">
                        {isAssistant ? 'AI Interviewer' : 'Candidate'}
                      </div>
                      <p className="font-medium leading-relaxed">{text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
