import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { describe, it, expect } from 'vitest';
import { InterviewReviewDrawer, SessionReviewData } from '../InterviewReviewDrawer';

describe('InterviewReviewDrawer & Portfolio Export Component', () => {
  const sampleData: SessionReviewData = {
    sessionId: 'session-xyz-987',
    roleTitle: 'Senior Full-Stack Engineer',
    experienceLevel: 'Senior',
    date: 'May 10',
    durationSeconds: 600,
    overallScore: 84,
    strengths: ['Effective architectural reasoning', 'Clean modular design explanation'],
    weaknesses: ['Could mention rate limiting strategies in distributed scenarios'],
    suggestedExercises: ['Implement token-bucket algorithm in TypeScript'],
    competencyMetrics: {
      syntax_accuracy: 88,
      system_architecture: 82,
      verbal_communication_fluency: 85,
      problem_solving: 83,
      practical_execution: 81,
    },
    transcript: [
      { role: 'assistant', text: 'How do you design a real-time polling fallback?' },
      { role: 'user', text: 'By switching from WebSockets to SSE or exponential backoff long polling.' },
    ],
    keyTakeaways: 'Excellent performance demonstrating strong domain knowledge.',
  };

  it('renders nothing when isOpen is false', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(InterviewReviewDrawer, {
        isOpen: false,
        onClose: () => {},
        sessionData: sampleData,
      })
    );
    expect(html).toBe('');
  });

  it('renders full portfolio review content when isOpen is true', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      React.createElement(InterviewReviewDrawer, {
        isOpen: true,
        onClose: () => {},
        sessionData: sampleData,
      })
    );
    expect(html).toContain('Session Portfolio');
    expect(html).toContain('Senior Full-Stack Engineer');
    expect(html).toContain('84%');
    expect(html).toContain('Syntax Accuracy');
    expect(html).toContain('Effective architectural reasoning');
    expect(html).toContain('Download .MD');
    expect(html).toContain('Print View');
    expect(html).toContain('How do you design a real-time polling fallback?');
  });
});
