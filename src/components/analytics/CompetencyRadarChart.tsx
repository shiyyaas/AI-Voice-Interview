'use client';

import React, { useState } from 'react';
import type { CompetencyMetrics } from '@/lib/supabase/types';

interface CompetencyRadarChartProps {
  metrics: CompetencyMetrics;
  size?: number;
}

interface AxisConfig {
  key: keyof CompetencyMetrics;
  label: string;
  shortLabel: string;
}

const AXES: AxisConfig[] = [
  { key: 'syntaxAccuracy', label: 'Syntax Accuracy', shortLabel: 'Syntax' },
  { key: 'systemArchitecture', label: 'System Architecture', shortLabel: 'Architecture' },
  { key: 'verbalCommunication', label: 'Verbal Fluency', shortLabel: 'Communication' },
  { key: 'problemSolving', label: 'Problem Solving', shortLabel: 'Problem Solving' },
  { key: 'codeQuality', label: 'Code Quality', shortLabel: 'Code Quality' },
];

export function CompetencyRadarChart({
  metrics,
  size = 320,
}: CompetencyRadarChartProps) {
  const [activeAxis, setActiveAxis] = useState<AxisConfig | null>(null);

  const center = size / 2;
  const radius = (size / 2) - 48;
  const totalAxes = AXES.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  const levels = [0.25, 0.5, 0.75, 1.0];

  const getRingCoordinates = (scale: number): string => {
    return AXES.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const x = center + radius * scale * Math.cos(angle);
      const y = center + radius * scale * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };

  const dataPoints = AXES.map((axis, i) => {
    const value = Math.max(0, Math.min(100, metrics[axis.key] ?? 70));
    const scale = value / 100;
    const angle = i * angleStep - Math.PI / 2;
    const x = center + radius * scale * Math.cos(angle);
    const y = center + radius * scale * Math.sin(angle);
    return { x, y, value, axis };
  });

  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[340px] h-auto overflow-visible"
      >
        {levels.map((lvl) => (
          <polygon
            key={lvl}
            points={getRingCoordinates(lvl)}
            fill={lvl === 1.0 ? '#f7fff0' : 'none'}
            stroke="#e5e5e5"
            strokeWidth="1.5"
            strokeDasharray={lvl === 1.0 ? undefined : '3 3'}
          />
        ))}

        {AXES.map((axis, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);

          const labelDist = radius + 22;
          const labelX = center + labelDist * Math.cos(angle);
          const labelY = center + labelDist * Math.sin(angle);

          return (
            <g key={axis.key}>
              <line
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke="#e5e5e5"
                strokeWidth="1.5"
              />
              <text
                x={labelX}
                y={labelY + 4}
                textAnchor="middle"
                className="text-[11px] font-extrabold fill-[#042c60] uppercase tracking-[0.053em]"
              >
                {axis.shortLabel}
              </text>
            </g>
          );
        })}

        <polygon
          points={dataPolygon}
          fill="#46a302"
          opacity="0.3"
          transform="translate(0, 3)"
        />

        <polygon
          points={dataPolygon}
          fill="#a5ed6e"
          fillOpacity="0.4"
          stroke="#58cc02"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {dataPoints.map((pt) => {
          const isActive = activeAxis?.key === pt.axis.key;
          return (
            <g key={pt.axis.key}>
              <circle
                cx={pt.x}
                cy={pt.y + 2}
                r={isActive ? 7 : 5}
                fill="#46a302"
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isActive ? 7 : 5}
                fill={isActive ? '#1cb0f6' : '#58cc02'}
                stroke="#ffffff"
                strokeWidth="2.5"
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => setActiveAxis(pt.axis)}
                onMouseLeave={() => setActiveAxis(null)}
              />
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-center space-x-2">
        {activeAxis ? (
          <div className="px-3 py-1 rounded-[12px] bg-[#d7ffb8] border-2 border-[#a5ed6e] text-xs font-bold text-[#042c60] uppercase tracking-[0.053em]">
            {activeAxis.label}: <span className="text-[#58cc02] font-extrabold">{metrics[activeAxis.key]}%</span>
          </div>
        ) : (
          <div className="text-[11px] font-bold text-[#777777] uppercase tracking-[0.053em]">
            Hover vertices to view metrics
          </div>
        )}
      </div>
    </div>
  );
}
