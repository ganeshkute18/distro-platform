'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { SocketProvider } from '../components/shared/SocketProvider';
import { ThemeProvider } from '../components/shared/theme';
import { ToasterProvider } from '../components/shared/ToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60 * 1000, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SocketProvider>
          {children}
          <ToasterProvider />
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
