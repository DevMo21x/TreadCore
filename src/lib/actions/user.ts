'use server';

import { auth } from '@/auth';
import db from '@/db/index';
import { users } from '@/db/schema';
import {
  createUserAccount,
  deleteGuestUserById,
  deleteUserById,
  findUserByUsername,
  findUserCredentialsById,
  findUserProfileById,
  isInternalGuestUsername,
  promoteGuestUserById,
  type DeletedUser,
  type UpdatedUser,
  type UpdatedUserProfile,
  updatePasswordById,
  updateProfileMetricsById,
  updateThemeModeById,
  updateUsernameById,
} from '@/lib/users/userService';
import { ADMIN_ROLE, GUEST_ROLE } from '@/lib/auth/sessionUser';
import { profileMetricsSchema } from '@/lib/users/profileMetricsValidation';
import { type ThemeMode, themeModeSchema } from '@/lib/users/themeMode';
import {
  clearPinChangeThrottle,
  getPinChangeThrottleStatus,
  recordFailedPinChangeAttempt,
} from '@/lib/core/rateLimit';
import { pinSchema } from '@/lib/users/pinValidation';
import { hashPin, verifyPin } from '@/lib/auth/scrypt';
import {
  assertUsernameIsAllowed,
  USERNAME_INAPPROPRIATE_LANGUAGE_MESSAGE,
} from '@/lib/users/usernameModeration';
import { normalizeUsername, usernameSchema } from '@/lib/users/usernameValidation';
import { and, eq, ne } from 'drizzle-orm';
import { z } from 'zod';

const createUserSchema = z.object({
  username: usernameSchema,
  pin: pinSchema,
});

const deleteCurrentUserAccountSchema = z.object({
  username: usernameSchema,
});

const updateCurrentUsernameSchema = z.object({
  username: usernameSchema,
});

const updateCurrentPinSchema = z.object({
  currentPin: pinSchema,
  newPin: pinSchema,
  confirmPin: pinSchema,
});

const updateCurrentProfileMetricsSchema = profileMetricsSchema;
const updateCurrentThemeModeSchema = themeModeSchema;

export type DeleteCurrentUserAccountFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export type UpdateCurrentUsernameFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
  updatedUsername?: string;
};

export type UpdateCurrentPinFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
};

export type UpdateCurrentProfileMetricsFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
  updatedWeightKg?: number | null;
  updatedAgeYears?: number | null;
};

export type UpdateCurrentThemeModeFormState = {
  status: 'idle' | 'error' | 'success';
  message: string;
  updatedThemeMode?: ThemeMode;
};

type DeleteCurrentUserAccountDependencies = {
  auth: typeof auth;
  deleteUserById: typeof deleteUserById;
  findUserProfileById: typeof findUserProfileById;
};

type CreateUserDependencies = {
  auth: typeof auth;
  createUserAccount: typeof createUserAccount;
  findUserByUsername: typeof findUserByUsername;
  hashPin: typeof hashPin;
  promoteGuestUserById: typeof promoteGuestUserById;
};

type DiscardCurrentGuestAccountDependencies = {
  auth: typeof auth;
  deleteGuestUserById: typeof deleteGuestUserById;
};

const defaultDeleteCurrentUserAccountDependencies: DeleteCurrentUserAccountDependencies = {
  auth,
  deleteUserById,
  findUserProfileById,
};

const defaultCreateUserDependencies: CreateUserDependencies = {
  auth,
  createUserAccount,
  findUserByUsername,
  hashPin,
  promoteGuestUserById,
};

const defaultDiscardCurrentGuestAccountDependencies: DiscardCurrentGuestAccountDependencies = {
  auth,
  deleteGuestUserById,
};

type UpdateCurrentUsernameDependencies = {
  auth: typeof auth;
  findUserByUsername: typeof findUserByUsername;
  findUserProfileById: typeof findUserProfileById;
  updateUsernameById: typeof updateUsernameById;
};

type UpdateCurrentPinDependencies = {
  auth: typeof auth;
  clearPinChangeThrottle: typeof clearPinChangeThrottle;
  findUserCredentialsById: typeof findUserCredentialsById;
  getPinChangeThrottleStatus: typeof getPinChangeThrottleStatus;
  hashPin: typeof hashPin;
  recordFailedPinChangeAttempt: typeof recordFailedPinChangeAttempt;
  updatePasswordById: typeof updatePasswordById;
  verifyPin: typeof verifyPin;
};

