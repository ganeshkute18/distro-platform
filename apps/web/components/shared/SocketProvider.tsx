'use client';

import { useEffect } from 'react';
import { getSocket, disconnectSocket } from '../../lib/socket';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationStore } from '../../store/notification.store';
import toast from 'react-hot-toast';
import { registerPushSubscription } from '../../lib/push-notifications';
import { api } from '../../lib/api-client';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken } = useAuthStore();
  const { addNotification, setNotifications } = useNotificationStore();

  useEffect(() => {
    if (!user || !accessToken) return;

    void registerPushSubscription();
    void api
      .get<{ data: any[]; meta: { unreadCount: number } }>('/notifications?limit=20')
      .then((res) => setNotifications(res.data as any, res.meta.unreadCount))
      .catch(() => undefined);

    const socket = getSocket(accessToken);

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('notification', (payload: {
      type: string;
      message?: string;
      data?: { orderNumber?: string };
    }) => {
      const msg = payload.message || `New ${payload.type?.replace(/_/g, ' ').toLowerCase()}`;

      // Add to store
      addNotification({
        id: `${Date.now()}`,
        title: msg,
        message: msg,
        type: payload.type,
        referenceId: payload.data?.orderNumber,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Show toast
      toast(msg, { icon: '🔔', duration: 5000 });
    });

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });

    socket.on('connect_error', (err: Error) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return () => {
      disconnectSocket();
    };
  }, [user?.id, accessToken]);

  return <>{children}</>;
}
