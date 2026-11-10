export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SessionStatus =
  | 'idle'
  | 'connecting'
  | 'active'
  | 'interrupted'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      interview_configs: {
        Row: {
          id: string;
          user_id: string | null;
          role_title: string;
          industry: string;
          experience_level: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
          technical_stack: string[];
          interview_type: 'technical' | 'behavioral' | 'system_design' | 'mixed';
          system_prompt: string | null;
          vapi_assistant_id: string | null;
          duration_minutes: number;
          is_template: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          role_title: string;
          industry?: string;
          experience_level: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
          technical_stack?: string[];
          interview_type: 'technical' | 'behavioral' | 'system_design' | 'mixed';
          system_prompt?: string | null;
          vapi_assistant_id?: string | null;
          duration_minutes?: number;
          is_template?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          role_title?: string;
          industry?: string;
          experience_level?: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
          technical_stack?: string[];
          interview_type?: 'technical' | 'behavioral' | 'system_design' | 'mixed';
          system_prompt?: string | null;
          vapi_assistant_id?: string | null;
          duration_minutes?: number;
          is_template?: boolean;
          updated_at?: string;
        };
      };
      interview_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          config_id: string | null;
          session_status: SessionStatus;
          vapi_call_id: string | null;
          started_at: string | null;
          ended_at: string | null;
          duration_seconds: number;
          transcript: Json;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          config_id?: string | null;
          session_status?: SessionStatus;
          vapi_call_id?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number;
          transcript?: Json;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          config_id?: string | null;
          session_status?: SessionStatus;
          vapi_call_id?: string | null;
          started_at?: string | null;
          ended_at?: string | null;
          duration_seconds?: number;
          transcript?: Json;
          metadata?: Json;
          updated_at?: string;
        };
      };
      interview_feedback: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null;
          overall_score: number | null;
          technical_score: number | null;
          communication_score: number | null;
          confidence_score: number | null;
          strengths: string[];
          weaknesses: string[];
          key_takeaways: string | null;
          detailed_critique: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null;
          overall_score?: number | null;
          technical_score?: number | null;
          communication_score?: number | null;
          confidence_score?: number | null;
          strengths?: string[];
          weaknesses?: string[];
          key_takeaways?: string | null;
          detailed_critique?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string | null;
          overall_score?: number | null;
          technical_score?: number | null;
          communication_score?: number | null;
          confidence_score?: number | null;
          strengths?: string[];
          weaknesses?: string[];
          key_takeaways?: string | null;
          detailed_critique?: Json;
        };
      };
    };
  };
}
