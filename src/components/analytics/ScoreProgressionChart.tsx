'use client';

import React, { useState } from 'react';

export interface ScoreDataPoint {
  id: string;
  sessionId: string;
  date: string;
  roleTitle: string;
  overallScore: number;
  technicalScore?: number;
  communicationScore?: number;
}

interface ScoreProgressionChartProps {
  data: ScoreDataPoint[];
  height?: number;
}

export function ScoreProgressionChart({
  data,
  height = 240,
}: ScoreProgressionChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ScoreDataPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#e5e5e5] rounded-[12px] bg-white text-center"
        style={{ minHeight: height }}
      >
        <span className="text-sm font-bold text-[#777777] uppercase tracking-[0.053em]">
          No Historical Sessions Yet
        </span>
        <p className="text-xs text-[#777777] mt-1 max-w-sm">
          Complete your first mock interview to track longitudinal score progression.
        </p>
      </div>
    );
  }

  const paddingX = 40;
  const paddingY = 32;
  const width = 600;
  const effectiveWidth = width - paddingX * 2;
  const effectiveHeight = height - paddingY * 2;

  const minScore = 0;
  const maxScore = 100;

  const points = data.map((d, index) => {
    const x =
      data.length === 1
        ? width / 2
        : paddingX + (index / (data.length - 1)) * effectiveWidth;
    const y =
      paddingY +
      effectiveHeight -
      ((d.overallScore - minScore) / (maxScore - minScore)) * effectiveHeight;
    return { x, y, data: d };
  });

  const pathD =
    points.length === 1
      ? ''
      : points.reduce((acc, curr, idx) => {
          if (idx === 0) return `M ${curr.x} ${curr.y}`;
          return `${acc} L ${curr.x} ${curr.y}`;
        }, '');

  const fillPathD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].x} ${paddingY + effectiveHeight} L ${points[0].x} ${paddingY + effectiveHeight} Z`
      : '';

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        style={{ maxHeight: height }}
      >
        {[0, 25, 50, 75, 100].map((score) => {
          const y =
            paddingY +
            effectiveHeight -
            ((score - minScore) / (maxScore - minScore)) * effectiveHeight;
          return (
            <g key={score}>
              <line
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#e5e5e5"
                strokeWidth="1.5"
                strokeDasharray={score === 0 || score === 100 ? undefined : '4 4'}
              />
              <text
                x={paddingX - 8}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-[#777777] font-bold"
                fontFamily="inherit"
              >
                {score}
              </text>
            </g>
          );
        })}

        {fillPathD && (
          <path
            d={fillPathD}
            fill="#d7ffb8"
            opacity="0.45"
          />
        )}

        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#46a302"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(0, 2)"
          />
        )}

        {pathD && (
          <path
            d={pathD}
            fill="none"
            stroke="#58cc02"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {points.map((pt, idx) => {
          const isHovered = hoveredPoint?.id === pt.data.id;
          return (
            <g key={pt.data.id || idx}>
              <circle
                cx={pt.x}
                cy={pt.y + 2}
                r={isHovered ? 8 : 6}
                fill="#46a302"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 8 : 6}
                fill={isHovered ? '#a5ed6e' : '#58cc02'}
                stroke="#ffffff"
                strokeWidth="3"
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => {
                  setHoveredPoint(pt.data);
                  setHoverPos({ x: pt.x, y: pt.y });
                }}
                onMouseLeave={() => {
                  setHoveredPoint(null);
                  setHoverPos(null);
                }}
              />
            </g>
          );
        })}
      </svg>

      {hoveredPoint && hoverPos && (
        <div
          className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 bg-white border-2 border-[#042c60] rounded-[12px] p-3 text-xs shadow-none tracking-[0.053em]"
          style={{
            left: `${(hoverPos.x / width) * 100}%`,
            top: `${(hoverPos.y / height) * 100}%`,
          }}
        >
          <div className="font-extrabold text-[#042c60] uppercase text-[11px] mb-1">
            {hoveredPoint.roleTitle}
          </div>
          <div className="flex items-center space-x-2 text-[#4b4b4b] font-medium">
            <span>Overall Score:</span>
            <span className="font-extrabold text-[#58cc02] text-sm">
              {hoveredPoint.overallScore}%
            </span>
          </div>
          <div className="text-[10px] text-[#777777] font-semibold mt-0.5">
            {hoveredPoint.date}
          </div>
        </div>
      )}
    </div>
  );
}
