import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/interview/evaluate/route';
import {
  formatTranscriptForEvaluation,
  generateDeterministicEvaluation,
  evaluateInterviewTranscript,
} from '@/lib/interview/evaluation';

// Mock getSupabaseServerClient
const mockSingle = vi.fn();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockMaybeSingle = vi.fn();
const mockInsert = vi.fn().mockReturnThis();
const mockUpdate = vi.fn().mockReturnThis();

const mockFrom = vi.fn((table: string) => {
  if (table === 'interview_sessions') {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: mockMaybeSingle,
        }),
      }),
    };
  }
  if (table === 'interview_feedback') {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
      insert: () => ({
        select: () => ({
          single: vi.fn().mockResolvedValue({
            data: { id: 'feedback-uuid-123', overall_score: 85 },
            error: null,
          }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: vi.fn().mockResolvedValue({
              data: { id: 'feedback-uuid-123', overall_score: 85 },
              error: null,
            }),
          }),
        }),
      }),
    };
  }
  return {};
});

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: () => ({
    from: mockFrom,
  }),
}));

describe('Transcript Evaluation Service & /api/interview/evaluate Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatTranscriptForEvaluation', () => {
    it('formats array of speaker transcript segments into clean text', () => {
      const messages = [
        { role: 'assistant', content: 'What is Next.js SSR?' },
        { role: 'user', content: 'It renders HTML on the server before sending to the client.' },
      ];
      const result = formatTranscriptForEvaluation(messages);
      expect(result).toContain('ASSISTANT: What is Next.js SSR?');
      expect(result).toContain('USER: It renders HTML on the server before sending to the client.');
    });

    it('formats plain text or json string transcript correctly', () => {
      const jsonStr = JSON.stringify([
        { role: 'assistant', text: 'Explain React hooks.' },
        { role: 'user', text: 'Hooks let you use state and lifecycle methods.' },
      ]);
      const result = formatTranscriptForEvaluation(jsonStr);
      expect(result).toContain('ASSISTANT: Explain React hooks.');
      expect(result).toContain('USER: Hooks let you use state');
    });
  });

  describe('generateDeterministicEvaluation', () => {
    it('produces valid evaluation payload tracking required schema keys', () => {
      const res = generateDeterministicEvaluation('USER: Here is my technical explanation of distributed caches.');
      expect(res).toHaveProperty('overall_score');
      expect(res).toHaveProperty('strengths');
      expect(res).toHaveProperty('weaknesses');
      expect(res).toHaveProperty('suggested_exercises');
      expect(res).toHaveProperty('competency_metrics');
      expect(res.competency_metrics).toHaveProperty('syntax_accuracy');
      expect(res.competency_metrics).toHaveProperty('system_architecture');
      expect(res.competency_metrics).toHaveProperty('verbal_communication_fluency');
      expect(Array.isArray(res.strengths)).toBe(true);
      expect(Array.isArray(res.weaknesses)).toBe(true);
      expect(Array.isArray(res.suggested_exercises)).toBe(true);
    });
  });

  describe('POST /api/interview/evaluate handler', () => {
    it('returns 400 when neither session_id nor transcript is provided', async () => {
      const req = new NextRequest('http://localhost:3000/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toContain('Missing required field');
    });

    it('evaluates provided transcript directly and returns required payload structure', async () => {
      const req = new NextRequest('http://localhost:3000/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: [
            { role: 'assistant', content: 'What is database sharding?' },
            {
              role: 'user',
              content:
                'Sharding is horizontal partitioning of data across multiple database instances to scale read and write throughput.',
            },
          ],
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(typeof json.overall_score).toBe('number');
      expect(Array.isArray(json.strengths)).toBe(true);
      expect(Array.isArray(json.weaknesses)).toBe(true);
      expect(Array.isArray(json.suggested_exercises)).toBe(true);
      expect(json.competency_metrics).toHaveProperty('syntax_accuracy');
      expect(json.competency_metrics).toHaveProperty('system_architecture');
      expect(json.competency_metrics).toHaveProperty('verbal_communication_fluency');
    });

    it('looks up session transcript from Supabase and stores feedback ledger record', async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'test-session-123',
          user_id: 'user-abc',
          transcript: [
            { role: 'assistant', text: 'Explain idempotency.' },
            { role: 'user', text: 'An idempotent operation produces the same result no matter how many times executed.' },
          ],
          interview_configs: {
            role_title: 'Senior Backend Engineer',
            experience_level: 'senior',
            technical_stack: ['Node.js', 'PostgreSQL'],
          },
        },
        error: null,
      });

      const req = new NextRequest('http://localhost:3000/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'test-session-123',
        }),
      });

      const res = await POST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.session_id).toBe('test-session-123');
      expect(json.feedback_id).toBe('feedback-uuid-123');
      expect(typeof json.overall_score).toBe('number');
      expect(json.strengths.length).toBeGreaterThan(0);
    });
  });
});
