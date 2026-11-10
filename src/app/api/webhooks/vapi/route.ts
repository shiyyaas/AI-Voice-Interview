import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { VapiEndOfCallReportPayload, VapiTranscriptSegment } from '@/lib/interview/types';

export const runtime = 'edge';

function isValidWebhookSecret(req: NextRequest): boolean {
  const expectedSecret =
    process.env.VAPI_WEBHOOK_SECRET ||
    process.env.VAPI_SECRET_KEY ||
    process.env.WEBHOOK_SECRET;

  if (!expectedSecret) {
    return true;
  }

  const vapiSecretHeader =
    req.headers.get('x-vapi-secret') ||
    req.headers.get('x-vapi-signature') ||
    req.headers.get('authorization')?.replace('Bearer ', '');

  return vapiSecretHeader === expectedSecret;
}

export async function POST(req: NextRequest) {
  try {
    if (!isValidWebhookSecret(req)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing webhook credentials.' },
        { status: 401 }
      );
    }

    let payload: VapiEndOfCallReportPayload;
    try {
      payload = (await req.json()) as VapiEndOfCallReportPayload;
    } catch (parseErr) {
      return NextResponse.json(
        { error: 'Bad Request: Malformed JSON payload.' },
        { status: 400 }
      );
    }

    if (!payload || typeof payload !== 'object') {
      return NextResponse.json(
        { error: 'Bad Request: Payload must be a non-empty JSON object.' },
        { status: 400 }
      );
    }

    const message = payload.message || payload;
    const messageType = message.type || payload.type;

    if (messageType !== 'end-of-call-report') {
      return NextResponse.json({
        received: true,
        message: `Event type "${messageType}" acknowledged. No action required.`,
      });
    }

    const callData = message.call || payload.call;
    const vapiCallId = callData?.id || (message as any).callId || (payload as any).callId;

    if (!vapiCallId || typeof vapiCallId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: Missing or invalid call ID in end-of-call-report.' },
        { status: 400 }
      );
    }

    const artifact = message.artifact || payload.artifact;
    let transcriptSegments: VapiTranscriptSegment[] = [];

    if (artifact && Array.isArray(artifact.transcriptSegments)) {
      transcriptSegments = artifact.transcriptSegments;
    } else if (artifact && Array.isArray(artifact.messages)) {
      transcriptSegments = artifact.messages.map((m) => ({
        role: m.role || 'unknown',
        text: m.message || m.content || '',
        transcript: m.message || m.content || '',
        timestamp: m.time || Date.now(),
      }));
    } else if (artifact?.transcript && typeof artifact.transcript === 'string') {
      transcriptSegments = [
        {
          role: 'transcript',
          text: artifact.transcript,
          transcript: artifact.transcript,
          timestamp: Date.now(),
        },
      ];
    }

    const rawStartedAt = callData?.startedAt;
    const rawEndedAt = callData?.endedAt;
    const startedAt = typeof rawStartedAt === 'string' || typeof rawStartedAt === 'number'
      ? new Date(rawStartedAt).toISOString()
      : null;
    const endedAt = typeof rawEndedAt === 'string' || typeof rawEndedAt === 'number'
      ? new Date(rawEndedAt).toISOString()
      : new Date().toISOString();
    let durationSeconds = 0;

    if (startedAt && endedAt) {
      durationSeconds = Math.max(
        0,
        Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: session, error: queryError } = await supabase
      .from('interview_sessions')
      .select('id, metadata, session_status')
      .eq('vapi_call_id', vapiCallId)
      .maybeSingle();

    if (queryError) {
      console.error('[VapiWebhook] Error querying session for call ID:', queryError);
      return NextResponse.json(
        { error: `Database error querying session: ${queryError.message}` },
        { status: 500 }
      );
    }

    if (!session) {
      console.warn(`[VapiWebhook] No interview_session found for vapi_call_id: ${vapiCallId}`);
      return NextResponse.json(
        {
          received: true,
          warning: `Session for vapi_call_id ${vapiCallId} not found in database.`,
        },
        { status: 200 }
      );
    }

    const existingMetadata =
      session.metadata && typeof session.metadata === 'object' && !Array.isArray(session.metadata)
        ? (session.metadata as Record<string, unknown>)
        : {};

    const updatedMetadata = {
      ...existingMetadata,
      endedReason: message.endedReason || (payload as any).endedReason || 'completed',
      analysis: message.analysis || (payload as any).analysis || null,
      recordingUrl: artifact?.recordingUrl || null,
      vapiCost: callData?.cost || null,
      webhookProcessedAt: new Date().toISOString(),
    };

    const updatePayload: {
      session_status: 'completed';
      transcript: any;
      metadata: any;
      ended_at: string;
      updated_at: string;
      started_at?: string;
      duration_seconds?: number;
    } = {
      session_status: 'completed',
      transcript: transcriptSegments,
      metadata: updatedMetadata,
      ended_at: endedAt,
      updated_at: new Date().toISOString(),
      ...(startedAt ? { started_at: startedAt } : {}),
      ...(durationSeconds > 0 ? { duration_seconds: durationSeconds } : {}),
    };

    const { error: updateError } = await (supabase
      .from('interview_sessions')
      .update(updatePayload)
      .eq('id', session.id) as any);

    if (updateError) {
      console.error('[VapiWebhook] Failed to atomically update session record:', updateError);
      return NextResponse.json(
        { error: `Database transaction error: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        session_id: session.id,
        vapi_call_id: vapiCallId,
        status: 'completed',
        transcriptSegmentsCount: transcriptSegments.length,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[VapiWebhook] Uncaught error handling webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error processing webhook.' },
      { status: 500 }
    );
  }
}
