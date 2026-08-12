import { auth } from '@/auth';
import { MoreNavGrid } from '@/components/dashboard/MoreNavGrid';
import { ADMIN_ROLE } from '@/lib/auth/sessionUser';

export default async function MorePage() {
  const session = await auth();
  const isAdmin = session?.user.role === ADMIN_ROLE;

  return (
    <div className="p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--hg-text)]">MORE</h1>
      </div>

      <MoreNavGrid isAdmin={isAdmin} />
    </div>
  );
}
