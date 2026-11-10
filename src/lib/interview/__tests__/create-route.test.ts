import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as createRouteHandler } from '@/app/api/interview/create/route';
import * as supabaseServer from '@/lib/supabase/server';

describe('POST /api/interview/create API Route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects invalid payloads missing job_role', async () => {
    const req = new NextRequest('http://localhost/api/interview/create', {
      method: 'POST',
      body: JSON.stringify({
        job_role: '',
        experience_level: 'senior',
        tech_stack: ['TypeScript'],
        question_count: 5,
      }),
    });

    const res = await createRouteHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('job_role');
  });

  it('rejects invalid experience_level', async () => {
    const req = new NextRequest('http://localhost/api/interview/create', {
      method: 'POST',
      body: JSON.stringify({
        job_role: 'Backend Dev',
        experience_level: 'wizard',
        tech_stack: ['Node.js'],
        question_count: 5,
      }),
    });

    const res = await createRouteHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('experience_level');
  });

  it('rejects empty tech_stack array', async () => {
    const req = new NextRequest('http://localhost/api/interview/create', {
      method: 'POST',
      body: JSON.stringify({
        job_role: 'Backend Dev',
        experience_level: 'mid',
        tech_stack: [],
        question_count: 5,
      }),
    });

    const res = await createRouteHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('tech_stack');
  });

  it('rejects invalid question_count', async () => {
    const req = new NextRequest('http://localhost/api/interview/create', {
      method: 'POST',
      body: JSON.stringify({
        job_role: 'Backend Dev',
        experience_level: 'mid',
        tech_stack: ['Node.js'],
        question_count: 0,
      }),
    });

    const res = await createRouteHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('question_count');
  });

  it('successfully creates interview config and generates tailored prompt', async () => {
    const fakeConfigId = 'conf-1234-uuid';
    const fakeSessionId = 'sess-5678-uuid';

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'interview_configs') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: fakeConfigId },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: fakeConfigId },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'interview_sessions') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: fakeSessionId },
                  error: null,
                }),
              }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {} as any;
      }),
    };

    vi.spyOn(supabaseServer, 'getSupabaseServerClient').mockReturnValue(mockSupabase as any);

    const req = new NextRequest('http://localhost/api/interview/create', {
      method: 'POST',
      body: JSON.stringify({
        job_role: 'Full Stack Engineer',
        experience_level: 'senior',
        tech_stack: ['Next.js', 'PostgreSQL'],
        question_count: 5,
      }),
    });

    const res = await createRouteHandler(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.config_id).toBe(fakeConfigId);
    expect(data.session_id).toBe(fakeSessionId);
    expect(typeof data.system_prompt).toBe('string');
    expect(data.system_prompt).toContain("Thank you for your time. That covers all my technical questions. I'm compiling your session breakdown now.");
  });
});