type UpdateCurrentProfileMetricsDependencies = {
  auth: typeof auth;
  findUserProfileById: typeof findUserProfileById;
  updateProfileMetricsById: typeof updateProfileMetricsById;
};

type UpdateCurrentThemeModeDependencies = {
  auth: typeof auth;
  findUserProfileById: typeof findUserProfileById;
  updateThemeModeById: typeof updateThemeModeById;
};

const defaultUpdateCurrentUsernameDependencies: UpdateCurrentUsernameDependencies = {
  auth,
  findUserByUsername,
  findUserProfileById,
  updateUsernameById,
};

const defaultUpdateCurrentPinDependencies: UpdateCurrentPinDependencies = {
  auth,
  clearPinChangeThrottle,
  findUserCredentialsById,
  getPinChangeThrottleStatus,
  hashPin,
  recordFailedPinChangeAttempt,
  updatePasswordById,
  verifyPin,
};

const defaultUpdateCurrentProfileMetricsDependencies: UpdateCurrentProfileMetricsDependencies = {
  auth,
  findUserProfileById,
  updateProfileMetricsById,
};

const defaultUpdateCurrentThemeModeDependencies: UpdateCurrentThemeModeDependencies = {
  auth,
  findUserProfileById,
  updateThemeModeById,
};

type DeleteCurrentUserAccountFormActionDependencies = {
  deleteCurrentUserAccount: typeof deleteCurrentUserAccount;
};

const defaultDeleteCurrentUserAccountFormActionDependencies: DeleteCurrentUserAccountFormActionDependencies =
  {
    deleteCurrentUserAccount,
  };

type UpdateCurrentUsernameFormActionDependencies = {
  updateCurrentUsername: typeof updateCurrentUsername;
};

type UpdateCurrentPinFormActionDependencies = {
  updateCurrentPin: typeof updateCurrentPin;
};

type UpdateCurrentProfileMetricsFormActionDependencies = {
  updateCurrentProfileMetrics: typeof updateCurrentProfileMetrics;
};

type UpdateCurrentThemeModeFormActionDependencies = {
  updateCurrentThemeMode: typeof updateCurrentThemeMode;
};

const defaultUpdateCurrentUsernameFormActionDependencies: UpdateCurrentUsernameFormActionDependencies =
  {
    updateCurrentUsername,
  };

const defaultUpdateCurrentPinFormActionDependencies: UpdateCurrentPinFormActionDependencies = {
  updateCurrentPin,
};

const defaultUpdateCurrentProfileMetricsFormActionDependencies: UpdateCurrentProfileMetricsFormActionDependencies =
  {
    updateCurrentProfileMetrics,
  };

const defaultUpdateCurrentThemeModeFormActionDependencies: UpdateCurrentThemeModeFormActionDependencies =
  {
    updateCurrentThemeMode,
  };

const deleteCurrentUserAccountErrors = new Set([
  'Invalid delete account input',
  'You must be signed in to delete your account',
  'Guest accounts cannot be deleted',
  'You can only delete your own account',
  'User not found',
]);

const updateCurrentUsernameErrors = new Set([
  'Invalid username input',
  'You must be signed in to update your username',
  'Guest accounts cannot update their username',
  'New username must be different from your current username',
  'Username already exists',
  USERNAME_INAPPROPRIATE_LANGUAGE_MESSAGE,
  'User not found',
]);

const updateCurrentPinErrors = new Set([
  'Invalid PIN input',
  'You must be signed in to update your PIN',
  'Guest accounts cannot update their PIN',
  'Current PIN is incorrect',
  'New PIN confirmation does not match',
  'New PIN must be different from your current PIN',
  'User not found',
]);

const updateCurrentProfileMetricsErrors = new Set([
  'Invalid profile metrics input',
  'You must be signed in to update your profile metrics',
  'Guest accounts cannot update their profile metrics',
  'User not found',
]);

const updateCurrentThemeModeErrors = new Set([
  'Invalid theme mode input',
  'You must be signed in to update your theme mode',
  'Guest accounts cannot update their theme mode',
  'User not found',
]);

