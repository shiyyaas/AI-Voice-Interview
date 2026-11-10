import { describe, it, expect } from 'vitest';
import {
  generateSessionPortfolioMarkdown,
  type PortfolioExportData,
} from '../session-portfolio';

describe('Session Portfolio Markdown Generator', () => {
  const mockData: PortfolioExportData = {
    sessionId: 'session-uuid-12345',
    roleTitle: 'Senior Full-Stack Engineer',
    candidateType: 'Guest Candidate',
    date: '2025-01-01',
    durationSeconds: 900,
    evaluation: {
      overall_score: 88,
      technical_score: 85,
      communication_score: 90,
      confidence_score: 87,
      strengths: ['Clear system architecture logic', 'Concise state machine breakdown'],
      weaknesses: ['Add deeper circuit breaker reasoning'],
      suggested_exercises: ['Build an idempotent queue consumer'],
      key_takeaways: 'Outstanding technical demonstration with high velocity.',
      competency_scores: {
        syntaxAccuracy: 88,
        systemArchitecture: 85,
        verbalCommunication: 90,
        problemSolving: 92,
        codeQuality: 86,
      },
    },
    transcript: [
      {
        id: '1',
        role: 'assistant',
        content: 'How do you structure database migrations?',
        timestamp: 1000,
      },
      {
        id: '2',
        role: 'user',
        content: 'I utilize expand-and-contract migrations.',
        timestamp: 2000,
      },
    ],
  };

  it('generates well-formatted Markdown with all required sections', () => {
    const md = generateSessionPortfolioMarkdown(mockData);

    expect(md).toContain('# Technical Interview Session Portfolio');
    expect(md).toContain('Senior Full-Stack Engineer');
    expect(md).toContain('session-uuid-12345');
    expect(md).toContain('**Overall Readiness Score:** **88 / 100**');
    expect(md).toContain('Competency Radar Matrix');
    expect(md).toContain('Syntax Accuracy');
    expect(md).toContain('System Architecture');
    expect(md).toContain('Clear system architecture logic');
    expect(md).toContain('Build an idempotent queue consumer');
    expect(md).toContain('Interviewer (AI)');
    expect(md).toContain('expand-and-contract migrations');
  });
});
