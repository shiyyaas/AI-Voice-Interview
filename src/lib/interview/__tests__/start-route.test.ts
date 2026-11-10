import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as startRouteHandler } from '@/app/api/interview/start/route';
import * as supabaseServer from '@/lib/supabase/server';
import * as vapiServer from '@/lib/interview/vapi-server';

describe('POST /api/interview/start API Route', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects missing session_id', async () => {
    const req = new NextRequest('http://localhost/api/interview/start', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await startRouteHandler(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('session_id');
  });

  it('returns 404 if session is not found', async () => {
    const mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          })),
        })),
      })),
    };

    vi.spyOn(supabaseServer, 'getSupabaseServerClient').mockReturnValue(mockSupabase as any);

    const req = new NextRequest('http://localhost/api/interview/start', {
      method: 'POST',
      body: JSON.stringify({ session_id: 'non-existent-uuid' }),
    });

    const res = await startRouteHandler(req);
    expect(res.status).toBe(404);
  });

  it('performs Vapi handshake and persists vapi_call_id to session', async () => {
    const sessionId = 'session-1234';
    const configId = 'config-5678';
    const expectedCallId = 'vapi-call-999';

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
                    config_id: configId,
                    session_status: 'idle',
                    vapi_call_id: null,
                  },
                  error: null,
                }),
              })),
            })),
            update: updateMock,
          };
        }
        if (table === 'interview_configs') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    system_prompt: 'Mock Interview Prompt instructions.',
                    vapi_assistant_id: 'asst-123',
                  },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {} as any;
      }),
    };

    vi.spyOn(supabaseServer, 'getSupabaseServerClient').mockReturnValue(mockSupabase as any);
    vi.spyOn(vapiServer, 'initiateVapiCall').mockResolvedValue({
      callId: expectedCallId,
      webCallUrl: 'https://vapi.ai/call/vapi-call-999',
      token: 'tok-123',
      rawResponse: { id: expectedCallId },
    });

    const req = new NextRequest('http://localhost/api/interview/start', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });

    const res = await startRouteHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.vapi_call_id).toBe(expectedCallId);
    expect(data.session_id).toBe(sessionId);

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        vapi_call_id: expectedCallId,
        session_status: 'connecting',
      })
    );
  });
});
