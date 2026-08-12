'use client';

import { useId, useState } from 'react';

type ContactAdminRevealProps = Readonly<{
  adminEmail: string;
}>;

export function ContactAdminReveal({ adminEmail }: ContactAdminRevealProps) {
  const panelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const hasAdminEmail = adminEmail.trim().length > 0;

  function togglePanel() {
    setIsOpen((current) => !current);
  }

  return (
    <div className="w-full max-w-xl">
      <button
        type="button"
        onClick={togglePanel}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="glass-panel w-full rounded-3xl border-white/10 bg-[rgba(19,19,19,0.72)] px-8 py-5 text-center text-lg font-medium text-(--hg-text) shadow-[0_18px_44px_rgba(0,0,0,0.24)] transition-all duration-150 active:border-[rgba(208,188,255,0.38)] active:bg-[rgba(125,60,255,0.16)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--hg-primary)"
      >
        {isOpen ? 'Hide Admin Contact' : 'Forgot PIN? Contact Admin'}
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="glass-panel mt-4 rounded-3xl border-white/10 bg-[rgba(19,19,19,0.76)] px-6 py-5 text-left text-(--hg-text) shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
        >
          {hasAdminEmail ? (
            <>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-(--hg-secondary)">
                Admin Email
              </p>
              <p className="mt-4 break-all text-2xl font-semibold tracking-tight text-(--hg-text)">
                {adminEmail}
              </p>
            </>
          ) : (
            <p className="text-base leading-relaxed text-(--hg-muted)">
              Admin contact email is not configured on this treadmill yet. Ask staff for help.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
