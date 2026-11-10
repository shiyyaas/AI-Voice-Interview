export type ExperienceLevel = 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
export type InterviewType = 'technical' | 'behavioral' | 'system_design' | 'mixed';

export interface CreateInterviewConfigRequest {
  job_role: string;
  experience_level: ExperienceLevel | string;
  tech_stack: string[];
  question_count: number;
  session_id?: string;
  interview_type?: InterviewType;
  duration_minutes?: number;
  user_id?: string | null;
}

export interface CreateInterviewConfigResponse {
  success: boolean;
  config_id: string;
  session_id?: string;
  system_prompt: string;
  assistant_id?: string | null;
  error?: string;
}

export interface InitiateVapiSessionRequest {
  session_id: string;
  config_id?: string;
  system_prompt?: string;
  assistant_id?: string;
  customer_phone_number?: string;
}

export interface InitiateVapiSessionResponse {
  success: boolean;
  session_id: string;
  vapi_call_id: string;
  web_call_url?: string | null;
  token?: string | null;
  assistant_id?: string | null;
  error?: string;
}

export interface VapiTranscriptSegment {
  role: 'assistant' | 'user' | string;
  text?: string;
  transcript?: string;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
  start?: number;
  end?: number;
  timestamp?: number | string;
  [key: string]: unknown;
}

export interface VapiEndOfCallReportPayload {
  message?: {
    type?: string;
    call?: {
      id?: string;
      orgId?: string;
      status?: string;
      startedAt?: string;
      endedAt?: string;
      cost?: number;
      assistantId?: string;
      [key: string]: unknown;
    };
    artifact?: {
      transcriptSegments?: VapiTranscriptSegment[];
      transcript?: string;
      recordingUrl?: string;
      stereoRecordingUrl?: string;
      messages?: Array<{
        role: string;
        message?: string;
        content?: string;
        time?: number;
      }>;
      [key: string]: unknown;
    };
    endedReason?: string;
    analysis?: {
      summary?: string;
      structuredData?: Record<string, unknown>;
      successEvaluation?: boolean | string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  type?: string;
  call?: {
    id?: string;
    [key: string]: unknown;
  };
  artifact?: {
    transcriptSegments?: VapiTranscriptSegment[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
