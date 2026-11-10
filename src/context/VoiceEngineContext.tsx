'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import type {
  VoiceConnectionState,
  VoiceMessage,
  MicrophoneStatus,
  NetworkQuality,
  VoiceEngineConfig,
} from '@/lib/voice/types';
import { VapiVoiceService } from '@/lib/voice/vapi-service';
import { requestMicrophoneAccess } from '@/lib/voice/microphone';

export interface VoiceEngineContextValue {
  connectionState: VoiceConnectionState;
  microphoneStatus: MicrophoneStatus;
  messages: VoiceMessage[];
  volume: number;
  networkQuality: NetworkQuality;
  isMuted: boolean;
  startSession: (config?: {
    assistantId?: string;
    assistantOverrides?: Record<string, unknown>;
  }) => Promise<boolean>;
  endSession: () => Promise<void>;
  interruptSession: () => void;
  resumeSession: () => void;
  verifyMicrophone: () => Promise<MicrophoneStatus>;
  resetSession: () => void;
  error: Error | null;
}

const VoiceEngineContext = createContext<VoiceEngineContextValue | null>(null);

const DEFAULT_MIC_STATUS: MicrophoneStatus = {
  permission: 'prompt',
  hasHardware: true,
  errorMessage: null,
  activeDeviceId: null,
};

export interface VoiceEngineProviderProps {
  children: React.ReactNode;
  initialConfig?: VoiceEngineConfig;
}

export function VoiceEngineProvider({
  children,
  initialConfig = {},
}: VoiceEngineProviderProps) {
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>('idle');
  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus>(DEFAULT_MIC_STATUS);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [volume, setVolume] = useState<number>(0);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('excellent');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const serviceRef = useRef<VapiVoiceService | null>(null);

  // Initialize and tear down voice service instance
  useEffect(() => {
    const service = new VapiVoiceService(initialConfig, {
      onStateChange: (newState) => {
        setConnectionState(newState);
      },
      onMessage: (message) => {
        setMessages((prev) => {
          if (message.isPartial) {
            // Replace previous partial message from same role if exists
            const last = prev[prev.length - 1];
            if (last && last.role === message.role && last.isPartial) {
              return [...prev.slice(0, -1), message];
            }
          }
          return [...prev, message];
        });
      },
      onVolumeChange: (vol) => {
        setVolume(vol);
      },
      onError: (err) => {
        setError(err);
      },
      onNetworkQualityChange: (quality) => {
        setNetworkQuality(quality);
      },
      onCallEnd: () => {
        setVolume(0);
      },
    });

    serviceRef.current = service;

    return () => {
      service.destroy();
      serviceRef.current = null;
    };
  }, [initialConfig]);

  const verifyMicrophone = useCallback(async (): Promise<MicrophoneStatus> => {
    const res = await requestMicrophoneAccess();
    setMicrophoneStatus(res.status);
    if (res.stream) {
      // Clean up test track right away
      res.stream.getTracks().forEach((t) => t.stop());
    }
    return res.status;
  }, []);

  const startSession = useCallback(
    async (config?: {
      assistantId?: string;
      assistantOverrides?: Record<string, unknown>;
    }): Promise<boolean> => {
      setError(null);
      if (!serviceRef.current) return false;

      const result = await serviceRef.current.start(config);
      setMicrophoneStatus(result.microphoneStatus);

      if (!result.success) {
        if (result.microphoneStatus.errorMessage) {
          setError(new Error(result.microphoneStatus.errorMessage));
        }
        return false;
      }
      return true;
    },
    []
  );

  const endSession = useCallback(async () => {
    if (serviceRef.current) {
      await serviceRef.current.stop();
    }
  }, []);

  const interruptSession = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.interrupt();
    }
  }, []);

  const resumeSession = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.resume();
    }
  }, []);

  const resetSession = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.destroy();
    }
    setConnectionState('idle');
    setMessages([]);
    setVolume(0);
    setError(null);
  }, []);

  const contextValue = useMemo<VoiceEngineContextValue>(
    () => ({
      connectionState,
      microphoneStatus,
      messages,
      volume,
      networkQuality,
      isMuted,
      startSession,
      endSession,
      interruptSession,
      resumeSession,
      verifyMicrophone,
      resetSession,
      error,
    }),
    [
      connectionState,
      microphoneStatus,
      messages,
      volume,
      networkQuality,
      isMuted,
      startSession,
      endSession,
      interruptSession,
      resumeSession,
      verifyMicrophone,
      resetSession,
      error,
    ]
  );

  return (
    <VoiceEngineContext.Provider value={contextValue}>
      {children}
    </VoiceEngineContext.Provider>
  );
}

export function useVoiceEngine(): VoiceEngineContextValue {
  const context = useContext(VoiceEngineContext);
  if (!context) {
    throw new Error('useVoiceEngine must be used within a VoiceEngineProvider');
  }
  return context;
}