const createUserErrors = new Set([
  'Invalid signup input',
  'Username already exists',
  'Username is reserved',
  USERNAME_INAPPROPRIATE_LANGUAGE_MESSAGE,
  'Failed to create user',
  'Guest session not found',
]);

const discardCurrentGuestAccountErrors = new Set([
  'You must be signed in to discard your guest session',
  'Only guest sessions can be discarded',
  'Guest session not found',
]);

function isUsersUsernameUniqueConstraintError(error: unknown) {
  return (
    error instanceof Error &&
    (('code' in error && error.code === 'SQLITE_CONSTRAINT_UNIQUE') ||
      error.message.includes('users.username'))
  );
}

function getPinChangeThrottleIdentifier(userId: number) {
  return `user:${userId}`;
}

function formatRetryAfterSeconds(retryAfterSeconds: number) {
  return `${retryAfterSeconds} second${retryAfterSeconds === 1 ? '' : 's'}`;
}

function getPinChangeThrottleMessage(retryAfterSeconds: number) {
  return `Too many incorrect current PIN attempts. Try again in ${formatRetryAfterSeconds(retryAfterSeconds)}.`;
}

function isKnownUpdateCurrentPinErrorMessage(message: string) {
  return (
    updateCurrentPinErrors.has(message) ||
    message.startsWith('Too many incorrect current PIN attempts. Try again in ')
  );
}

export async function getAllUsers() {
  const allUsers = await db
    .select({
      username: users.username,
    })
    .from(users)
    .where(and(ne(users.role, GUEST_ROLE), ne(users.role, ADMIN_ROLE)));

  return allUsers.map((u) => u.username);
}

export async function createUser(
  input: { username: string; pin: string },
  dependencies: CreateUserDependencies = defaultCreateUserDependencies
) {
  const parsed = createUserSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error('Invalid signup input');
  }

  try {
    const normalizedUsername = normalizeUsername(parsed.data.username);

    assertUsernameIsAllowed(normalizedUsername);

    if (isInternalGuestUsername(normalizedUsername)) {
      throw new Error('Username is reserved');
    }

    const existingUser = await dependencies.findUserByUsername(normalizedUsername);

    if (existingUser) {
      throw new Error('Username already exists');
    }

    const passwordHash = await dependencies.hashPin(parsed.data.pin);
    const session = await dependencies.auth();
    const sessionUser = session?.user;
    const userId = Number(sessionUser?.id);

    if (sessionUser?.role === GUEST_ROLE && Number.isInteger(userId) && userId > 0) {
      const promotedUser = await dependencies.promoteGuestUserById(
        userId,
        normalizedUsername,
        passwordHash
      );

      if (!promotedUser) {
        throw new Error('Guest session not found');
      }

      return promotedUser;
    }

    const createdUser = await dependencies.createUserAccount(normalizedUsername, passwordHash);

    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    return createdUser;
  } catch (err) {
    if (isUsersUsernameUniqueConstraintError(err)) {
      throw new Error('Username already exists');
    }

    if (err instanceof Error && createUserErrors.has(err.message)) {
      throw err;
    }

    throw new Error('Something went wrong. Please try again later.');
  }
}

export async function discardCurrentGuestAccount(
  dependencies: DiscardCurrentGuestAccountDependencies = defaultDiscardCurrentGuestAccountDependencies
): Promise<DeletedUser> {
  try {
    const session = await dependencies.auth();
    const sessionUser = session?.user;
    const userId = Number(sessionUser?.id);

    if (!sessionUser || !Number.isInteger(userId) || userId < 1) {
      throw new Error('You must be signed in to discard your guest session');
    }

    if (sessionUser.role !== GUEST_ROLE) {
      throw new Error('Only guest sessions can be discarded');
    }

    const deletedGuestUser = await dependencies.deleteGuestUserById(userId);

    if (!deletedGuestUser) {
      throw new Error('Guest session not found');
    }

    return deletedGuestUser;
  } catch (err) {
    if (err instanceof Error && discardCurrentGuestAccountErrors.has(err.message)) {
      throw err;
    }

    throw new Error('Something went wrong. Please try again later.');
  }
}

