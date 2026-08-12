import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getUserWeight(userId: number): Promise<number | null> {
  const result = await db
    .select({ weightKg: users.weightKg })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0].weightKg ?? null;
}
