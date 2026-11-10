export type VoiceConnectionState =
  | 'idle'
  | 'connecting'
  | 'active'
  | 'interrupted'
  | 'completed';

export type MicrophonePermissionState =
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'not-found'
  | 'unsupported';

export interface MicrophoneStatus {
  permission: MicrophonePermissionState;
  hasHardware: boolean;
  errorMessage: string | null;
  activeDeviceId: string | null;
}

export interface VoiceMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: number;
  isPartial?: boolean;
}

export interface VoiceEngineConfig {
  apiKey?: string;
  assistantId?: string;
  assistantOverrides?: Record<string, unknown>;
  webrtcOptions?: Record<string, unknown>;
}

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface VoiceEngineEvents {
  stateChange: (state: VoiceConnectionState) => void;
  message: (message: VoiceMessage) => void;
  volumeChange: (volume: number) => void; // 0 to 1
  error: (error: Error) => void;
  networkQualityChange: (quality: NetworkQuality) => void;
}
