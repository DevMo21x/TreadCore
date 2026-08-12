import type { Session } from 'next-auth';

import { ADMIN_ROLE } from '@/lib/auth/sessionUser';

export function isAdminSession(session: Session | null): session is Session {
  return session?.user?.role === ADMIN_ROLE;
}
