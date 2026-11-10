import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewPrompt } from '@/lib/interview/gemini';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type {
  CreateInterviewConfigRequest,
  CreateInterviewConfigResponse,
  ExperienceLevel,
  InterviewType,
} from '@/lib/interview/types';

const VALID_EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'intern',
  'junior',
  'mid',
  'senior',
  'lead',
  'executive',
];

const VALID_INTERVIEW_TYPES: InterviewType[] = [
  'technical',
  'behavioral',
  'system_design',
  'mixed',
];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateInterviewConfigRequest;

    const {
      job_role,
      experience_level,
      tech_stack,
      question_count,
      session_id,
      interview_type = 'technical',
      duration_minutes = 15,
      user_id = null,
    } = body;

    // Structural validation checks
    if (!job_role || typeof job_role !== 'string' || !job_role.trim()) {
      return NextResponse.json<CreateInterviewConfigResponse>(
        {
          success: false,
          config_id: '',
          system_prompt: '',
          error: 'Field "job_role" is required and must be a non-empty string.',
        },
        { status: 400 }
      );
    }

    const normalizedExpLevel = (
      typeof experience_level === 'string' ? experience_level.toLowerCase().trim() : ''
    ) as ExperienceLevel;

    if (!VALID_EXPERIENCE_LEVELS.includes(normalizedExpLevel)) {
      return NextResponse.json<CreateInterviewConfigResponse>(
        {
          success: false,
          config_id: '',
          system_prompt: '',
          error: `Invalid "experience_level". Allowed values: ${VALID_EXPERIENCE_LEVELS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(tech_stack) || tech_stack.length === 0) {
      return NextResponse.json<CreateInterviewConfigResponse>(
        {
          success: false,
          config_id: '',
          system_prompt: '',
          error: 'Field "tech_stack" must be a non-empty array of strings.',
        },
        { status: 400 }
      );
    }

    const sanitizedTechStack = tech_stack
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .map((item) => item.trim());

    if (sanitizedTechStack.length === 0) {
      return NextResponse.json<CreateInterviewConfigResponse>(
        {
          success: false,
          config_id: '',
          system_prompt: '',
          error: 'Field "tech_stack" must contain at least one valid string.',
        },
        { status: 400 }
      );
    }

    const parsedQuestionCount = Number(question_count);
    if (!Number.isInteger(parsedQuestionCount) || parsedQuestionCount < 1 || parsedQuestionCount > 25) {
      return NextResponse.json<CreateInterviewConfigResponse>(
        {
          success: false,
          config_id: '',
          system_prompt: '',
          error: 'Field "question_count" must be an integer between 1 and 25.',
        },
        { status: 400 }
      );
    }

    const normalizedInterviewType: InterviewType = VALID_INTERVIEW_TYPES.includes(
      interview_type as InterviewType
    )
      ? (interview_type as InterviewType)
      : 'technical';

    // Step 1: Synthesize dynamic system prompt using Gemini (gemini-2.5-flash)
    const systemPrompt = await generateInterviewPrompt({
      jobRole: job_role.trim(),
      experienceLevel: normalizedExpLevel,
      techStack: sanitizedTechStack,
      questionCount: parsedQuestionCount,
    });

    // Step 2: Supabase transaction layer
    const supabase = getSupabaseServerClient();

    // Check if an existing session is provided with a config
    let existingConfigId: string | null = null;
    let targetSessionId = session_id;

    if (session_id) {
      const { data: sessionData, error: sessionFetchError } = await (supabase
        .from('interview_sessions')
        .select('id, config_id')
        .eq('id', session_id)
        .maybeSingle() as any);

      if (sessionFetchError) {
        console.warn('[InterviewCreateRoute] Error fetching session:', sessionFetchError);
      } else if (sessionData && 'config_id' in sessionData) {
        existingConfigId = (sessionData as { config_id: string | null }).config_id;
      }
    }

    let configId = existingConfigId;

    if (configId) {
      // Update existing config
      const { data: updatedConfig, error: updateError } = await supabase
        .from('interview_configs')
        .update({
          role_title: job_role.trim(),
          experience_level: normalizedExpLevel,
          technical_stack: sanitizedTechStack,
          interview_type: normalizedInterviewType,
          system_prompt: systemPrompt,
          duration_minutes: Number(duration_minutes) || 15,
          updated_at: new Date().toISOString(),
        })
        .eq('id', configId)
        .select('id')
        .single();

      if (updateError) {
        console.error('[InterviewCreateRoute] Failed to update interview config:', updateError);
        throw new Error(`Failed to update config: ${updateError.message}`);
      }
      configId = updatedConfig.id;
    } else {
      // Create new interview_configs record
      const { data: newConfig, error: insertError } = await supabase
        .from('interview_configs')
        .insert({
          user_id: user_id || null,
          role_title: job_role.trim(),
          industry: 'Software Engineering',
          experience_level: normalizedExpLevel,
          technical_stack: sanitizedTechStack,
          interview_type: normalizedInterviewType,
          system_prompt: systemPrompt,
          duration_minutes: Number(duration_minutes) || 15,
          is_template: false,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[InterviewCreateRoute] Failed to insert interview config:', insertError);
        throw new Error(`Failed to insert config: ${insertError.message}`);
      }
      configId = newConfig.id;
    }

    // If session_id was provided, ensure it links to this config_id
    if (targetSessionId) {
      const { error: sessionUpdateError } = await supabase
        .from('interview_sessions')
        .update({
          config_id: configId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetSessionId);

      if (sessionUpdateError) {
        console.warn('[InterviewCreateRoute] Could not update session with config_id:', sessionUpdateError);
      }
    } else {
      // Create a new session entry for tracking
      const { data: newSession, error: newSessionError } = await supabase
        .from('interview_sessions')
        .insert({
          user_id: user_id || null,
          config_id: configId,
          session_status: 'idle',
        })
        .select('id')
        .single();

      if (newSessionError) {
        console.warn('[InterviewCreateRoute] Could not create new session:', newSessionError);
      } else if (newSession) {
        targetSessionId = newSession.id;
      }
    }

    return NextResponse.json<CreateInterviewConfigResponse>(
      {
        success: true,
        config_id: configId,
        session_id: targetSessionId || undefined,
        system_prompt: systemPrompt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[InterviewCreateRoute] Unhandled error during interview creation:', error);
    return NextResponse.json<CreateInterviewConfigResponse>(
      {
        success: false,
        config_id: '',
        system_prompt: '',
        error: error.message || 'Internal server error while creating interview configuration.',
      },
      { status: 500 }
    );
  }
}
