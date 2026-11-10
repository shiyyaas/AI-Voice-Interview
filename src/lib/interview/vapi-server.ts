export interface VapiAgentConfig {
  model?: {
    provider?: string;
    model?: string;
    messages?: Array<{ role: string; content: string }>;
    temperature?: number;
    [key: string]: unknown;
  };
  voice?: {
    provider?: string;
    voiceId?: string;
    [key: string]: unknown;
  };
  firstMessage?: string;
  variableValues?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface VapiCallInitiationResult {
  callId: string;
  webCallUrl?: string | null;
  token?: string | null;
  rawResponse: Record<string, unknown>;
}

export async function initiateVapiCall(params: {
  systemPrompt: string;
  assistantId?: string;
  customerPhoneNumber?: string;
  metadata?: Record<string, unknown>;
}): Promise<VapiCallInitiationResult> {
  const vapiApiKey =
    process.env.VAPI_API_KEY ||
    process.env.VAPI_PRIVATE_KEY ||
    process.env.VAPI_SECRET_KEY;

  const assistantId =
    params.assistantId ||
    process.env.VAPI_ASSISTANT_ID ||
    process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

  const assistantOverrides: VapiAgentConfig = {
    model: {
      provider: 'google',
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: params.systemPrompt,
        },
      ],
      temperature: 0.3,
    },
    firstMessage:
      'Hello, I am your technical interviewer for today. When you are ready, let me know and we will begin with the first question.',
  };

  if (!vapiApiKey || vapiApiKey.includes('placeholder') || vapiApiKey.includes('demo')) {
    console.warn('[VapiServer] No valid VAPI_API_KEY found. Generating simulated runtime call credentials.');
    const simulatedCallId = `vapi_call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    return {
      callId: simulatedCallId,
      webCallUrl: `https://vapi.ai/call/${simulatedCallId}`,
      token: `vapi_token_${Math.random().toString(36).substring(2, 12)}`,
      rawResponse: {
        id: simulatedCallId,
        status: 'queued',
        simulated: true,
      },
    };
  }

  const requestBody: Record<string, unknown> = {
    assistantOverrides,
    metadata: params.metadata || {},
  };

  if (assistantId) {
    requestBody.assistantId = assistantId;
  } else {
    requestBody.assistant = {
      ...assistantOverrides,
      transcriber: {
        provider: 'deepgram',
        model: 'nova-2',
        language: 'en-US',
      },
      voice: {
        provider: '11labs',
        voiceId: 'burt',
      },
    };
  }

  if (params.customerPhoneNumber) {
    requestBody.phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    requestBody.customer = {
      number: params.customerPhoneNumber,
    };
  }

  const response = await fetch('https://api.vapi.ai/call', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${vapiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[VapiServer] Vapi API responded with status ${response.status}:`, errorText);
    throw new Error(`Vapi API error (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const callId = (data.id as string) || (data.callId as string);

  if (!callId) {
    throw new Error('Vapi response did not contain a valid call ID.');
  }

  return {
    callId,
    webCallUrl: (data.webCallUrl as string) || null,
    token: (data.token as string) || null,
    rawResponse: data,
  };
}
