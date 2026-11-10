import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as webhookRouteHandler } from '@/app/api/webhooks/vapi/route';
import * as supabaseServer from '@/lib/supabase/server';

describe('POST /api/webhooks/vapi Edge Webhook', () => {
  const originalSecret = process.env.VAPI_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.VAPI_WEBHOOK_SECRET;
  });

  afterEach(() => {
    if (originalSecret) {
      process.env.VAPI_WEBHOOK_SECRET = originalSecret;
    } else {
      delete process.env.VAPI_WEBHOOK_SECRET;
    }
  });

  it('rejects request if secret does not match configured secret', async () => {
    process.env.VAPI_WEBHOOK_SECRET = 'secret-pass-123';

    const req = new NextRequest('http://localhost/api/webhooks/vapi', {
      method: 'POST',
      headers: {
        'x-vapi-secret': 'wrong-secret',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          type: 'end-of-call-report',
        },
      }),
    });

    const res = await webhookRouteHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Unauthorized');
  });

  it('acknowledges non-end-of-call-report event without mutating database', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/vapi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          type: 'status-update',
          status: 'in-progress',
        },
      }),
    });

    const res = await webhookRouteHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
    expect(data.message).toContain('status-update');
  });

  it('rejects end-of-call-report missing call ID', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/vapi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          type: 'end-of-call-report',
          call: {},
        },
      }),
    });

    const res = await webhookRouteHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('call ID');
  });

  it('extracts transcriptSegments and atomically updates session to completed with transcript JSON', async () => {
    const vapiCallId = 'vapi-test-call-456';
    const sessionId = 'session-test-uuid-789';

    const mockSegments = [
      {
        role: 'assistant',
        transcript: 'Hello! Welcome to your technical interview.',
        timestamp: 1000,
      },
      {
        role: 'user',
        transcript: 'Hi, I am excited to be here.',
        timestamp: 3000,
      },
      {
        role: 'assistant',
        transcript: "Thank you for your time. That covers all my technical questions. I'm compiling your session breakdown now.",
        timestamp: 10000,
      },
    ];

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const mockSupabase = {
      from: vi.fn((table: string) => {
        if (table === 'interview_sessions') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: sessionId,
                    session_status: 'active',
                    metadata: { initialKey: 'value' },
                  },
                  error: null,
                }),
              })),
            })),
            update: updateMock,
          };
        }
        return {} as any;
      }),
    };

    vi.spyOn(supabaseServer, 'getSupabaseServerClient').mockReturnValue(mockSupabase as any);

    const payload = {
      message: {
        type: 'end-of-call-report',
        call: {
          id: vapiCallId,
          startedAt: '2025-01-01T12:00:00.000Z',
          endedAt: '2025-01-01T12:05:00.000Z',
          cost: 0.12,
        },
        artifact: {
          transcriptSegments: mockSegments,
          recordingUrl: 'https://vapi-recordings.s3.amazonaws.com/rec-123.mp3',
        },
        endedReason: 'customer-ended-call',
        analysis: {
          summary: 'The candidate answered 5 technical questions successfully.',
        },
      },
    };

    const req = new NextRequest('http://localhost/api/webhooks/vapi', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const res = await webhookRouteHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.session_id).toBe(sessionId);
    expect(data.vapi_call_id).toBe(vapiCallId);
    expect(data.status).toBe('completed');
    expect(data.transcriptSegmentsCount).toBe(3);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        session_status: 'completed',
        transcript: mockSegments,
        ended_at: '2025-01-01T12:05:00.000Z',
        duration_seconds: 300,
        metadata: expect.objectContaining({
          initialKey: 'value',
          endedReason: 'customer-ended-call',
          recordingUrl: 'https://vapi-recordings.s3.amazonaws.com/rec-123.mp3',
          vapiCost: 0.12,
        }),
      })
    );
  });
});
