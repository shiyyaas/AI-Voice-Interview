import Vapi from '@vapi-ai/web';
import { requestMicrophoneAccess, releaseMediaStream } from './microphone';
import type {
  VoiceConnectionState,
  VoiceMessage,
  VoiceEngineConfig,
  MicrophoneStatus,
  NetworkQuality,
} from './types';

export interface VapiServiceCallbacks {
  onStateChange: (state: VoiceConnectionState) => void;
  onMessage?: (message: VoiceMessage) => void;
  onVolumeChange?: (volume: number) => void;
  onError?: (error: Error) => void;
  onNetworkQualityChange?: (quality: NetworkQuality) => void;
  onCallStart?: () => void;
  onCallEnd?: () => void;
}

export class VapiVoiceService {
  private vapi: Vapi | null = null;
  private currentStream: MediaStream | null = null;
  private state: VoiceConnectionState = 'idle';
  private callbacks: VapiServiceCallbacks;
  private config: VoiceEngineConfig;
  private isDestroyed = false;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private currentVolume = 0;
  private activeAssistantId: string | null = null;

  constructor(config: VoiceEngineConfig, callbacks: VapiServiceCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  public getState(): VoiceConnectionState {
    return this.state;
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  private setState(newState: VoiceConnectionState): void {
    if (this.state === newState || this.isDestroyed) return;
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Initializes the Vapi client instance and attaches native event listeners
   */
  private initializeVapiInstance(): Vapi {
    if (this.vapi) {
      return this.vapi;
    }

    const apiKey = this.config.apiKey || process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || 'demo-public-key';
    const vapi = new Vapi(apiKey);

    // Call start
    vapi.on('call-start', () => {
      this.setState('active');
      this.callbacks.onCallStart?.();
      this.startNetworkMonitoring();
    });

    // Call end (explicit or unexpected session drops)
    vapi.on('call-end', () => {
      this.stopNetworkMonitoring();
      this.setState('completed');
      this.callbacks.onCallEnd?.();
      this.cleanupMediaStream();
    });

    // Native user interruptions tracking
    vapi.on('speech-start', () => {
      // User started speaking while assistant might be speaking - marks an interruption state
      if (this.state === 'active') {
        this.setState('interrupted');
      }
    });

    vapi.on('speech-end', () => {
      // User finished speaking, resume active voice conversation state
      if (this.state === 'interrupted') {
        this.setState('active');
      }
    });

    // Real-time audio volume indicator
    vapi.on('volume-level', (volume: number) => {
      this.currentVolume = Math.min(1, Math.max(0, volume));
      this.callbacks.onVolumeChange?.(this.currentVolume);
    });

    // Transcripts and message events
    vapi.on('message', (rawMessage: any) => {
      if (!rawMessage) return;

      if (rawMessage.type === 'transcript') {
        const transcriptType = rawMessage.transcriptType; // 'partial' | 'final'
        const role = rawMessage.role === 'assistant' ? 'assistant' : 'user';
        const content = rawMessage.transcript || '';

        if (content.trim()) {
          this.callbacks.onMessage?.({
            id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            role,
            content,
            timestamp: Date.now(),
            isPartial: transcriptType === 'partial',
          });
        }
      }
    });

    // Intercept unexpected errors and connection drops
    vapi.on('error', (err: any) => {
      const errorObj = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Vapi Connection Error');
      console.error('[VoiceEngine] Vapi error encountered:', errorObj);
      this.callbacks.onError?.(errorObj);

      // If in connecting or active state and error occurs, stop gracefully
      if (this.state === 'connecting') {
        this.setState('idle');
      }
    });

    this.vapi = vapi;
    return vapi;
  }

  /**
   * Hardware permission check + WebRTC connection initialization via vapi.start()
   */
  public async start(options?: {
    assistantId?: string;
    assistantOverrides?: Record<string, unknown>;
  }): Promise<{ success: boolean; microphoneStatus: MicrophoneStatus }> {
    this.setState('connecting');

    // Step 1: Pre-flight native microphone hardware access
    const micResult = await requestMicrophoneAccess();
    if (!micResult.granted || !micResult.stream) {
      this.setState('idle');
      return {
        success: false,
        microphoneStatus: micResult.status,
      };
    }

    // Keep track of pre-flight stream so we can clean it up before handing to SDK
    this.currentStream = micResult.stream;

    try {
      const vapiInstance = this.initializeVapiInstance();
      const assistantId = options?.assistantId || this.config.assistantId || process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      const assistantOverrides = options?.assistantOverrides || this.config.assistantOverrides;

      this.activeAssistantId = assistantId || null;

      // Clean pre-flight audio tracks so browser audio device isn't double-locked
      this.cleanupMediaStream();

      if (assistantId) {
        if (assistantOverrides) {
          await (vapiInstance.start as any)(assistantId, assistantOverrides);
        } else {
          await vapiInstance.start(assistantId);
        }
      } else {
        // Fallback for testing / custom assistant config
        const inlineConfig: any = {
          model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content:
                  'You are an expert technical interviewer conducting a mock interview. Be friendly, structured, and ask one question at a time.',
              },
            ],
          },
          voice: {
            provider: '11labs',
            voiceId: 'burt',
          },
          ...assistantOverrides,
        };
        await vapiInstance.start(inlineConfig);
      }

      return {
        success: true,
        microphoneStatus: micResult.status,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('[VoiceEngine] Failed to establish WebRTC call:', error);
      this.setState('idle');
      this.callbacks.onError?.(error);
      this.cleanupMediaStream();

      return {
        success: false,
        microphoneStatus: {
          permission: 'granted',
          hasHardware: true,
          errorMessage: error.message || 'Call initialization failed.',
          activeDeviceId: null,
        },
      };
    }
  }

  /**
   * Handles user interruptions manually if desired (e.g. hitting spacebar or speaking)
   */
  public interrupt(): void {
    if (this.state === 'active') {
      this.setState('interrupted');
      // Vapi will stop assistant speech when user talks, but can be explicitly flagged
    }
  }

  /**
   * Resumes conversation state after interruption
   */
  public resume(): void {
    if (this.state === 'interrupted') {
      this.setState('active');
    }
  }

  /**
   * Explicitly stop the call and transition to 'completed'
   */
  public async stop(): Promise<void> {
    if (this.state === 'idle' || this.state === 'completed') return;

    this.stopNetworkMonitoring();

    try {
      if (this.vapi) {
        await this.vapi.stop();
      }
    } catch (err) {
      console.warn('[VoiceEngine] Error stopping Vapi call:', err);
    } finally {
      this.setState('completed');
      this.cleanupMediaStream();
    }
  }

  /**
   * Full teardown to prevent audio and WebSocket memory leaks
   */
  public destroy(): void {
    this.isDestroyed = true;
    this.stopNetworkMonitoring();
    this.cleanupMediaStream();

    if (this.vapi) {
      try {
        this.vapi.stop();
        // Remove listeners
        this.vapi.removeAllListeners();
      } catch (err) {
        console.warn('[VoiceEngine] Error during Vapi teardown:', err);
      }
      this.vapi = null;
    }

    this.state = 'idle';
  }

  private cleanupMediaStream(): void {
    if (this.currentStream) {
      releaseMediaStream(this.currentStream);
      this.currentStream = null;
    }
  }

  private startNetworkMonitoring(): void {
    this.stopNetworkMonitoring();

    if (typeof window === 'undefined') return;

    const checkNetwork = () => {
      if (!navigator.onLine) {
        this.callbacks.onNetworkQualityChange?.('offline');
        return;
      }

      // Use Network Information API if available
      const conn = (navigator as any).connection;
      if (conn) {
        const rtt = conn.rtt || 50;
        const downlink = conn.downlink || 10;

        if (rtt < 100 && downlink > 5) {
          this.callbacks.onNetworkQualityChange?.('excellent');
        } else if (rtt < 250 && downlink > 1.5) {
          this.callbacks.onNetworkQualityChange?.('good');
        } else if (rtt < 500) {
          this.callbacks.onNetworkQualityChange?.('fair');
        } else {
          this.callbacks.onNetworkQualityChange?.('poor');
        }
      } else {
        this.callbacks.onNetworkQualityChange?.('excellent');
      }
    };

    checkNetwork();
    this.pingIntervalId = setInterval(checkNetwork, 5000);

    window.addEventListener('online', checkNetwork);
    window.addEventListener('offline', checkNetwork);
  }

  private stopNetworkMonitoring(): void {
    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }
}
