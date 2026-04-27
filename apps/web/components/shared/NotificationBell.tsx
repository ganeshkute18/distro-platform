'use client';

import React from 'react';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '../../store/notification.store';
import { api } from '../../lib/api-client';

export function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore();
  const [open, setOpen] = React.useState(false);

  async function onRead(id: string) {
    markRead(id);
    await api.patch(`/notifications/${id}/read`);
  }

  async function onReadAll() {
    markAllRead();
    await api.patch('/notifications/read-all');
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative rounded-lg p-2 hover:bg-accent" aria-label="Notifications">
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border bg-card p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Notifications</p>
            <button onClick={onReadAll} className="text-xs text-primary underline">Mark all read</button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {notifications.length ? notifications.map((n) => (
              <button key={n.id} onClick={() => onRead(n.id)} className={`w-full rounded-lg border p-2 text-left ${n.isRead ? 'opacity-70' : 'bg-primary/5'}`}>
                <p className="text-xs font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.message}</p>
              </button>
            )) : <p className="text-xs text-muted-foreground">No notifications</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

