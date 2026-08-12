'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllUsers } from '@/lib/actions/user';

type Stage = 'username' | 'pin';

type LoginUserSelectionPanelProps = {
  mode?: 'login';
  stage: Stage;
  username: string;
  onSelectUser: (username: string) => void;
  onSwitchUser: () => void;
  onUsersLoaded?: (users: string[]) => void;
  className?: string;
};

type QuickLoginUserSelectionPanelProps = {
  mode: 'quick-login';
  username?: string;
  onUsersLoaded?: (users: string[]) => void;
  className?: string;
};

type UserSelectionPanelProps = LoginUserSelectionPanelProps | QuickLoginUserSelectionPanelProps;

function formatDisplayName(username: string) {
  return username.charAt(0).toUpperCase() + username.slice(1);
}

export function UserSelectionPanel(props: UserSelectionPanelProps) {
  const [usernames, setUsernames] = useState<string[]>([]);
  const { onUsersLoaded } = props;
  const usernameFilter = props.username ?? '';
  const panelClassName = props.className ?? (props.mode === 'quick-login' ? 'w-[40%]' : 'w-[30%]');
  const panelShellClassName = `glass-panel flex ${panelClassName} flex-col rounded-4xl border-white/15 bg-[rgba(19,19,19,0.72)] p-6 text-(--hg-text) shadow-[0_24px_72px_rgba(0,0,0,0.26)] sm:p-8`;
  const quickLoginItemClassName =
    'group flex items-center justify-between rounded-3xl border border-white/10 bg-[rgba(19,19,19,0.62)] px-6 py-4 transition-all duration-150 active:border-[rgba(189,244,255,0.46)] active:bg-[rgba(0,227,253,0.14)] active:shadow-[0_10px_24px_rgba(0,227,253,0.1)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--hg-secondary) touch-manipulation';
  const loginItemClassName =
    'w-full rounded-3xl border border-white/10 bg-[rgba(19,19,19,0.62)] px-6 py-5 text-left transition-all duration-150 active:border-[rgba(208,188,255,0.48)] active:bg-[rgba(125,60,255,0.14)] active:shadow-[0_10px_24px_rgba(125,60,255,0.12)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--hg-primary) touch-manipulation';

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const dbUsernames = await getAllUsers();

        if (!isMounted) return;

        setUsernames(dbUsernames);
        onUsersLoaded?.(dbUsernames);
      } catch (error) {
        if (!isMounted) return;

        console.error('Failed to load users:', error);
        setUsernames([]);
        onUsersLoaded?.([]);
      }
    }

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [onUsersLoaded]);

  const suggestions =
    usernameFilter.length > 0
      ? usernames.filter((user) => user.startsWith(usernameFilter.toLowerCase()))
      : usernames;

  if (props.mode === 'quick-login') {
    return (
      <div className={panelShellClassName}>
        <p className="text-[11px] font-bold tracking-[0.28em] text-(--hg-secondary)">
          ACTIVE PROFILES
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-(--hg-text)">
          Quick Login
        </h2>
        <p className="mt-3 text-sm leading-6 text-(--hg-muted)">
          Jump straight into a saved profile and resume your session.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          {suggestions.length > 0 ? (
            suggestions.map((user) => (
              <Link
                key={user}
                href={`/login?user=${encodeURIComponent(user)}`}
                className={quickLoginItemClassName}
              >
                <div>
                  <div className="text-xl font-semibold tracking-[-0.03em] text-(--hg-text)">
                    {formatDisplayName(user)}
                  </div>
                  <div className="mt-1 text-sm text-(--hg-muted)">@{user}</div>
                </div>
                <span
                  aria-hidden="true"
                  className="text-3xl text-(--hg-secondary) transition-transform duration-150 group-active:translate-x-1"
                >
                  →
                </span>
              </Link>
            ))
          ) : (
            <p className="rounded-3xl border border-dashed border-white/10 bg-[rgba(19,19,19,0.42)] px-5 py-6 text-lg text-(--hg-muted)">
              No users found
            </p>
          )}
        </div>
      </div>
    );
  }

  const { stage, username, onSelectUser, onSwitchUser } = props;

  return (
    <div className={panelShellClassName}>
      <p className="text-[11px] font-bold tracking-[0.28em] text-(--hg-primary)">AUTH FLOW</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-(--hg-text)">
        {stage === 'username' ? 'Select User' : `Welcome, ${username}`}
      </h2>
      <p className="mt-3 text-sm leading-6 text-(--hg-muted)">
        {stage === 'username'
          ? 'Choose a profile to continue to PIN entry.'
          : 'Confirm your profile with the on-screen PIN pad.'}
      </p>

      {stage === 'username' ? (
        <div className="mt-8 flex flex-col gap-3">
          {suggestions.length > 0 ? (
            suggestions.map((user) => (
              <button key={user} onClick={() => onSelectUser(user)} className={loginItemClassName}>
                <div className="flex items-center justify-between gap-4">
                  <div className="text-xl font-semibold tracking-[-0.03em] text-(--hg-text)">
                    @{user}
                  </div>
                  <span aria-hidden="true" className="text-(--hg-primary)">
                    SELECT
                  </span>
                </div>
              </button>
            ))
          ) : (
            <p className="rounded-3xl border border-dashed border-white/10 bg-[rgba(19,19,19,0.42)] px-5 py-6 text-lg text-(--hg-muted)">
              No users found
            </p>
          )}
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-4">
          <p className="text-lg text-(--hg-muted)">Enter your PIN to continue.</p>
          <button
            onClick={onSwitchUser}
            className="rounded-3xl border border-[rgba(208,188,255,0.35)] bg-[rgba(125,60,255,0.1)] px-6 py-5 text-lg font-medium text-(--hg-primary) transition-all duration-150 active:bg-[rgba(125,60,255,0.2)] active:shadow-[0_10px_24px_rgba(125,60,255,0.12)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--hg-primary) touch-manipulation"
          >
            ← Switch User
          </button>
        </div>
      )}
    </div>
  );
}
