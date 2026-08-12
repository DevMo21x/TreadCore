'use client';

import { type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

const EXIT_TRANSITION_MS = 250;
const ENTER_DELAY_MS = 10;

type ToastShellProps = Readonly<{
  id: string;
  autoDismissMs: number;
  ariaLive?: 'polite' | 'assertive';
  className: string;
  children: ReactNode;
  onDismiss: () => void;
}>;

export function ToastShell({
  id,
  autoDismissMs,
  ariaLive = 'polite',
  className,
  children,
  onDismiss,
}: ToastShellProps) {
  const onDismissRef = useRef(onDismiss);

  useLayoutEffect(() => {
    onDismissRef.current = onDismiss;
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const exitStartsAt = autoDismissMs - EXIT_TRANSITION_MS;

    const enterTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, ENTER_DELAY_MS);
    const exitTimer = window.setTimeout(() => {
      setIsVisible(false);
    }, exitStartsAt);
    const dismissTimer = window.setTimeout(() => onDismissRef.current(), autoDismissMs);
    // onDismiss intentionally omitted from deps — always read via ref at call time

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [autoDismissMs]);

  const animationClass = isVisible
    ? 'translate-y-0 scale-100 opacity-100'
    : 'translate-y-2 scale-95 opacity-0';

  return (
    <article
      data-testid={`toast-${id}`}
      className={`${className} ${animationClass}`}
      role="status"
      aria-live={ariaLive}
    >
      {children}
    </article>
  );
}

export default ToastShell;
