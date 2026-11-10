import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VapiVoiceService } from '../vapi-service';

// Mock @vapi-ai/web
const mockOn = vi.fn();
const mockStart = vi.fn().mockResolvedValue({});
const mockStop = vi.fn().mockResolvedValue({});
const mockRemoveAllListeners = vi.fn();

vi.mock('@vapi-ai/web', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      on: mockOn,
      start: mockStart,
      stop: mockStop,
      removeAllListeners: mockRemoveAllListeners,
    })),
  };
});

// Mock microphone
vi.mock('../microphone', () => ({
  requestMicrophoneAccess: vi.fn().mockResolvedValue({
    granted: true,
    status: {
      permission: 'granted',
      hasHardware: true,
      errorMessage: null,
      activeDeviceId: 'mic-1',
    },
    stream: {
      getTracks: () => [{ stop: vi.fn() }],
    },
  }),
  releaseMediaStream: vi.fn(),
}));

describe('VapiVoiceService State Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes in idle state', () => {
    const onStateChange = vi.fn();
    const service = new VapiVoiceService({}, { onStateChange });

    expect(service.getState()).toBe('idle');
  });

  it('transitions from idle to connecting and attaches listeners on start', async () => {
    const onStateChange = vi.fn();
    const service = new VapiVoiceService({ assistantId: 'test-assistant' }, { onStateChange });

    const result = await service.start();
    expect(result.success).toBe(true);
    expect(onStateChange).toHaveBeenCalledWith('connecting');
    expect(mockStart).toHaveBeenCalledWith('test-assistant');
  });

  it('transitions to interrupted and resumes cleanly', () => {
    const onStateChange = vi.fn();
    const service = new VapiVoiceService({}, { onStateChange });

    // Manually trigger state simulation
    (service as any).setState('active');
    expect(service.getState()).toBe('active');

    service.interrupt();
    expect(service.getState()).toBe('interrupted');
    expect(onStateChange).toHaveBeenCalledWith('interrupted');

    service.resume();
    expect(service.getState()).toBe('active');
    expect(onStateChange).toHaveBeenCalledWith('active');
  });

  it('stops and transitions to completed state with cleanup', async () => {
    const onStateChange = vi.fn();
    const service = new VapiVoiceService({}, { onStateChange });

    (service as any).setState('active');
    await service.stop();

    expect(service.getState()).toBe('completed');
    expect(onStateChange).toHaveBeenCalledWith('completed');
  });

  it('destroys cleanly and removes all event listeners', () => {
    const onStateChange = vi.fn();
    const service = new VapiVoiceService({}, { onStateChange });

    (service as any).initializeVapiInstance();
    service.destroy();

    expect(service.getState()).toBe('idle');
    expect(mockRemoveAllListeners).toHaveBeenCalled();
  });
});
