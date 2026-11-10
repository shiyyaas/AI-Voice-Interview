'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { CompetencyRadarChart } from '@/components/analytics/CompetencyRadarChart';
import { generateSessionPortfolioMarkdown, downloadMarkdownFile, type PortfolioExportData } from '@/lib/export/session-portfolio';
import {
  X,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Award,
  Sparkles,
} from 'lucide-react';

interface SessionReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: PortfolioExportData;
}

export function SessionReviewDrawer({
  isOpen,
  onClose,
  portfolioData,
}: SessionReviewDrawerProps) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownloadMarkdown = () => {
    const markdown = generateSessionPortfolioMarkdown(portfolioData);
    const filename = `interview-portfolio-${portfolioData.sessionId.slice(0, 8)}.md`;
    downloadMarkdownFile(filename, markdown);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const evalData = portfolioData.evaluation;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-none flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full border-l-4 border-[#042c60] flex flex-col shadow-none overflow-y-auto">
        <div className="p-6 border-b-2 border-[#e5e5e5] bg-[#ffffff] sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#d7ffb8] border-2 border-[#a5ed6e] flex items-center justify-center text-[#58cc02]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
                Session Portfolio Review
              </div>
              <h2 className="text-xl font-extrabold text-[#042c60]">
                {portfolioData.roleTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-[12px] border-2 border-[#e5e5e5] hover:border-[#3c3c3c] flex items-center justify-center text-[#4b4b4b] transition-all"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 flex-1">
          <div className="p-6 rounded-[12px] bg-[#f7fff0] border-2 border-[#a5ed6e] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs font-extrabold text-[#58cc02] uppercase tracking-[0.053em]">
                Overall Score
              </span>
              <div className="text-4xl font-extrabold text-[#042c60]">
                {evalData.overall_score} <span className="text-lg text-[#777777]">/ 100</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-center px-4 py-2 rounded-[12px] bg-white border-2 border-[#e5e5e5]">
                <div className="text-[10px] font-bold text-[#777777] uppercase">Technical</div>
                <div className="text-base font-extrabold text-[#042c60]">
                  {evalData.technical_score}%
                </div>
              </div>
              <div className="text-center px-4 py-2 rounded-[12px] bg-white border-2 border-[#e5e5e5]">
                <div className="text-[10px] font-bold text-[#777777] uppercase">Fluency</div>
                <div className="text-base font-extrabold text-[#042c60]">
                  {evalData.communication_score}%
                </div>
              </div>
              <div className="text-center px-4 py-2 rounded-[12px] bg-white border-2 border-[#e5e5e5]">
                <div className="text-[10px] font-bold text-[#777777] uppercase">Confidence</div>
                <div className="text-base font-extrabold text-[#042c60]">
                  {evalData.confidence_score}%
                </div>
              </div>
            </div>
          </div>

          <div className="border-2 border-[#e5e5e5] rounded-[12px] p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#e5e5e5] pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-[0.053em] text-[#042c60]">
                Competency Radar Matrix
              </h3>
              <span className="text-[11px] font-bold text-[#58cc02] uppercase tracking-[0.053em]">
                5 Dimensions
              </span>
            </div>

            <CompetencyRadarChart metrics={evalData.competency_scores} size={300} />
          </div>

          <div className="border-2 border-[#e5e5e5] rounded-[12px] p-6 bg-white space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.053em] text-[#042c60] flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#58cc02]" />
              <span>Evaluator Critique</span>
            </h3>
            <p className="text-sm text-[#4b4b4b] leading-relaxed font-medium">
              {evalData.key_takeaways}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border-2 border-[#a5ed6e] bg-[#f7fff0] rounded-[12px] p-5 space-y-3">
              <div className="flex items-center space-x-2 text-[#58cc02]">
                <CheckCircle2 className="w-4 h-4" />
                <h4 className="text-xs font-extrabold uppercase tracking-[0.053em]">
                  Key Strengths
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-[#042c60] font-medium">
                {evalData.strengths.map((s, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-[#58cc02] font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-2 border-[#1cb0f6] bg-[#f0f9ff] rounded-[12px] p-5 space-y-3">
              <div className="flex items-center space-x-2 text-[#1cb0f6]">
                <AlertCircle className="w-4 h-4" />
                <h4 className="text-xs font-extrabold uppercase tracking-[0.053em]">
                  Growth Areas
                </h4>
              </div>
              <ul className="space-y-2 text-xs text-[#042c60] font-medium">
                {evalData.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-[#1cb0f6] font-bold">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-2 border-[#e5e5e5] rounded-[12px] p-6 bg-white space-y-4">
            <div className="flex items-center space-x-2 text-[#042c60]">
              <BookOpen className="w-4 h-4 text-[#58cc02]" />
              <h3 className="text-xs font-extrabold uppercase tracking-[0.053em]">
                Targeted Practice Drills
              </h3>
            </div>
            <div className="space-y-2.5">
              {evalData.suggested_exercises.map((ex, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-[12px] bg-white border-2 border-[#e5e5e5] hover:border-[#a5ed6e] transition-all text-xs text-[#4b4b4b] font-medium flex items-start space-x-2"
                >
                  <span className="font-extrabold text-[#58cc02] shrink-0">{i + 1}.</span>
                  <span>{ex}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t-2 border-[#e5e5e5] bg-white sticky bottom-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto flex items-center space-x-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleDownloadMarkdown}
              className="flex-1 sm:flex-initial"
            >
              <Download className="w-4 h-4 mr-1.5" />
              {downloadSuccess ? 'Downloaded!' : 'Export Portfolio (.md)'}
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={handlePrint}
              className="flex-1 sm:flex-initial"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Portfolio
            </Button>
          </div>

          <Button variant="ghost" size="md" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
