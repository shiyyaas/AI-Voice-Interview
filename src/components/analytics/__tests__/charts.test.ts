import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { ScoreProgressionChart } from '../ScoreProgressionChart';
import { CompetencyRadarMatrix } from '../CompetencyRadarMatrix';
import { AnalyticsStatsSummary } from '../AnalyticsStatsSummary';

describe('Data Visualization Modules & Pure SVG Charts', () => {
  it('ScoreProgressionChart handles empty data gracefully', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ScoreProgressionChart, { data: [] })
    );
    expect(html).toContain('No Interview Records Yet');
  });

  it('ScoreProgressionChart generates SVG paths with multiple score points', () => {
    const sampleData = [
      { id: '1', sessionNumber: 1, score: 65, date: 'May 1' },
      { id: '2', sessionNumber: 2, score: 82, date: 'May 2' },
      { id: '3', sessionNumber: 3, score: 90, date: 'May 3' },
    ];
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(ScoreProgressionChart, { data: sampleData, benchmarkScore: 80 })
    );
    expect(html).toContain('<svg');
    expect(html).toContain('#1');
    expect(html).toContain('#2');
    expect(html).toContain('#3');
  });

  it('CompetencyRadarMatrix renders pure SVG radar matrix without error', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(CompetencyRadarMatrix, {
        metrics: {
          syntax_accuracy: 85,
          system_architecture: 72,
          verbal_communication_fluency: 90,
        },
      })
    );
    expect(html).toContain('<svg');
    expect(html).toContain('Syntax Accuracy');
    expect(html).toContain('System Architecture');
    expect(html).toContain('Verbal Fluency');
  });

  it('AnalyticsStatsSummary renders aggregate metrics correctly', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(AnalyticsStatsSummary, {
        averageScore: 78,
        highestScore: 92,
        completedSessionsCount: 4,
        trend: 'improving',
        topStrength: 'Strong communication',
        topWeakness: 'Edge case handling',
      })
    );
    expect(html).toContain('78');
    expect(html).toContain('92');
    expect(html).toContain('Upward Trend');
  });
});
