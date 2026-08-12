export const USER_ROLE = 'user' as const;
export const GUEST_ROLE = 'guest' as const;
export const ADMIN_ROLE = 'admin' as const;

export type AppUserRole = typeof USER_ROLE | typeof GUEST_ROLE | typeof ADMIN_ROLE;

type AuthUserIdentity = {
  id: number | string;
  username: string;
  role: AppUserRole;
};

export type AuthSessionUser = {
  id: string;
  username: string;
  name: string;
  role: AppUserRole;
};

export function toAuthSessionUser(user: AuthUserIdentity): AuthSessionUser {
  return {
    id: String(user.id),
    username: user.username,
    name: user.role === GUEST_ROLE ? 'Guest' : user.username,
    role: user.role,
  };
}
