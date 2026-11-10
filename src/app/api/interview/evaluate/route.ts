import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  evaluateInterviewTranscript,
  formatTranscriptForEvaluation,
  EvaluationPayload,
} from '@/lib/interview/evaluation';

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Bad Request: Malformed JSON payload.' },
        { status: 400 }
      );
    }

    const { session_id, transcript, user_id } = body || {};

    if (!session_id && !transcript) {
      return NextResponse.json(
        { error: 'Missing required field: Either "session_id" or "transcript" must be provided.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    let targetTranscript = transcript;
    let targetUserId = user_id || null;
    let roleContext: { roleTitle?: string; experienceLevel?: string; technicalStack?: string[] } | undefined = undefined;

    // If session_id provided, look up existing session data
    if (session_id) {
      const { data: session, error: sessionError } = await (supabase
        .from('interview_sessions')
        .select(`
          id,
          user_id,
          transcript,
          config_id
        `)
        .eq('id', session_id)
        .maybeSingle() as any);

      if (sessionError) {
        console.error('[EvaluateRoute] Database error fetching session:', sessionError);
      } else if (session) {
        if (!targetTranscript) {
          targetTranscript = (session as any).transcript;
        }
        if (!targetUserId && (session as any).user_id) {
          targetUserId = (session as any).user_id;
        }

        if ((session as any).config_id) {
          const { data: config } = await (supabase
            .from('interview_configs')
            .select('role_title, experience_level, technical_stack')
            .eq('id', (session as any).config_id)
            .maybeSingle() as any);

          if (config) {
            roleContext = {
              roleTitle: config.role_title,
              experienceLevel: config.experience_level,
              technicalStack: config.technical_stack,
            };
          }
        }
      }
    }

    // Evaluate transcript using Gemini 2.5 Flash / fallback
    const evaluation: EvaluationPayload = await evaluateInterviewTranscript(
      targetTranscript,
      roleContext
    );

    // Save into interview_feedback ledger if session_id is available
    let feedbackRecord = null;
    if (session_id) {
      // Check if feedback already exists for this session to update, else insert
      const { data: existingFeedback } = await supabase
        .from('interview_feedback')
        .select('id')
        .eq('session_id', session_id)
        .maybeSingle();

      const feedbackPayload: any = {
        session_id,
        user_id: targetUserId,
        overall_score: evaluation.overall_score,
        technical_score: evaluation.competency_metrics?.syntax_accuracy ?? evaluation.overall_score,
        communication_score:
          evaluation.competency_metrics?.verbal_communication_fluency ?? evaluation.overall_score,
        confidence_score:
          evaluation.competency_metrics?.problem_solving ?? evaluation.overall_score,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        key_takeaways: evaluation.key_takeaways || null,
        detailed_critique: {
          suggested_exercises: evaluation.suggested_exercises,
          competency_metrics: evaluation.competency_metrics as any,
          evaluated_at: new Date().toISOString(),
        },
      };

      if (existingFeedback?.id) {
        const { data: updated, error: updateError } = await (supabase
          .from('interview_feedback')
          .update(feedbackPayload)
          .eq('id', existingFeedback.id)
          .select()
          .single() as any);

        if (updateError) {
          console.error('[EvaluateRoute] Error updating interview_feedback:', updateError);
        } else {
          feedbackRecord = updated;
        }
      } else {
        const { data: inserted, error: insertError } = await (supabase
          .from('interview_feedback')
          .insert(feedbackPayload)
          .select()
          .single() as any);

        if (insertError) {
          console.error('[EvaluateRoute] Error inserting interview_feedback:', insertError);
        } else {
          feedbackRecord = inserted;
        }
      }
    }

    // Return the strict JSON format specified in the prompt:
    // { "overall_score": number, "strengths": string[], "weaknesses": string[], "suggested_exercises": string[] }
    // along with detailed breakdown
    return NextResponse.json(
      {
        overall_score: evaluation.overall_score,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        suggested_exercises: evaluation.suggested_exercises,
        competency_metrics: evaluation.competency_metrics,
        key_takeaways: evaluation.key_takeaways,
        feedback_id: feedbackRecord?.id || null,
        session_id: session_id || null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[EvaluateRoute] Unhandled evaluation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error evaluating interview transcript.' },
      { status: 500 }
    );
  }
}
