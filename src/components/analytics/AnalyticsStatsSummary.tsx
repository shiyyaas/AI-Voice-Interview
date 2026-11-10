'use client';

import React from 'react';
import { Award, TrendingUp, Zap, Target } from 'lucide-react';

export interface AnalyticsStatsProps {
  averageScore: number;
  highestScore: number;
  completedSessionsCount: number;
  trend: 'improving' | 'stable' | 'needs-focus';
  topStrength?: string;
  topWeakness?: string;
  className?: string;
}

export function AnalyticsStatsSummary({
  averageScore,
  highestScore,
  completedSessionsCount,
  trend,
  topStrength,
  topWeakness,
  className = '',
}: AnalyticsStatsProps) {
  const getTrendBadge = () => {
    switch (trend) {
      case 'improving':
        return {
          label: 'Upward Trend',
          color: 'text-[#58cc02] bg-[#f7fff0] border-[#a5ed6e]',
        };
      case 'needs-focus':
        return {
          label: 'Needs Focus',
          color: 'text-[#ff4b4b] bg-[#fff0f0] border-[#ff4b4b]',
        };
      default:
        return {
          label: 'Consistent',
          color: 'text-[#1cb0f6] bg-[#f0f9ff] border-[#1cb0f6]',
        };
    }
  };

  const trendBadge = getTrendBadge();

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {/* Average Score Card */}
      <div className="p-5 rounded-[12px] border-2 border-[#e5e5e5] bg-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
            Average Score
          </span>
          <div className="w-8 h-8 rounded-[8px] bg-[#f7fff0] border border-[#a5ed6e] flex items-center justify-center text-[#58cc02]">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-black text-[#042c60]">
            {Math.round(averageScore)}
          </span>
          <span className="text-sm font-bold text-[#777777]">/100</span>
        </div>
        <p className="text-[11px] text-[#777777] mt-2 font-medium">
          Across {completedSessionsCount} completed session{completedSessionsCount === 1 ? '' : 's'}
        </p>
      </div>

      {/* Highest Score Card */}
      <div className="p-5 rounded-[12px] border-2 border-[#e5e5e5] bg-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
            Personal Best
          </span>
          <div className="w-8 h-8 rounded-[8px] bg-[#d7ffb8] border border-[#58cc02] flex items-center justify-center text-[#042c60]">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline space-x-1">
          <span className="text-3xl font-black text-[#58cc02]">
            {Math.round(highestScore)}
          </span>
          <span className="text-sm font-bold text-[#777777]">/100</span>
        </div>
        <p className="text-[11px] text-[#777777] mt-2 font-medium">
          Highest recorded overall score
        </p>
      </div>

      {/* Progress Velocity Card */}
      <div className="p-5 rounded-[12px] border-2 border-[#e5e5e5] bg-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
            Progress Trajectory
          </span>
          <div className="w-8 h-8 rounded-[8px] bg-[#f0f9ff] border border-[#1cb0f6] flex items-center justify-center text-[#1cb0f6]">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div>
          <span className={`inline-block px-2.5 py-1 rounded-[12px] text-xs font-bold uppercase tracking-[0.053em] border ${trendBadge.color}`}>
            {trendBadge.label}
          </span>
        </div>
        <p className="text-[11px] text-[#777777] mt-2 font-medium">
          Evaluated via rolling session moving average
        </p>
      </div>

      {/* Focus Area Card */}
      <div className="p-5 rounded-[12px] border-2 border-[#e5e5e5] bg-white flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#777777] uppercase tracking-[0.053em]">
            Key Takeaway
          </span>
          <div className="w-8 h-8 rounded-[8px] bg-[#fff9f0] border border-[#ff9600] flex items-center justify-center text-[#ff9600]">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <p className="text-xs font-bold text-[#042c60] line-clamp-2 leading-snug">
          {topWeakness || topStrength || 'Maintain continuous technical practice sessions.'}
        </p>
        <p className="text-[11px] text-[#777777] mt-2 font-medium">
          AI recommended growth priority
        </p>
      </div>
    </div>
  );
}