export async function deleteCurrentUserAccount(
  input: { username: string },
  dependencies: DeleteCurrentUserAccountDependencies = defaultDeleteCurrentUserAccountDependencies
): Promise<DeletedUser> {
  const parsed = deleteCurrentUserAccountSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error('Invalid delete account input');
  }

  try {
    const session = await dependencies.auth();
    const sessionUser = session?.user;
    const userId = Number(sessionUser?.id);

    if (!sessionUser || !Number.isInteger(userId) || userId < 1) {
      throw new Error('You must be signed in to delete your account');
    }

    if (sessionUser.role === GUEST_ROLE) {
      throw new Error('Guest accounts cannot be deleted');
    }

    const currentProfile = await dependencies.findUserProfileById(userId);

    if (!currentProfile) {
      throw new Error('User not found');
    }

    if (normalizeUsername(currentProfile.username) !== parsed.data.username) {
      throw new Error('You can only delete your own account');
    }

    const deletedUser = await dependencies.deleteUserById(userId);

    if (!deletedUser) {
      throw new Error('User not found');
    }

    return deletedUser;
  } catch (err) {
    if (err instanceof Error && deleteCurrentUserAccountErrors.has(err.message)) {
      throw err;
    }

    throw new Error('Something went wrong. Please try again later.');
  }
}

export async function updateCurrentUsername(
  input: { username: string },
  dependencies: UpdateCurrentUsernameDependencies = defaultUpdateCurrentUsernameDependencies
): Promise<UpdatedUser> {
  const parsed = updateCurrentUsernameSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error('Invalid username input');
  }

  try {
    const session = await dependencies.auth();
    const sessionUser = session?.user;
    const userId = Number(sessionUser?.id);
    const normalizedUsername = parsed.data.username;

    assertUsernameIsAllowed(normalizedUsername);

    if (!sessionUser || !Number.isInteger(userId) || userId < 1) {
      throw new Error('You must be signed in to update your username');
    }

    if (sessionUser.role === GUEST_ROLE) {
      throw new Error('Guest accounts cannot update their username');
    }

    const currentProfile = await dependencies.findUserProfileById(userId);

    if (!currentProfile) {
      throw new Error('User not found');
    }

    if (normalizeUsername(currentProfile.username) === normalizedUsername) {
      throw new Error('New username must be different from your current username');
    }

    const existingUser = await dependencies.findUserByUsername(normalizedUsername);

    if (existingUser && existingUser.id !== userId) {
      throw new Error('Username already exists');
    }

    const updatedUser = await dependencies.updateUsernameById(userId, normalizedUsername);

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  } catch (err) {
    if (isUsersUsernameUniqueConstraintError(err)) {
      throw new Error('Username already exists');
    }

    if (err instanceof Error && updateCurrentUsernameErrors.has(err.message)) {
      throw err;
    }

    throw new Error('Something went wrong. Please try again later.');
  }
}

export async function updateCurrentPin(
  input: { currentPin: string; newPin: string; confirmPin: string },
  dependencies: UpdateCurrentPinDependencies = defaultUpdateCurrentPinDependencies
): Promise<UpdatedUser> {
  const parsed = updateCurrentPinSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error('Invalid PIN input');
  }

  try {
    const session = await dependencies.auth();
    const sessionUser = session?.user;
    const userId = Number(sessionUser?.id);

    if (!sessionUser || !Number.isInteger(userId) || userId < 1) {
      throw new Error('You must be signed in to update your PIN');
    }

    if (sessionUser.role === GUEST_ROLE) {
      throw new Error('Guest accounts cannot update their PIN');
    }

    const currentUser = await dependencies.findUserCredentialsById(userId);

    if (!currentUser) {
      throw new Error('User not found');
    }

    const throttleIdentifier = getPinChangeThrottleIdentifier(userId);
    const throttleStatus = dependencies.getPinChangeThrottleStatus(throttleIdentifier);

    if (throttleStatus.locked) {
      throw new Error(getPinChangeThrottleMessage(throttleStatus.retryAfterSeconds));
    }

    const isCurrentPinValid = await dependencies.verifyPin(
      parsed.data.currentPin,
      currentUser.password
    );

    if (!isCurrentPinValid) {
      const updatedThrottleStatus = dependencies.recordFailedPinChangeAttempt(throttleIdentifier);

      if (updatedThrottleStatus.locked) {
        throw new Error(getPinChangeThrottleMessage(updatedThrottleStatus.retryAfterSeconds));
      }

      throw new Error('Current PIN is incorrect');
    }

    dependencies.clearPinChangeThrottle(throttleIdentifier);

    if (parsed.data.newPin !== parsed.data.confirmPin) {
      throw new Error('New PIN confirmation does not match');
    }

    const isSameAsCurrentPin = await dependencies.verifyPin(
      parsed.data.newPin,
      currentUser.password
    );

    if (isSameAsCurrentPin) {
      throw new Error('New PIN must be different from your current PIN');
    }

    const passwordHash = await dependencies.hashPin(parsed.data.newPin);
    const updatedUser = await dependencies.updatePasswordById(userId, passwordHash);

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  } catch (err) {
    if (err instanceof Error && isKnownUpdateCurrentPinErrorMessage(err.message)) {
      throw err;
    }

    throw new Error('Something went wrong. Please try again later.');
  }
}

