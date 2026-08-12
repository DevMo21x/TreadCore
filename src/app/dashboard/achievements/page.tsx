import { auth } from '@/auth';
import { getActiveAchievementDefinitions, getUserAchievements } from '@/db/queries/achievements';
import { redirect } from 'next/navigation';

// This page displays all badges for the current user.
// Badges are split into two groups: those the user has earned and those still to be earned
export default async function AchievementsPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const userId = Number(session.user.id);

  // Fetch the user's earned achievements and all available achievement definitions in parallel
  const [earnedAchievements, allDefinitions] = await Promise.all([
    getUserAchievements(userId),
    getActiveAchievementDefinitions(),
  ]);

  // Build a set of achievement IDs the user has already earned for quick lookup
  const earnedIds = new Set(earnedAchievements.map((achievement) => achievement.id));

  // Filter out the definitions that the user has not yet earned
  const unearnedDefinitions = allDefinitions.filter((definition) => !earnedIds.has(definition.id));

  return (
    <div className="p-8 overflow-y-auto">
      {/* Page heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--hg-text)]">Achievements</h1>
        <p className="text-sm text-[var(--hg-muted)] mt-1">
          View the badges you have earned and discover new ones to unlock
        </p>
      </div>

      {/* Section for badges the user has earned */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[var(--hg-text)] mb-4">Earned Badges</h2>

        {earnedAchievements.length === 0 ? (
          <p className="text-[var(--hg-muted)]">
            You have not earned any badges yet. Keep working out to unlock achievements!
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {earnedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex flex-col items-center rounded-lg border border-green-500/30 bg-[var(--hg-surface-panel)] p-4 shadow-sm backdrop-blur-sm"
              >
                {/* Earned badge icon */}
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-2xl">
                  🏆
                </div>

                <span className="text-center text-sm font-medium text-[var(--hg-text)]">
                  {achievement.name}
                </span>
                <span className="mt-1 text-center text-xs text-[var(--hg-muted)]">
                  {achievement.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Section for badges the user has not yet earned */}
      <section>
        <h2 className="text-xl font-semibold text-[var(--hg-text)] mb-4">Badges Still to Earn</h2>

        {unearnedDefinitions.length === 0 ? (
          <p className="text-[var(--hg-muted)]">
            Congratulations! You have earned every available badge.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {unearnedDefinitions.map((definition) => (
              <div
                key={definition.id}
                className="flex flex-col items-center rounded-lg border border-[color:var(--hg-border-soft)] bg-[var(--hg-surface-panel)] p-4 opacity-60 shadow-sm backdrop-blur-sm"
              >
                {/* Locked badge placeholder */}
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--hg-interactive-soft)] text-2xl">
                  🔒
                </div>

                <span className="text-center text-sm font-medium text-[var(--hg-text)]">
                  {definition.name}
                </span>
                <span className="mt-1 text-center text-xs text-[var(--hg-muted)]">
                  {definition.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
