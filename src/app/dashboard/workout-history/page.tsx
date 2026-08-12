import { auth } from '@/auth';
import WorkoutDashboard from '@/components/WorkoutDashboard';
import { getWorkoutHistory } from '@/lib/actions/workout';
import { redirect } from 'next/navigation';

export default async function WorkoutHistoryPage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  if (!session || Number.isNaN(userId)) {
    redirect('/login');
  }

  const history = await getWorkoutHistory(userId);

  return (
    <div className="h-full flex flex-col p-6">
      <h1 className="text-(--hg-text) mb-6 text-2xl font-bold">Workout History</h1>
      <WorkoutDashboard initialHistory={history} userId={userId} />
    </div>
  );
}