export async function updateCurrentProfileMetrics(
  input: { weightKg: unknown; ageYears: unknown },
  dependencies: UpdateCurrentProfileMetricsDependencies = defaultUpdateCurrentProfileMetricsDependencies
): Promise<UpdatedUserProfile> {
  const parsed = updateCurrentProfileMetricsSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error('Invalid profile metrics input');
  }

  try {
    const session = await dependencies.auth();
    const sessionUser = session?.user;
    const userId = Number(sessionUser?.id);

    if (!sessionUser || !Number.isInteger(userId) || userId < 1) {
      throw new Error('You must be signed in to update your profile metrics');
    }

    if (sessionUser.role === GUEST_ROLE) {
      throw new Error('Guest accounts cannot update their profile metrics');
    }

    const currentProfile = await dependencies.findUserProfileById(userId);

    if (!currentProfile) {
      throw new Error('User not found');
    }

    const normalizedMetrics = {
      weightKg: parsed.data.weightKg ?? null,
      ageYears: parsed.data.ageYears ?? null,
    };

    const updatedUser = await dependencies.updateProfileMetricsById(userId, normalizedMetrics);

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  } catch (err) {
    if (err instanceof Error && updateCurrentProfileMetricsErrors.has(err.message)) {
      throw err;
    }

    throw new Error('Something went wrong. Please try again later.');
  }
}

export async function updateCurrentThemeMode(
  input: { themeMode: unknown },
  dependencies: UpdateCurrentThemeModeDependencies = defaultUpdateCurrentThemeModeDependencies
): Promise<UpdatedUserProfile> {
  const parsed = updateCurrentThemeModeSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error('Invalid theme mode input');
  }

  try {
    const session = await dependencies.auth();
    const sessionUser = session?.user;
    const userId = Number(sessionUser?.id);

    if (!sessionUser || !Number.isInteger(userId) || userId < 1) {
      throw new Error('You must be signed in to update your theme mode');
    }

    if (sessionUser.role === GUEST_ROLE) {
      throw new Error('Guest accounts cannot update their theme mode');
    }

    const currentProfile = await dependencies.findUserProfileById(userId);

    if (!currentProfile) {
      throw new Error('User not found');
    }

    const updatedUser = await dependencies.updateThemeModeById(userId, parsed.data.themeMode);

    if (!updatedUser) {
      throw new Error('User not found');
    }

    return updatedUser;
  } catch (err) {
    if (err instanceof Error && updateCurrentThemeModeErrors.has(err.message)) {
      throw err;
    }

    throw new Error('Something went wrong. Please try again later.');
  }
}

export async function deleteCurrentUserAccountFormAction(
  _previousState: DeleteCurrentUserAccountFormState,
  formData: FormData,
  dependencies: DeleteCurrentUserAccountFormActionDependencies = defaultDeleteCurrentUserAccountFormActionDependencies
): Promise<DeleteCurrentUserAccountFormState> {
  const username = formData.get('username');

  if (typeof username !== 'string') {
    return {
      status: 'error',
      message: 'Invalid delete account input',
    };
  }

  try {
    await dependencies.deleteCurrentUserAccount({ username });

    return {
      status: 'success',
      message: 'Your account has been deleted. Redirecting to login...',
    };
  } catch (err) {
    if (err instanceof Error && deleteCurrentUserAccountErrors.has(err.message)) {
      return {
        status: 'error',
        message: err.message,
      };
    }

    return {
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    };
  }
}

