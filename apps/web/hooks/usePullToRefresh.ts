// Hook for pull-to-refresh functionality on mobile
'use client';

import { useRef, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  triggerDistance?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 50,
  triggerDistance = 100,
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      const scrollTop = container.scrollTop;
      if (scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshingRef.current) return;
      if (startYRef.current === 0) return;

      const scrollTop = container.scrollTop;
      if (scrollTop !== 0) {
        startYRef.current = 0;
        return;
      }

      currentYRef.current = e.touches[0].clientY;
      const distance = currentYRef.current - startYRef.current;

      if (distance > 0) {
        e.preventDefault();
        // Visual feedback could be added here (spinner animation, etc.)
      }

      if (distance > triggerDistance && !isRefreshingRef.current) {
        triggerRefresh();
      }
    };

    const handleTouchEnd = () => {
      startYRef.current = 0;
      currentYRef.current = 0;
    };

    const triggerRefresh = async () => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;

      try {
        await onRefresh();
      } finally {
        isRefreshingRef.current = false;
      }
    };

    container.addEventListener('touchstart', handleTouchStart, false);
    container.addEventListener('touchmove', handleTouchMove, false);
    container.addEventListener('touchend', handleTouchEnd, false);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, triggerDistance]);

  return { containerRef };
}

// Component wrapper for pull-to-refresh
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

export function PullToRefreshContainer({
  onRefresh,
  children,
  className = '',
}: PullToRefreshProps) {
  const { containerRef } = usePullToRefresh({ onRefresh });

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ overscrollBehavior: 'contain' }}
    >
      {children}
    </div>
  );
}
