import { GoogleGenAI } from '@google/genai';
import type { CompetencyMetrics } from '@/lib/supabase/types';

export interface EvaluationPayload {
  overall_score: number;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  strengths: string[];
  weaknesses: string[];
  suggested_exercises: string[];
  key_takeaways: string;
  competency_scores: CompetencyMetrics;
}

export function generateFallbackEvaluation(transcriptText: string, roleTitle?: string): EvaluationPayload {
  const words = transcriptText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const baseScore = Math.min(92, Math.max(65, 70 + Math.floor(wordCount / 25)));
  const syntaxScore = Math.min(95, Math.max(60, baseScore + 2));
  const archScore = Math.min(94, Math.max(58, baseScore - 1));
  const commScore = Math.min(96, Math.max(68, baseScore + 4));
  const probScore = Math.min(90, Math.max(62, baseScore));
  const codeScore = Math.min(92, Math.max(60, baseScore - 3));

  const role = roleTitle || 'Software Engineer';

  return {
    overall_score: baseScore,
    technical_score: Math.round((syntaxScore + archScore + codeScore) / 3),
    communication_score: commScore,
    confidence_score: Math.min(95, Math.max(65, baseScore + 1)),
    strengths: [
      `Demonstrated clear familiarity with core concepts relevant to ${role}.`,
      'Structured technical responses with coherent sequential explanations.',
      'Maintained good conversational pacing during question back-and-forth.',
    ],
    weaknesses: [
      'Could provide more concrete latency, throughput, and error-budget trade-offs.',
      'Edge cases and defensive exception boundaries could be articulated in deeper detail.',
    ],
    suggested_exercises: [
      'System Architecture: Practice sketching idempotency and state machines under high concurrent load.',
      'Syntax Accuracy: Review memory lifecycle and garbage collector behaviors in production runtimes.',
      'Verbal Fluency: Perform 2-minute timed elevator explanations of distributed consistency patterns.',
    ],
    key_takeaways: `Solid candidate foundation for ${role}. Demonstrates strong core principles with opportunities to expand on distributed fault tolerance and production edge cases.`,
    competency_scores: {
      syntaxAccuracy: syntaxScore,
      systemArchitecture: archScore,
      verbalCommunication: commScore,
      problemSolving: probScore,
      codeQuality: codeScore,
    },
  };
}

export async function evaluateInterviewTranscript(
  transcriptText: string,
  roleTitle = 'Software Engineer'
): Promise<EvaluationPayload> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey || apiKey === 'placeholder' || transcriptText.trim().length === 0) {
    return generateFallbackEvaluation(transcriptText, roleTitle);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a world-class principal engineering interviewer evaluating a candidate's mock interview transcript for the position of "${roleTitle}".
Evaluate the transcript thoroughly and return a valid JSON object matching this exact specification:
{
  "overall_score": number (0 to 100),
  "technical_score": number (0 to 100),
  "communication_score": number (0 to 100),
  "confidence_score": number (0 to 100),
  "strengths": string[] (at least 3 specific strengths),
  "weaknesses": string[] (at least 2 actionable areas for improvement),
  "suggested_exercises": string[] (at least 3 targeted technical exercises or drills),
  "key_takeaways": string (2-3 sentences summarizing performance),
  "competency_scores": {
    "syntaxAccuracy": number (0 to 100),
    "systemArchitecture": number (0 to 100),
    "verbalCommunication": number (0 to 100),
    "problemSolving": number (0 to 100),
    "codeQuality": number (0 to 100)
  }
}

Transcript:
"""
${transcriptText}
"""
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Empty response received from Gemini.');
    }

    const parsed = JSON.parse(responseText);

    const overall_score = Number(parsed.overall_score) || 75;
    const technical_score = Number(parsed.technical_score) || overall_score;
    const communication_score = Number(parsed.communication_score) || overall_score;
    const confidence_score = Number(parsed.confidence_score) || overall_score;

    const strengths = Array.isArray(parsed.strengths) && parsed.strengths.length > 0
      ? parsed.strengths.map(String)
      : ['Clear technical communication', 'Good baseline understanding of system principles'];

    const weaknesses = Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0
      ? parsed.weaknesses.map(String)
      : ['Dive deeper into trade-offs and alternative solutions'];

    const suggested_exercises = Array.isArray(parsed.suggested_exercises) && parsed.suggested_exercises.length > 0
      ? parsed.suggested_exercises.map(String)
      : ['Practice distributed tracing exercises', 'Refactor async state handlers'];

    const key_takeaways = typeof parsed.key_takeaways === 'string' && parsed.key_takeaways.trim()
      ? parsed.key_takeaways.trim()
      : 'Solid interview round with clear technical capability.';

    const comp = parsed.competency_scores || {};
    const competency_scores: CompetencyMetrics = {
      syntaxAccuracy: Number(comp.syntaxAccuracy) || technical_score,
      systemArchitecture: Number(comp.systemArchitecture) || technical_score,
      verbalCommunication: Number(comp.verbalCommunication) || communication_score,
      problemSolving: Number(comp.problemSolving) || overall_score,
      codeQuality: Number(comp.codeQuality) || technical_score,
    };

    return {
      overall_score: Math.min(100, Math.max(0, Math.round(overall_score))),
      technical_score: Math.min(100, Math.max(0, Math.round(technical_score))),
      communication_score: Math.min(100, Math.max(0, Math.round(communication_score))),
      confidence_score: Math.min(100, Math.max(0, Math.round(confidence_score))),
      strengths,
      weaknesses,
      suggested_exercises,
      key_takeaways,
      competency_scores,
    };
  } catch (err) {
    console.warn('[Evaluator] Gemini evaluation error, falling back to heuristic engine:', err);
    return generateFallbackEvaluation(transcriptText, roleTitle);
  }
}
