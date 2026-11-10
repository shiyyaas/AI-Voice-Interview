import type { Metadata } from 'next';
import './globals.css';
import { VoiceEngineProvider } from '@/context/VoiceEngineContext';

export const metadata: Metadata = {
  title: 'VocalPrep | AI Voice Mock Interviews',
  description: 'Master your technical interviews with realistic voice AI practice.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-[#4b4b4b] antialiased flex flex-col selection:bg-[#d7ffb8] selection:text-[#042c60]">
        <VoiceEngineProvider>
          {children}
        </VoiceEngineProvider>
      </body>
    </html>
  );
}
