import React from 'react';
import { AlertCircle, MicOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { MicrophoneStatus } from '@/lib/voice/types';

interface HardwarePermissionAlertProps {
  status: MicrophoneStatus;
  onRequestAccess: () => void;
}

export function HardwarePermissionAlert({
  status,
  onRequestAccess,
}: HardwarePermissionAlertProps) {
  if (status.permission === 'granted') {
    return null;
  }

  return (
    <div className="w-full max-w-xl mx-auto p-4 mb-6 rounded-[12px] border-2 border-[#ff9600] bg-[#fff9f0] flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-[#ffeed6] rounded-[12px] text-[#ff9600]">
          {status.permission === 'not-found' ? (
            <MicOff className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
        </div>
        <div>
          <h4 className="font-bold text-sm text-[#042c60] uppercase tracking-[0.053em]">
            Microphone Access Required
          </h4>
          <p className="text-xs text-[#4b4b4b] mt-0.5">
            {status.errorMessage ||
              'Please allow microphone permission to engage in voice mock interviews.'}
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={onRequestAccess}
        className="shrink-0 flex items-center space-x-1 border-[#ff9600] text-[#ff9600] hover:bg-[#ffeed6]"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Enable Mic</span>
      </Button>
    </div>
  );
}
