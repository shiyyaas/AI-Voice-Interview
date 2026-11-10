import { GoogleGenAI } from '@google/genai';

export const TERMINATION_HOOK_PHRASE =
  "Thank you for your time. That covers all my technical questions. I'm compiling your session breakdown now.";

export interface PromptGeneratorParams {
  jobRole: string;
  experienceLevel: string;
  techStack: string[];
  questionCount: number;
}

export function buildGeminiMetaprompt(params: PromptGeneratorParams): string {
  const { jobRole, experienceLevel, techStack, questionCount } = params;
  const techStackString = techStack.length > 0 ? techStack.join(', ') : 'General software engineering concepts';

  return `You are an expert prompt engineer and conversational voice designer for real-time WebRTC AI voice bots.
Your objective is to generate an exact System Instructions Block for an AI Technical Interviewer bot powered by Vapi.

CANDIDATE AND SESSION SPECIFICATION:
- Target Job Role: ${jobRole}
- Experience Level: ${experienceLevel}
- Core Technical Stack / Topics: ${techStackString}
- Exact Question Count: ${questionCount} questions

CRITICAL SYSTEM INSTRUCTION RULES FOR THE BOT:
1. Persona:
   - Clear, neutral, and professional technical interviewer.
   - Speak in natural, concise conversational sentences suitable for speech-to-text and text-to-speech.
   - Avoid robotic prefixes (do not say "Question 1:" or "Next question:").
2. Pacing:
   - Ask exactly one direct question at a time.
   - Never group multiple questions together.
   - Wait for the candidate's complete response before acknowledging briefly and asking the next question.
3. Voice Boundaries:
   - NEVER write code out loud, dictate syntax, give answers, or offer hints mid-session.
   - If the candidate asks for hints or answers, politely decline and encourage them to share their best thoughts.
4. Question Progression:
   - Ask a total of exactly ${questionCount} technical questions relevant to ${jobRole} (${experienceLevel}) focusing on ${techStackString}.
5. Termination Hook:
   - Once the candidate finishes answering the ${questionCount}th question, do NOT ask any further questions.
   - Immediately finish by uttering the EXACT keyword string:
   "${TERMINATION_HOOK_PHRASE}"
   - Do not add anything after this closing sentence.

OUTPUT FORMAT:
Generate ONLY the final system instructions block that will be passed directly as the system prompt to the voice agent. Do not wrap in markdown quotes or preamble.`;
}

export function generateDeterministicPrompt(params: PromptGeneratorParams): string {
  const { jobRole, experienceLevel, techStack, questionCount } = params;
  const techStackString = techStack.length > 0 ? techStack.join(', ') : 'software engineering best practices';

  return `You are a neutral, professional technical interviewer conducting a live voice mock interview.

INTERVIEW PARAMETERS:
- Target Role: ${jobRole}
- Level: ${experienceLevel}
- Primary Tech Stack: ${techStackString}
- Total Questions: ${questionCount}

CORE VOICE GUIDELINES:
1. Persona: Speak in clear, concise, conversational sentences suitable for real-time voice speech. Do not use markdown bullet lists, ASCII diagrams, or formal greetings repeatedly.
2. Pacing: Ask exactly one direct question at a time. Wait for the candidate to answer before proceeding. Never ask multi-part or bundled questions.
3. Voice Boundaries: Never read code out loud, dictate syntax, give away answers, or offer hints during the interview. If asked for hints or answers, neutrally prompt the candidate to share their best reasoning.
4. Pacing & Progression: Guide the candidate through exactly ${questionCount} relevant technical questions.
5. Termination Hook: Immediately after the candidate finishes their response to the final (${questionCount}th) question, conclude the interview by uttering this exact sentence:
"${TERMINATION_HOOK_PHRASE}"
Do not utter any other text after saying this sentence.`;
}

export async function generateInterviewPrompt(
  params: PromptGeneratorParams
): Promise<string> {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    console.warn('[GeminiPromptGenerator] No GEMINI_API_KEY found in environment. Utilizing deterministic fallback prompt.');
    return generateDeterministicPrompt(params);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const metaprompt = buildGeminiMetaprompt(params);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: metaprompt,
      config: {
        temperature: 0.3,
      },
    });

    const generatedText = response.text?.trim();

    if (!generatedText) {
      console.warn('[GeminiPromptGenerator] Gemini returned empty response text, using fallback.');
      return generateDeterministicPrompt(params);
    }

    if (!generatedText.includes(TERMINATION_HOOK_PHRASE)) {
      return `${generatedText}\n\nCRITICAL TERMINATION HOOK:\nWhen all ${params.questionCount} questions are completed, you must conclude by uttering this exact phrase: "${TERMINATION_HOOK_PHRASE}"`;
    }

    return generatedText;
  } catch (error) {
    console.error('[GeminiPromptGenerator] Error calling Gemini API:', error);
    return generateDeterministicPrompt(params);
  }
}
