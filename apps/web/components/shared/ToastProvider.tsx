// Enhanced toast notification configuration and utilities
'use client';

import toast, { Toaster, ToastOptions } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

// Custom toast styling
export const toastConfig = {
  success: {
    style: {
      background: 'hsl(var(--color-success-bg))',
      color: 'hsl(var(--color-success-text))',
      border: '1px solid hsl(var(--color-success-border))',
      borderRadius: '0.5rem',
      padding: '1rem 1.25rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
    },
    icon: <CheckCircle className="w-5 h-5" />,
  },
  error: {
    style: {
      background: 'hsl(var(--color-error-bg))',
      color: 'hsl(var(--color-error-text))',
      border: '1px solid hsl(var(--color-error-border))',
      borderRadius: '0.5rem',
      padding: '1rem 1.25rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
    },
    icon: <XCircle className="w-5 h-5" />,
  },
  info: {
    style: {
      background: 'hsl(var(--color-info-bg))',
      color: 'hsl(var(--color-info-text))',
      border: '1px solid hsl(var(--color-info-border))',
      borderRadius: '0.5rem',
      padding: '1rem 1.25rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
    },
    icon: <Info className="w-5 h-5" />,
  },
  warning: {
    style: {
      background: 'hsl(var(--color-warning-bg))',
      color: 'hsl(var(--color-warning-text))',
      border: '1px solid hsl(var(--color-warning-border))',
      borderRadius: '0.5rem',
      padding: '1rem 1.25rem',
      fontSize: '0.875rem',
      fontWeight: 500,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
    },
    icon: <AlertCircle className="w-5 h-5" />,
  },
} as const;

// Custom toast functions with auto-dismiss
export const showToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, {
      duration: 3000,
      ...options,
      style: toastConfig.success.style,
    }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, {
      duration: 4000,
      ...options,
      style: toastConfig.error.style,
    }),

  info: (message: string, options?: ToastOptions) =>
    toast((t) => (
      <div className="flex items-center gap-3">
        {toastConfig.info.icon}
        <span>{message}</span>
      </div>
    ), {
      duration: 3000,
      ...options,
      style: toastConfig.info.style,
    }),

  loading: (message: string) =>
    toast.loading(message, {
      style: {
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
      },
    }),

  promise: <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ) =>
    toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }
    ),
};

// Toaster configuration component
export function ToasterProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        duration: 3000,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      }}
    />
  );
}
