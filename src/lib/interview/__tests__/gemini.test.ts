import { describe, it, expect } from 'vitest';
import {
  buildGeminiMetaprompt,
  generateDeterministicPrompt,
  generateInterviewPrompt,
  TERMINATION_HOOK_PHRASE,
} from '../gemini';

describe('Gemini Metaprompt & System Prompt Generator', () => {
  const sampleParams = {
    jobRole: 'Senior Full Stack Engineer',
    experienceLevel: 'senior',
    techStack: ['Next.js', 'TypeScript', 'PostgreSQL', 'Supabase'],
    questionCount: 5,
  };

  it('builds a metaprompt enforcing all 4 strict conversational boundaries and persona rules', () => {
    const metaprompt = buildGeminiMetaprompt(sampleParams);

    expect(metaprompt).toContain('Senior Full Stack Engineer');
    expect(metaprompt).toContain('senior');
    expect(metaprompt).toContain('Next.js, TypeScript, PostgreSQL, Supabase');
    expect(metaprompt).toContain('Clear, neutral, and professional technical interviewer');
    expect(metaprompt).toContain('Ask exactly one direct question at a time');
    expect(metaprompt).toContain('NEVER write code out loud, dictate syntax, give answers, or offer hints');
    expect(metaprompt).toContain(TERMINATION_HOOK_PHRASE);
    expect(metaprompt).toContain('5 questions');
  });

  it('generates a deterministic fallback prompt with all required rules when no API key is provided', async () => {
    const originalApiKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    delete process.env.GOOGLE_GENAI_API_KEY;

    try {
      const prompt = await generateInterviewPrompt(sampleParams);

      expect(prompt).toContain('Senior Full Stack Engineer');
      expect(prompt).toContain('senior');
      expect(prompt).toContain('Ask exactly one direct question at a time');
      expect(prompt).toContain('Never read code out loud');
      expect(prompt).toContain(TERMINATION_HOOK_PHRASE);
    } finally {
      if (originalApiKey) {
        process.env.GEMINI_API_KEY = originalApiKey;
      }
    }
  });

  it('deterministic generator correctly formats prompt', () => {
    const prompt = generateDeterministicPrompt({
      jobRole: 'Junior Frontend Developer',
      experienceLevel: 'junior',
      techStack: ['React', 'CSS'],
      questionCount: 3,
    });

    expect(prompt).toContain('Junior Frontend Developer');
    expect(prompt).toContain('React, CSS');
    expect(prompt).toContain(TERMINATION_HOOK_PHRASE);
  });
});
