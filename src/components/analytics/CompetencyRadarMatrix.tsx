'use client';

import React, { useState } from 'react';

export interface CompetencyAxis {
  label: string;
  key: string;
  score: number; // 0 - 100
  fullMark?: number;
}

export interface CompetencyRadarMatrixProps {
  metrics: {
    syntax_accuracy?: number;
    system_architecture?: number;
    verbal_communication_fluency?: number;
    problem_solving?: number;
    practical_execution?: number;
    [key: string]: number | undefined;
  };
  className?: string;
}

export function CompetencyRadarMatrix({
  metrics,
  className = '',
}: CompetencyRadarMatrixProps) {
  const [activeAxis, setActiveAxis] = useState<CompetencyAxis | null>(null);

  const axes: CompetencyAxis[] = [
    {
      label: 'Syntax Accuracy',
      key: 'syntax_accuracy',
      score: metrics.syntax_accuracy ?? 75,
    },
    {
      label: 'System Architecture',
      key: 'system_architecture',
      score: metrics.system_architecture ?? 70,
    },
    {
      label: 'Verbal Fluency',
      key: 'verbal_communication_fluency',
      score: metrics.verbal_communication_fluency ?? 80,
    },
    {
      label: 'Problem Solving',
      key: 'problem_solving',
      score: metrics.problem_solving ?? 78,
    },
    {
      label: 'Practical Execution',
      key: 'practical_execution',
      score: metrics.practical_execution ?? 72,
    },
  ];

  const size = 320;
  const center = size / 2;
  const radius = size * 0.38;
  const totalAxes = axes.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Grid concentric rings (20%, 40%, 60%, 80%, 100%)
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, ratio: number) => {
    // Start from top (- PI / 2)
    const angle = index * angleStep - Math.PI / 2;
    return {
      x: center + Math.cos(angle) * (radius * ratio),
      y: center + Math.sin(angle) * (radius * ratio),
    };
  };

  // Generate outer polygon points for values
  const polygonPoints = axes.map((axis, i) => {
    const ratio = Math.max(0.1, Math.min(1.0, axis.score / 100));
    return getCoordinates(i, ratio);
  });

  const polygonPath = polygonPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '') + ' Z';

  return (
    <div className={`p-6 rounded-[12px] border-2 border-[#e5e5e5] bg-white flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1cb0f6]" />
            <h3 className="font-extrabold text-sm sm:text-base text-[#042c60] uppercase tracking-[0.053em]">
              Competency Radar Matrix
            </h3>
          </div>
          <span className="text-[11px] font-bold text-[#777777] uppercase tracking-[0.053em]">
            Multi-Skill Breakdown
          </span>
        </div>
        <p className="text-xs text-[#777777] mb-4">
          Core technical and communication proficiencies calculated from feedback metadata.
        </p>
      </div>

      {/* Pure SVG Spider/Radar Canvas */}
      <div className="flex justify-center items-center py-2">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[280px] sm:max-w-[300px] h-auto select-none"
        >
          {/* Concentric Polygons */}
          {rings.map((ring) => {
            const ringPath = axes
              .map((_, i) => {
                const pt = getCoordinates(i, ring);
                return `${pt.x},${pt.y}`;
              })
              .join(' ');

            return (
              <polygon
                key={ring}
                points={ringPath}
                fill="none"
                stroke="#e5e5e5"
                strokeWidth="1.5"
                strokeDasharray={ring === 1.0 ? 'none' : '3 3'}
              />
            );
          })}

          {/* Radial Axis Spokes */}
          {axes.map((_, i) => {
            const outerPt = getCoordinates(i, 1.0);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke="#e5e5e5"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Filled Competency Polygon with Duolingo Palette */}
          <path
            d={polygonPath}
            fill="#d7ffb8"
            fillOpacity="0.65"
            stroke="#58cc02"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Data Vertices */}
          {polygonPoints.map((pt, i) => {
            const axis = axes[i];
            const isActive = activeAxis?.key === axis.key;
            return (
              <g
                key={axis.key}
                className="cursor-pointer"
                onMouseEnter={() => setActiveAxis(axis)}
                onMouseLeave={() => setActiveAxis(null)}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 6.5 : 4.5}
                  fill="#ffffff"
                  stroke="#58cc02"
                  strokeWidth="2.5"
                  className="transition-all duration-150"
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={2}
                  fill="#042c60"
                />
              </g>
            );
          })}

          {/* Text Labels at Axis Ends */}
          {axes.map((axis, i) => {
            const pt = getCoordinates(i, 1.18);
            const isTop = pt.y < center - 20;
            const isBottom = pt.y > center + 20;
            const isLeft = pt.x < center - 10;
            const isRight = pt.x > center + 10;

            const textAnchor = isLeft ? 'end' : isRight ? 'start' : 'middle';

            return (
              <text
                key={axis.key}
                x={pt.x}
                y={pt.y + 4}
                textAnchor={textAnchor}
                className="fill-[#042c60] font-extrabold text-[10px] tracking-[0.053em] uppercase cursor-pointer"
                onMouseEnter={() => setActiveAxis(axis)}
                onMouseLeave={() => setActiveAxis(null)}
              >
                {axis.label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Axis detail breakdown / active tooltip */}
      <div className="mt-2 pt-3 border-t border-[#e5e5e5]">
        {activeAxis ? (
          <div className="p-2.5 rounded-[12px] bg-[#f0f9ff] border-2 border-[#1cb0f6] flex items-center justify-between">
            <span className="text-xs font-bold text-[#042c60] uppercase tracking-[0.053em]">
              {activeAxis.label}
            </span>
            <span className="text-sm font-black text-[#1cb0f6]">
              {Math.round(activeAxis.score)} / 100
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {axes.slice(0, 4).map((axis) => (
              <div key={axis.key} className="flex items-center justify-between text-[#4b4b4b]">
                <span className="text-[11px] font-bold text-[#777777] truncate">{axis.label}:</span>
                <span className="font-extrabold text-[#042c60] ml-1">{Math.round(axis.score)}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
