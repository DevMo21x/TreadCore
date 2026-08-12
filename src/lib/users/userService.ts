import 'server-only';

import { randomUUID } from 'node:crypto';
import db from '@/db/index';
import { users } from '@/db/schema';
import { GUEST_ROLE, USER_ROLE, type AppUserRole } from '@/lib/auth/sessionUser';
import { hashPin } from '@/lib/auth/scrypt';
import { type ThemeMode } from '@/lib/users/themeMode';
import { and, eq, ne } from 'drizzle-orm';

export type SafeAuthUser = {
  id: string;
  username: string;
  name: string;
  role: AppUserRole;
};

export type AuthUserRecord = {
  id: number;
  username: string;
  password: string;
  role: AppUserRole;
};

export type UserProfileMetrics = {
  weightKg: number | null;
  ageYears: number | null;
};

export type UserThemePreference = {
  themeMode: ThemeMode;
};

export type UserProfile = {
  id: number;
  username: string;
  role: AppUserRole;
  createdAt: Date | null;
} & UserProfileMetrics &
  UserThemePreference;

export type DeletedUser = {
  id: number;
  username: string;
  role: AppUserRole;
};

export type UpdatedUser = {
  id: number;
  username: string;
  role: AppUserRole;
};

export type UpdatedUserProfile = {
  id: number;
  username: string;
  role: AppUserRole;
  weightKg: number | null;
  ageYears: number | null;
  themeMode: ThemeMode;
};

const GUEST_USERNAME_PREFIX = 'guest-';

function buildGuestUsername() {
  return `${GUEST_USERNAME_PREFIX}${randomUUID()}`;
}

export function isInternalGuestUsername(username: string) {
  return username.trim().startsWith(GUEST_USERNAME_PREFIX);
}

export async function findUserByUsername(username: string): Promise<AuthUserRecord | null> {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      password: users.password,
      role: users.role,
    })
    .from(users)
    .where(eq(users.username, username.trim()))
    .limit(1);

  return user ?? null;
}

export async function findUserCredentialsById(userId: number): Promise<AuthUserRecord | null> {
  if (!Number.isInteger(userId) || userId < 1) {
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      password: users.password,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function findUserProfileById(userId: number): Promise<UserProfile | null> {
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
      weightKg: users.weightKg,
      ageYears: users.ageYears,
      themeMode: users.themeMode,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return user ?? null;
}

export async function createUserAccount(
  username: string,
  passwordHash: string
): Promise<UpdatedUser | null> {
  const normalizedUsername = username.trim();
  const normalizedPasswordHash = passwordHash.trim();

  if (
    !normalizedUsername.length ||
    !normalizedPasswordHash.length ||
    isInternalGuestUsername(normalizedUsername)
  ) {
    return null;
  }

  const [createdUser] = await db
    .insert(users)
    .values({
      username: normalizedUsername,
      password: normalizedPasswordHash,
      role: USER_ROLE,
    })
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

  return createdUser ?? null;
}

export async function updateUsernameById(
  userId: number,
  username: string
): Promise<UpdatedUser | null> {
  const normalizedUsername = username.trim();

  if (!Number.isInteger(userId) || userId < 1 || normalizedUsername.length === 0) {
    return null;
  }

  const [updatedUser] = await db
    .update(users)
    .set({ username: normalizedUsername })
    .where(and(eq(users.id, userId), ne(users.role, GUEST_ROLE)))
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

  return updatedUser ?? null;
}

export async function updateProfileMetricsById(
  userId: number,
  metrics: UserProfileMetrics
): Promise<UpdatedUserProfile | null> {
  if (
    !Number.isInteger(userId) ||
    userId < 1 ||
    (metrics.weightKg !== null && (!Number.isFinite(metrics.weightKg) || metrics.weightKg <= 0)) ||
    (metrics.ageYears !== null && (!Number.isInteger(metrics.ageYears) || metrics.ageYears <= 0))
  ) {
    return null;
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      weightKg: metrics.weightKg,
      ageYears: metrics.ageYears,
    })
    .where(and(eq(users.id, userId), ne(users.role, GUEST_ROLE)))
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
      weightKg: users.weightKg,
      ageYears: users.ageYears,
      themeMode: users.themeMode,
    });

  return updatedUser ?? null;
}

export async function updateThemeModeById(
  userId: number,
  themeMode: ThemeMode
): Promise<UpdatedUserProfile | null> {
  if (!Number.isInteger(userId) || userId < 1) {
    return null;
  }

  const [updatedUser] = await db
    .update(users)
    .set({ themeMode })
    .where(and(eq(users.id, userId), ne(users.role, GUEST_ROLE)))
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
      weightKg: users.weightKg,
      ageYears: users.ageYears,
      themeMode: users.themeMode,
    });

  return updatedUser ?? null;
}

export async function updatePasswordById(
  userId: number,
  passwordHash: string
): Promise<UpdatedUser | null> {
  const normalizedPasswordHash = passwordHash.trim();

  if (!Number.isInteger(userId) || userId < 1 || normalizedPasswordHash.length === 0) {
    return null;
  }

  const [updatedUser] = await db
    .update(users)
    .set({ password: normalizedPasswordHash })
    .where(and(eq(users.id, userId), ne(users.role, GUEST_ROLE)))
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

  return updatedUser ?? null;
}

export async function deleteUserById(userId: number): Promise<DeletedUser | null> {
  if (!Number.isInteger(userId) || userId < 1) {
    return null;
  }

  const [deletedUser] = await db
    .delete(users)
    .where(and(eq(users.id, userId), ne(users.role, GUEST_ROLE)))
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

  return deletedUser ?? null;
}

export async function deleteGuestUserById(userId: number): Promise<DeletedUser | null> {
  if (!Number.isInteger(userId) || userId < 1) {
    return null;
  }

  const [deletedGuestUser] = await db
    .delete(users)
    .where(and(eq(users.id, userId), eq(users.role, GUEST_ROLE)))
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

  return deletedGuestUser ?? null;
}

export async function promoteGuestUserById(
  userId: number,
  username: string,
  passwordHash: string
): Promise<UpdatedUser | null> {
  const normalizedUsername = username.trim();
  const normalizedPasswordHash = passwordHash.trim();

  if (
    !Number.isInteger(userId) ||
    userId < 1 ||
    normalizedUsername.length === 0 ||
    normalizedPasswordHash.length === 0
  ) {
    return null;
  }

  const [promotedUser] = await db
    .update(users)
    .set({
      username: normalizedUsername,
      password: normalizedPasswordHash,
      role: USER_ROLE,
    })
    .where(and(eq(users.id, userId), eq(users.role, GUEST_ROLE)))
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

  return promotedUser ?? null;
}

export async function createGuestUser() {
  const guestPassword = await hashPin(randomUUID());
  const [createdGuestUser] = await db
    .insert(users)
    .values({
      username: buildGuestUsername(),
      password: guestPassword,
      role: GUEST_ROLE,
    })
    .returning({
      id: users.id,
      username: users.username,
      role: users.role,
    });

  if (!createdGuestUser) {
    throw new Error('Failed to create guest user');
  }

  return createdGuestUser;
}
