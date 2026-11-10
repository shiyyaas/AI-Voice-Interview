import { describe, it, expect, vi } from 'vitest';
import { VapiVoiceService } from '../vapi-service';

describe('VapiVoiceService cleanup & resource garbage collection', () => {
  it('explicitly stops and releases media tracks when destroy is invoked', () => {
    const mockTrackStop = vi.fn();
    const mockMediaStream = {
      getTracks: vi.fn().mockReturnValue([
        { stop: mockTrackStop },
        { stop: mockTrackStop },
      ]),
    } as unknown as MediaStream;

    const service = new VapiVoiceService({}, { onStateChange: vi.fn() });

    // Simulate active stream
    (service as any).currentStream = mockMediaStream;

    service.destroy();

    expect(mockTrackStop).toHaveBeenCalledTimes(2);
    expect((service as any).currentStream).toBeNull();
    expect(service.getState()).toBe('idle');
  });

  it('stops ping interval and network listeners on destroy', () => {
    vi.useFakeTimers();
    const service = new VapiVoiceService({}, { onStateChange: vi.fn() });

    (service as any).pingIntervalId = setInterval(() => {}, 1000);
    expect((service as any).pingIntervalId).not.toBeNull();

    service.destroy();
    expect((service as any).pingIntervalId).toBeNull();
    vi.useRealTimers();
  });
});
