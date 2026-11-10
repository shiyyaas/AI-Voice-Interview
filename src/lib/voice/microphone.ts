import type { MicrophoneStatus, MicrophonePermissionState } from './types';

/**
 * Robust microphone hardware permission request and detection service
 * utilizing the browser's native navigator.mediaDevices.getUserMedia API.
 */
export async function requestMicrophoneAccess(): Promise<{
  granted: boolean;
  status: MicrophoneStatus;
  stream: MediaStream | null;
}> {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      granted: false,
      status: {
        permission: 'unsupported',
        hasHardware: false,
        errorMessage: 'Microphone hardware access is not supported in this browser.',
        activeDeviceId: null,
      },
      stream: null,
    };
  }

  try {
    // Check available devices first
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((device) => device.kind === 'audioinput');

    if (audioInputs.length === 0 && devices.length > 0) {
      return {
        granted: false,
        status: {
          permission: 'not-found',
          hasHardware: false,
          errorMessage: 'No microphone hardware found on this device. Please connect a microphone.',
          activeDeviceId: null,
        },
        stream: null,
      };
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const activeTrack = stream.getAudioTracks()[0];
    const deviceId = activeTrack?.getSettings?.()?.deviceId || null;

    return {
      granted: true,
      status: {
        permission: 'granted',
        hasHardware: true,
        errorMessage: null,
        activeDeviceId: deviceId,
      },
      stream,
    };
  } catch (err: unknown) {
    const error = err as DOMException;
    let permission: MicrophonePermissionState = 'denied';
    let errorMessage = 'Microphone permission request failed.';

    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      permission = 'denied';
      errorMessage = 'Microphone access was denied. Please allow microphone permissions in your browser address bar.';
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      permission = 'not-found';
      errorMessage = 'No audio input hardware was detected. Please plug in or enable a microphone.';
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      permission = 'denied';
      errorMessage = 'Microphone is currently in use by another application or system process.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Audio constraints could not be satisfied by the available hardware.';
    } else {
      errorMessage = error.message || 'An unknown error occurred while requesting microphone access.';
    }

    return {
      granted: false,
      status: {
        permission,
        hasHardware: permission !== 'not-found',
        errorMessage,
        activeDeviceId: null,
      },
      stream: null,
    };
  }
}

/**
 * Release all audio tracks on a media stream cleanly to prevent memory/hardware leaks.
 */
export function releaseMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        // Track already stopped
      }
    });
  } catch (err) {
    console.warn('[VoiceEngine] Failed to release media stream tracks:', err);
  }
}
