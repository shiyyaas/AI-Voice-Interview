import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { requestMicrophoneAccess, releaseMediaStream } from '../microphone';

describe('Microphone Hardware Permission Module', () => {
  const originalMediaDevices = navigator.mediaDevices;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      writable: true,
      configurable: true,
    });
  });

  it('returns unsupported when navigator.mediaDevices is absent', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const result = await requestMicrophoneAccess();
    expect(result.granted).toBe(false);
    expect(result.status.permission).toBe('unsupported');
    expect(result.status.hasHardware).toBe(false);
  });

  it('handles permission granted with valid media stream', async () => {
    const mockTrack = {
      stop: vi.fn(),
      getSettings: () => ({ deviceId: 'default-mic-123' }),
    };
    const mockStream = {
      getAudioTracks: () => [mockTrack],
      getTracks: () => [mockTrack],
    } as unknown as MediaStream;

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'audioinput', deviceId: 'mic-1', label: 'Default Mic' },
        ]),
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });

    const result = await requestMicrophoneAccess();
    expect(result.granted).toBe(true);
    expect(result.status.permission).toBe('granted');
    expect(result.status.activeDeviceId).toBe('default-mic-123');

    releaseMediaStream(result.stream);
    expect(mockTrack.stop).toHaveBeenCalled();
  });

  it('handles user denial gracefully', async () => {
    const error = new DOMException('Permission denied', 'NotAllowedError');
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'audioinput', deviceId: 'mic-1' },
        ]),
        getUserMedia: vi.fn().mockRejectedValue(error),
      },
      writable: true,
      configurable: true,
    });

    const result = await requestMicrophoneAccess();
    expect(result.granted).toBe(false);
    expect(result.status.permission).toBe('denied');
    expect(result.status.errorMessage).toContain('Microphone access was denied');
  });

  it('handles missing microphone hardware', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'videoinput', deviceId: 'cam-1' },
        ]),
        getUserMedia: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    const result = await requestMicrophoneAccess();
    expect(result.granted).toBe(false);
    expect(result.status.permission).toBe('not-found');
    expect(result.status.hasHardware).toBe(false);
  });
});
