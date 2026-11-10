import { describe, it, expect } from 'vitest';
import { generateFallbackEvaluation, evaluateInterviewTranscript } from '../evaluator';

describe('Evaluator Engine', () => {
  it('generates consistent heuristic fallback evaluation when no Gemini key is set', () => {
    const transcript = `
      Interviewer: Welcome! How would you design a distributed caching layer?
      Candidate: I would use Redis with a read-through and write-aside caching strategy, paired with cache invalidation policies and TTLs.
    `;

    const result = generateFallbackEvaluation(transcript, 'Senior Distributed Systems Engineer');

    expect(result.overall_score).toBeGreaterThanOrEqual(0);
    expect(result.overall_score).toBeLessThanOrEqual(100);
    expect(result.strengths.length).toBeGreaterThanOrEqual(3);
    expect(result.weaknesses.length).toBeGreaterThanOrEqual(2);
    expect(result.suggested_exercises.length).toBeGreaterThanOrEqual(3);
    expect(result.competency_scores.syntaxAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.competency_scores.systemArchitecture).toBeGreaterThanOrEqual(0);
    expect(result.competency_scores.verbalCommunication).toBeGreaterThanOrEqual(0);
  });

  it('safely handles empty transcripts in evaluateInterviewTranscript', async () => {
    const result = await evaluateInterviewTranscript('', 'Frontend Engineer');
    expect(result.overall_score).toBeDefined();
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.weaknesses).toBeInstanceOf(Array);
  });
});
