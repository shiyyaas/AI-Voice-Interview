import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { initiateVapiCall } from '@/lib/interview/vapi-server';
import type {
  InitiateVapiSessionRequest,
  InitiateVapiSessionResponse,
} from '@/lib/interview/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InitiateVapiSessionRequest;
    const { session_id, config_id, system_prompt, assistant_id, customer_phone_number } = body;

    if (!session_id || typeof session_id !== 'string') {
      return NextResponse.json<InitiateVapiSessionResponse>(
        {
          success: false,
          session_id: '',
          vapi_call_id: '',
          error: 'Field "session_id" is required and must be a valid UUID string.',
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // 1. Fetch target session record
    const { data: session, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('id, config_id, session_status, vapi_call_id')
      .eq('id', session_id)
      .maybeSingle();

    if (sessionError) {
      console.error('[InterviewStartRoute] Failed to query session:', sessionError);
      return NextResponse.json<InitiateVapiSessionResponse>(
        {
          success: false,
          session_id,
          vapi_call_id: '',
          error: `Database error querying session: ${sessionError.message}`,
        },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json<InitiateVapiSessionResponse>(
        {
          success: false,
          session_id,
          vapi_call_id: '',
          error: `Interview session "${session_id}" not found.`,
        },
        { status: 404 }
      );
    }

    // 2. Resolve system prompt from request or from linked config
    let resolvedSystemPrompt = system_prompt;
    let resolvedAssistantId = assistant_id;
    const effectiveConfigId = config_id || session.config_id;

    if (!resolvedSystemPrompt && effectiveConfigId) {
      const { data: config, error: configError } = await supabase
        .from('interview_configs')
        .select('system_prompt, vapi_assistant_id')
        .eq('id', effectiveConfigId)
        .maybeSingle();

      if (configError) {
        console.warn('[InterviewStartRoute] Failed to query linked config:', configError);
      } else if (config) {
        resolvedSystemPrompt = config.system_prompt || undefined;
        if (!resolvedAssistantId) {
          resolvedAssistantId = config.vapi_assistant_id || undefined;
        }
      }
    }

    if (!resolvedSystemPrompt) {
      resolvedSystemPrompt =
        'You are a professional technical interviewer conducting a mock interview. Ask one direct question at a time.';
    }

    // 3. Initiate outbound handshake to Vapi with agent config structure
    const vapiResult = await initiateVapiCall({
      systemPrompt: resolvedSystemPrompt,
      assistantId: resolvedAssistantId,
      customerPhoneNumber: customer_phone_number,
      metadata: {
        sessionId: session_id,
        configId: effectiveConfigId || null,
      },
    });

    const vapiCallId = vapiResult.callId;

    // 4. Save resulting vapi_call_id back into interview_sessions record
    const { error: sessionUpdateError } = await supabase
      .from('interview_sessions')
      .update({
        vapi_call_id: vapiCallId,
        session_status: 'connecting',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (sessionUpdateError) {
      console.error('[InterviewStartRoute] Failed to update session with vapi_call_id:', sessionUpdateError);
      return NextResponse.json<InitiateVapiSessionResponse>(
        {
          success: false,
          session_id,
          vapi_call_id: vapiCallId,
          error: `Session update failed: ${sessionUpdateError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json<InitiateVapiSessionResponse>(
      {
        success: true,
        session_id,
        vapi_call_id: vapiCallId,
        web_call_url: vapiResult.webCallUrl,
        token: vapiResult.token,
        assistant_id: resolvedAssistantId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[InterviewStartRoute] Error initiating Vapi session:', error);
    return NextResponse.json<InitiateVapiSessionResponse>(
      {
        success: false,
        session_id: '',
        vapi_call_id: '',
        error: error.message || 'Internal server error initiating voice agent session.',
      },
      { status: 500 }
    );
  }
}
