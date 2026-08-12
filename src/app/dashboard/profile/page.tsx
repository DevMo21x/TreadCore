import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { WorkoutHeatmapCalendar } from '@/components/profile/WorkoutHeatmapCalendar';
import { getFirstWorkoutDate, getWorkoutDistanceByDate } from '@/db/queries/workouts';
import { GUEST_ROLE } from '@/lib/auth/sessionUser';
import { findUserProfileById } from '@/lib/users/userService';
import { getUserLifetimeStats } from '@/lib/actions/leaderboard';

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  dateStyle: 'medium',
});

const numberFormatter = new Intl.NumberFormat('en-CA', {
  maximumFractionDigits: 1,
});

function subDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() - days);
  return nextDate;
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatJoinedDate(createdAt: Date | string | number | null) {
  if (!createdAt) {
    return 'Unknown';
  }

  const normalizedDate = createdAt instanceof Date ? createdAt : new Date(createdAt);

  if (Number.isNaN(normalizedDate.getTime())) {
    return 'Unknown';
  }

  return dateFormatter.format(normalizedDate);
}

export default async function ProfilePage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!session || Number.isNaN(userId)) {
    redirect('/login');
  }

  const profile = await findUserProfileById(userId);

  if (!profile) {
    notFound();
  }

  const isGuest = profile.role === GUEST_ROLE;
  const displayName = isGuest ? 'Guest' : profile.username;
  const emptyStats = { totalDistanceKm: 0, totalCalories: 0, totalXp: 0, workoutCount: 0 };

  const endDate = toLocalDateString(new Date());
  const oneYearAgo = toLocalDateString(subDays(new Date(), 365));

  async function fetchFirstWorkoutAndCounts() {
    const firstWorkoutDate = await getFirstWorkoutDate(userId);
    const startDate = firstWorkoutDate
      ? firstWorkoutDate > oneYearAgo
        ? firstWorkoutDate
        : oneYearAgo
      : null;
    const workoutDistances = startDate
      ? await getWorkoutDistanceByDate(userId, -4, { startDate, endDate })
      : [];
    return { firstWorkoutDate, workoutDistances };
  }

  const [lifetimeStats, { firstWorkoutDate, workoutDistances }] = isGuest
    ? [emptyStats, { firstWorkoutDate: null, workoutDistances: [] }]
    : await Promise.all([
        getUserLifetimeStats(userId).then((stats) => stats ?? emptyStats),
        fetchFirstWorkoutAndCounts(),
      ]);

  const startDate = firstWorkoutDate
    ? firstWorkoutDate > oneYearAgo
      ? firstWorkoutDate
      : oneYearAgo
    : null;

  const stats = [
    {
      label: 'Workouts',
      value: String(lifetimeStats.workoutCount),
    },
    {
      label: 'Distance',
      value: `${numberFormatter.format(lifetimeStats.totalDistanceKm)} km`,
    },
    {
      label: 'Calories',
      value: numberFormatter.format(lifetimeStats.totalCalories),
    },
    {
      label: 'XP',
      value: numberFormatter.format(lifetimeStats.totalXp),
    },
  ];

  return (
    <div className="px-6 py-5 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="rounded-3xl bg-[var(--hg-surface-high)] p-5 text-[var(--hg-text)] shadow-lg">
          <p className="text-base uppercase tracking-[0.2em] text-[var(--hg-muted)]">Profile</p>
          <h1 className="mt-2 text-5xl font-bold tracking-tight">{displayName}</h1>
          <p className="mt-2 text-base text-[var(--hg-muted)]">
            Member since {formatJoinedDate(profile.createdAt)}
          </p>
        </div>

        {isGuest ? (
          <div className="rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-3xl font-semibold text-[var(--hg-text)]">Guest profile</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--hg-muted)]">
              Sign up for an account to track long-term stats and unlock your full profile.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-emerald-600 px-5 py-2 text-base font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-[color:var(--hg-separator)] px-5 py-2 text-base font-semibold text-[var(--hg-text)] transition-colors hover:border-[color:var(--hg-divider)] hover:bg-[color:var(--hg-interactive-muted)]"
              >
                Log In
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4">
              {stats.map((stat) => (
                <section
                  key={stat.label}
                  className="rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] p-5 shadow-lg backdrop-blur-sm"
                >
                  <p className="text-base font-medium text-[var(--hg-muted)]">{stat.label}</p>
                  <p className="mt-3 text-4xl font-bold tracking-tight text-[var(--hg-text)]">
                    {stat.value}
                  </p>
                </section>
              ))}
            </div>

            <div className="rounded-3xl border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] p-5 shadow-lg backdrop-blur-sm">
              <h2 className="mb-4 text-xl font-semibold text-[var(--hg-text)]">Activity</h2>
              {startDate ? (
                <div className="overflow-x-auto">
                  <WorkoutHeatmapCalendar
                    workoutDistances={workoutDistances}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </div>
              ) : (
                <p className="text-base text-[var(--hg-muted)]">
                  Complete your first workout to see your activity here.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
