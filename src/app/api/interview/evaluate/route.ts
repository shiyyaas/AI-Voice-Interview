import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { evaluateInterviewTranscript } from '@/lib/evaluation/evaluator';
import type { Json } from '@/lib/supabase/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, transcript, roleTitle, userId } = body;

    let transcriptText = '';
    if (typeof transcript === 'string') {
      transcriptText = transcript;
    } else if (Array.isArray(transcript)) {
      transcriptText = transcript
        .map((m: any) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
        .join('\n\n');
    }

    const evaluation = await evaluateInterviewTranscript(transcriptText, roleTitle);

    let feedbackId: string | null = null;
    if (sessionId) {
      const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
      const supabase = createServerSupabaseClient(authHeader);

      const { error: sessionUpdateError } = await supabase
        .from('interview_sessions')
        .update({
          session_status: 'completed',
          ended_at: new Date().toISOString(),
          transcript: (Array.isArray(transcript) ? transcript : [{ role: 'transcript', content: transcriptText }]) as Json,
        })
        .eq('id', sessionId);

      if (sessionUpdateError) {
        console.warn('[Evaluate API] Notice updating session status:', sessionUpdateError.message);
      }

      const detailedCritiqueJson: Json = {
        competency_scores: {
          syntaxAccuracy: evaluation.competency_scores.syntaxAccuracy,
          systemArchitecture: evaluation.competency_scores.systemArchitecture,
          verbalCommunication: evaluation.competency_scores.verbalCommunication,
          problemSolving: evaluation.competency_scores.problemSolving,
          codeQuality: evaluation.competency_scores.codeQuality,
        },
        suggested_exercises: evaluation.suggested_exercises,
        evaluated_at: new Date().toISOString(),
      };

      const { data: feedbackData, error: feedbackError } = await supabase
        .from('interview_feedback')
        .insert({
          session_id: sessionId,
          user_id: userId || null,
          overall_score: evaluation.overall_score,
          technical_score: evaluation.technical_score,
          communication_score: evaluation.communication_score,
          confidence_score: evaluation.confidence_score,
          strengths: evaluation.strengths,
          weaknesses: evaluation.weaknesses,
          key_takeaways: evaluation.key_takeaways,
          detailed_critique: detailedCritiqueJson,
        })
        .select('id')
        .single();

      if (feedbackError) {
        console.warn('[Evaluate API] Supabase feedback record insertion note:', feedbackError.message);
      } else if (feedbackData) {
        feedbackId = feedbackData.id;
      }
    }

    return NextResponse.json({
      success: true,
      feedbackId,
      evaluation,
    });
  } catch (error: any) {
    console.error('[Evaluate API] Unhandled error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Evaluation process encountered an error.',
      },
      { status: 500 }
    );
  }
}
