'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Notification } from '@/stores/notificationStore';
import { useNotificationStore } from '@/stores';
import { ToastShell } from './ui/ToastShell';

type NotificationToastProps = Readonly<{
  notification: Notification;
}>;

function BadgeImage({ src, alt }: { src: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-(--hg-border-soft) bg-(--hg-surface-high) text-[10px] font-bold uppercase tracking-[0.18em] text-(--hg-muted)">
        Badge
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={64}
      height={64}
      className="h-16 w-16 shrink-0 rounded-2xl border border-(--hg-border-soft) object-cover"
      onError={() => setErrored(true)}
    />
  );
}

function NotificationToast({ notification }: NotificationToastProps) {
  const dismiss = useNotificationStore((state) => state.dismiss);
  const isXpNotification = notification.type === 'xp';

  const baseClassName = isXpNotification
    ? 'glass-panel pointer-events-auto w-full max-w-sm rounded-2xl border border-(--hg-border-soft) bg-[rgb(9_16_42/0.96)] px-5 py-4 shadow-[0_18px_44px_rgba(0,0,0,0.34)] backdrop-blur-xl transition-all duration-300 ease-out'
    : 'glass-panel pointer-events-auto w-full max-w-md rounded-3xl border border-(--hg-border-soft) px-4 py-4 shadow-[0_18px_56px_rgba(0,0,0,0.32)] backdrop-blur-xl transition-all duration-300 ease-out';

  return (
    <ToastShell
      id={notification.id}
      autoDismissMs={3000}
      className={baseClassName}
      onDismiss={() => dismiss(notification.id)}
    >
      {isXpNotification ? (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-(--hg-muted)">
            XP Updated
          </p>
          <p className="text-lg font-bold leading-6 text-(--hg-text)">{notification.message}</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {notification.imagePath ? (
            <BadgeImage src={notification.imagePath} alt={`${notification.name} badge art`} />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-(--hg-border-soft) bg-(--hg-surface-high) text-[10px] font-bold uppercase tracking-[0.18em] text-(--hg-muted)">
              Badge
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-(--hg-tertiary)">
              Badge Unlocked
            </p>
            <p className="text-sm font-semibold text-(--hg-text)">{notification.name}</p>
            <p className="text-xs leading-4 text-(--hg-muted)">{notification.description}</p>
          </div>
        </div>
      )}
    </ToastShell>
  );
}

export function NotificationOverlay() {
  const queue = useNotificationStore((state) => state.queue);
  const activeNotification = queue[0];

  if (!activeNotification) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center p-4"
      data-testid="notification-overlay"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-3">
        <NotificationToast key={activeNotification.id} notification={activeNotification} />
      </div>
    </div>
  );
}

export default NotificationOverlay;
