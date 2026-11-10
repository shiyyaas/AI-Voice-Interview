'use client';

import React, { useState } from 'react';

export interface ScoreDataPoint {
  id: string;
  sessionNumber: number;
  score: number;
  roleTitle?: string;
  date: string;
}

export interface ScoreProgressionChartProps {
  data: ScoreDataPoint[];
  benchmarkScore?: number;
  className?: string;
  onSelectSession?: (id: string) => void;
}

export function ScoreProgressionChart({
  data,
  benchmarkScore = 75,
  className = '',
  onSelectSession,
}: ScoreProgressionChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ScoreDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className={`p-8 rounded-[12px] border-2 border-[#e5e5e5] bg-white flex flex-col items-center justify-center text-center min-h-[260px] ${className}`}>
        <div className="w-12 h-12 rounded-[12px] bg-[#d7ffb8] border-2 border-[#a5ed6e] flex items-center justify-center text-[#58cc02] font-black text-xl mb-3">
          📈
        </div>
        <h4 className="font-extrabold text-[#042c60] text-sm uppercase tracking-[0.053em] mb-1">
          No Interview Records Yet
        </h4>
        <p className="text-xs text-[#777777] max-w-sm">
          Complete your first mock interview voice session to start charting your historical score progression.
        </p>
      </div>
    );
  }

  // Chart dimensions & coordinate mapping
  const width = 640;
  const height = 260;
  const paddingX = 48;
  const paddingTop = 32;
  const paddingBottom = 48;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingTop - paddingBottom;

  const minScore = 0;
  const maxScore = 100;

  const getX = (index: number) => {
    if (data.length <= 1) return width / 2;
    return paddingX + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return paddingTop + chartHeight - (clamped / 100) * chartHeight;
  };

  // Generate SVG path for score progression
  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.score),
    data: d,
  }));

  const linePath = points.length === 1
    ? ''
    : points.reduce((acc, curr, idx) => {
        return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
      }, '');

  // Fill area under curve
  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1].x} ${getY(0)} L ${points[0].x} ${getY(0)} Z`
    : '';

  const benchmarkY = getY(benchmarkScore);

  return (
    <div className={`p-6 rounded-[12px] border-2 border-[#e5e5e5] bg-white flex flex-col justify-between relative ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#58cc02]" />
            <h3 className="font-extrabold text-sm sm:text-base text-[#042c60] uppercase tracking-[0.053em]">
              Interview Performance Progression
            </h3>
          </div>
          <p className="text-xs text-[#777777] mt-0.5">
            Chronological overall scores across {data.length} completed session{data.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-4 text-xs font-bold uppercase tracking-[0.053em]">
          <div className="flex items-center space-x-1.5 text-[#58cc02]">
            <span className="w-3 h-3 rounded-[4px] bg-[#58cc02]" />
            <span>Score</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[#1cb0f6]">
            <span className="w-3.5 h-0.5 bg-[#1cb0f6]" />
            <span>Target ({benchmarkScore}%)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px] select-none"
        >
          {/* Grid lines (25%, 50%, 75%, 100%) */}
          {[25, 50, 75, 100].map((level) => {
            const y = getY(level);
            return (
              <g key={level}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#f0f0f0"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#777777] font-bold text-[10px]"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Benchmark target line */}
          <line
            x1={paddingX}
            y1={benchmarkY}
            x2={width - paddingX}
            y2={benchmarkY}
            stroke="#1cb0f6"
            strokeWidth="2"
            strokeDasharray="6 3"
          />

          {/* Flat filled area under curve */}
          {areaPath && (
            <path
              d={areaPath}
              fill="#d7ffb8"
              opacity="0.55"
            />
          )}

          {/* Score line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#58cc02"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredPoint?.id === pt.data.id;
            return (
              <g
                key={pt.data.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt.data)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => onSelectSession?.(pt.data.id)}
              >
                {/* 3D Tactile Outer Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 8 : 6}
                  fill="#ffffff"
                  stroke="#58cc02"
                  strokeWidth={isHovered ? 4 : 3}
                  className="transition-all duration-150"
                />
                {/* Inner dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 3.5 : 2.5}
                  fill="#042c60"
                />

                {/* X-axis Session Label */}
                <text
                  x={pt.x}
                  y={height - paddingBottom + 20}
                  textAnchor="middle"
                  className="fill-[#4b4b4b] font-bold text-[11px]"
                >
                  #{pt.data.sessionNumber}
                </text>
                <text
                  x={pt.x}
                  y={height - paddingBottom + 34}
                  textAnchor="middle"
                  className="fill-[#777777] font-medium text-[9px]"
                >
                  {pt.data.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tactile Score Hover Card Callout */}
      {hoveredPoint && (
        <div className="mt-3 p-3 rounded-[12px] bg-[#f7fff0] border-2 border-[#58cc02] flex items-center justify-between text-xs font-bold text-[#042c60]">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded-[12px] bg-[#58cc02] text-white text-[10px]">
              Session #{hoveredPoint.sessionNumber}
            </span>
            <span>{hoveredPoint.roleTitle || 'Mock Interview'}</span>
          </div>
          <div className="text-right">
            <span className="text-[#58cc02] text-base font-black mr-1">
              {hoveredPoint.score}%
            </span>
            <span className="text-[#777777] text-[10px] uppercase">Overall Score</span>
          </div>
        </div>
      )}
    </div>
  );
}