export async function updateCurrentUsernameFormAction(
  _previousState: UpdateCurrentUsernameFormState,
  formData: FormData,
  dependencies: UpdateCurrentUsernameFormActionDependencies = defaultUpdateCurrentUsernameFormActionDependencies
): Promise<UpdateCurrentUsernameFormState> {
  const username = formData.get('username');

  if (typeof username !== 'string') {
    return {
      status: 'error',
      message: 'Invalid username input',
    };
  }

  try {
    const updatedUser = await dependencies.updateCurrentUsername({ username });

    return {
      status: 'success',
      message: 'Username updated successfully.',
      updatedUsername: updatedUser.username,
    };
  } catch (err) {
    if (err instanceof Error && updateCurrentUsernameErrors.has(err.message)) {
      return {
        status: 'error',
        message: err.message,
      };
    }

    return {
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    };
  }
}

export async function updateCurrentPinFormAction(
  _previousState: UpdateCurrentPinFormState,
  formData: FormData,
  dependencies: UpdateCurrentPinFormActionDependencies = defaultUpdateCurrentPinFormActionDependencies
): Promise<UpdateCurrentPinFormState> {
  const currentPin = formData.get('currentPin');
  const newPin = formData.get('newPin');
  const confirmPin = formData.get('confirmPin');

  if (
    typeof currentPin !== 'string' ||
    typeof newPin !== 'string' ||
    typeof confirmPin !== 'string'
  ) {
    return {
      status: 'error',
      message: 'Invalid PIN input',
    };
  }

  try {
    await dependencies.updateCurrentPin({
      currentPin,
      newPin,
      confirmPin,
    });

    return {
      status: 'success',
      message: 'PIN updated successfully.',
    };
  } catch (err) {
    if (err instanceof Error && isKnownUpdateCurrentPinErrorMessage(err.message)) {
      return {
        status: 'error',
        message: err.message,
      };
    }

    return {
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    };
  }
}

export async function updateCurrentProfileMetricsFormAction(
  _previousState: UpdateCurrentProfileMetricsFormState,
  formData: FormData,
  dependencies: UpdateCurrentProfileMetricsFormActionDependencies = defaultUpdateCurrentProfileMetricsFormActionDependencies
): Promise<UpdateCurrentProfileMetricsFormState> {
  const weightKg = formData.get('weightKg');
  const ageYears = formData.get('ageYears');

  if (
    (weightKg !== null && typeof weightKg !== 'string') ||
    (ageYears !== null && typeof ageYears !== 'string')
  ) {
    return {
      status: 'error',
      message: 'Invalid profile metrics input',
    };
  }

  try {
    const updatedProfile = await dependencies.updateCurrentProfileMetrics({
      weightKg: typeof weightKg === 'string' ? weightKg : '',
      ageYears: typeof ageYears === 'string' ? ageYears : '',
    });

    return {
      status: 'success',
      message: 'Profile metrics updated successfully.',
      updatedWeightKg: updatedProfile.weightKg,
      updatedAgeYears: updatedProfile.ageYears,
    };
  } catch (err) {
    if (err instanceof Error && updateCurrentProfileMetricsErrors.has(err.message)) {
      return {
        status: 'error',
        message: err.message,
      };
    }

    return {
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    };
  }
}

export async function updateCurrentThemeModeFormAction(
  _previousState: UpdateCurrentThemeModeFormState,
  formData: FormData,
  dependencies: UpdateCurrentThemeModeFormActionDependencies = defaultUpdateCurrentThemeModeFormActionDependencies
): Promise<UpdateCurrentThemeModeFormState> {
  const themeMode = formData.get('themeMode');

  if (typeof themeMode !== 'string') {
    return {
      status: 'error',
      message: 'Invalid theme mode input',
    };
  }

  try {
    const updatedProfile = await dependencies.updateCurrentThemeMode({ themeMode });

    return {
      status: 'success',
      message: 'Theme updated successfully.',
      updatedThemeMode: updatedProfile.themeMode,
    };
  } catch (err) {
    if (err instanceof Error && updateCurrentThemeModeErrors.has(err.message)) {
      return {
        status: 'error',
        message: err.message,
      };
    }

    return {
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    };
  }
}
