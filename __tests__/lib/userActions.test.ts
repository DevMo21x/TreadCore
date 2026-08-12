import { GUEST_ROLE, USER_ROLE } from '@/lib/auth/sessionUser';
import {
  createUser,
  discardCurrentGuestAccount,
  deleteCurrentUserAccount,
  deleteCurrentUserAccountFormAction,
  updateCurrentPin,
  updateCurrentPinFormAction,
  updateCurrentProfileMetrics,
  updateCurrentProfileMetricsFormAction,
  updateCurrentThemeMode,
  updateCurrentThemeModeFormAction,
  updateCurrentUsername,
  updateCurrentUsernameFormAction,
  type DeleteCurrentUserAccountFormState,
  type UpdateCurrentPinFormState,
  type UpdateCurrentProfileMetricsFormState,
  type UpdateCurrentThemeModeFormState,
  type UpdateCurrentUsernameFormState,
} from '@/lib/actions/user';
import { THEME_MODE_DARK, THEME_MODE_LIGHT } from '@/lib/users/themeMode';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const initialDeleteCurrentUserAccountFormState: DeleteCurrentUserAccountFormState = {
  status: 'idle',
  message: '',
};

const initialUpdateCurrentUsernameFormState: UpdateCurrentUsernameFormState = {
  status: 'idle',
  message: '',
};

const initialUpdateCurrentPinFormState: UpdateCurrentPinFormState = {
  status: 'idle',
  message: '',
};

const initialUpdateCurrentProfileMetricsFormState: UpdateCurrentProfileMetricsFormState = {
  status: 'idle',
  message: '',
};

const initialUpdateCurrentThemeModeFormState: UpdateCurrentThemeModeFormState = {
  status: 'idle',
  message: '',
};

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('createUser', () => {
  it('rejects reserved guest usernames', async () => {
    await expect(
      createUser({ username: 'guest-claimed', pin: '1234' }, buildCreateUserDependencies())
    ).rejects.toThrow('Username is reserved');
  });

  it('rejects profane usernames during signup', async () => {
    await expect(
      createUser({ username: 'shittyuser', pin: '1234' }, buildCreateUserDependencies())
    ).rejects.toThrow('Username contains inappropriate language.');
  });

  it('creates a brand-new user for anonymous signup', async () => {
    const hashPin = vi.fn().mockResolvedValue('hashed-pin');
    const createUserAccount = vi.fn().mockResolvedValue({
      id: 2,
      username: 'runner_<->',
      role: USER_ROLE,
    });

    await expect(
      createUser(
        { username: 'runner_<->', pin: '1234' },
        buildCreateUserDependencies({
          auth: vi.fn().mockResolvedValue(null),
          hashPin,
          createUserAccount,
        })
      )
    ).resolves.toEqual({
      id: 2,
      username: 'runner_<->',
      role: USER_ROLE,
    });

    expect(hashPin).toHaveBeenCalledWith('1234');
    expect(createUserAccount).toHaveBeenCalledWith('runner_<->', 'hashed-pin');
  });

  it('promotes the current guest account instead of creating a new row', async () => {
    const promoteGuestUserById = vi.fn().mockResolvedValue({
      id: 1,
      username: 'runnerseven',
      role: USER_ROLE,
    });
    const createUserAccount = vi.fn();

    await expect(
      createUser(
        { username: 'runnerseven', pin: '1234' },
        buildCreateUserDependencies({
          auth: vi.fn().mockResolvedValue({
            user: buildSessionUser({
              username: 'guest-session',
              name: 'Guest',
              role: GUEST_ROLE,
            }),
          }),
          promoteGuestUserById,
          createUserAccount,
        })
      )
    ).resolves.toEqual({
      id: 1,
      username: 'runnerseven',
      role: USER_ROLE,
    });

    expect(promoteGuestUserById).toHaveBeenCalledWith(1, 'runnerseven', 'hashed-pin');
    expect(createUserAccount).not.toHaveBeenCalled();
  });

  it('rejects profane usernames before promoting a guest account', async () => {
    const promoteGuestUserById = vi.fn();

    await expect(
      createUser(
        { username: 'a-sshole', pin: '1234' },
        buildCreateUserDependencies({
          auth: vi.fn().mockResolvedValue({
            user: buildSessionUser({
              username: 'guest-session',
              name: 'Guest',
              role: GUEST_ROLE,
            }),
          }),
          promoteGuestUserById,
        })
      )
    ).rejects.toThrow('Username contains inappropriate language.');

    expect(promoteGuestUserById).not.toHaveBeenCalled();
  });

  it('returns a not-found error when the guest promotion target is missing', async () => {
    await expect(
      createUser(
        { username: 'runnerseven', pin: '1234' },
        buildCreateUserDependencies({
          auth: vi.fn().mockResolvedValue({
            user: buildSessionUser({
              username: 'guest-session',
              name: 'Guest',
              role: GUEST_ROLE,
            }),
          }),
          promoteGuestUserById: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('Guest session not found');
  });

  it('masks unexpected internal signup failures', async () => {
    await expect(
      createUser(
        { username: 'runnerseven', pin: '1234' },
        buildCreateUserDependencies({
          auth: vi.fn().mockResolvedValue(null),
          createUserAccount: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).rejects.toThrow('Something went wrong. Please try again later.');
  });
});

describe('discardCurrentGuestAccount', () => {
  it('requires an authenticated guest session', async () => {
    await expect(
      discardCurrentGuestAccount(
        buildDiscardCurrentGuestAccountDependencies({
          auth: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('You must be signed in to discard your guest session');
  });

  it('rejects non-guest sessions', async () => {
    await expect(
      discardCurrentGuestAccount(
        buildDiscardCurrentGuestAccountDependencies({
          auth: vi.fn().mockResolvedValue({
            user: buildSessionUser(),
          }),
        })
      )
    ).rejects.toThrow('Only guest sessions can be discarded');
  });

  it('deletes the current guest by session user id', async () => {
    const deleteGuestUserById = vi.fn().mockResolvedValue({
      id: 1,
      username: 'guest-session',
      role: GUEST_ROLE,
    });

    await expect(
      discardCurrentGuestAccount(
        buildDiscardCurrentGuestAccountDependencies({
          deleteGuestUserById,
        })
      )
    ).resolves.toEqual({
      id: 1,
      username: 'guest-session',
      role: GUEST_ROLE,
    });

    expect(deleteGuestUserById).toHaveBeenCalledWith(1);
  });

  it('returns a not-found error when the guest row is already gone', async () => {
    await expect(
      discardCurrentGuestAccount(
        buildDiscardCurrentGuestAccountDependencies({
          deleteGuestUserById: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('Guest session not found');
  });
});

describe('deleteCurrentUserAccount', () => {
  it('rejects invalid delete-account payloads', async () => {
    await expect(deleteCurrentUserAccount({ username: '  ' }, buildDependencies())).rejects.toThrow(
      'Invalid delete account input'
    );
  });

  it('requires an authenticated user session', async () => {
    await expect(
      deleteCurrentUserAccount(
        { username: 'alice' },
        buildDependencies({
          auth: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('You must be signed in to delete your account');
  });

  it('rejects guest accounts', async () => {
    await expect(
      deleteCurrentUserAccount(
        { username: 'guest' },
        buildDependencies({
          auth: vi.fn().mockResolvedValue({
            user: buildSessionUser({
              username: 'guest',
              name: 'Guest',
              role: GUEST_ROLE,
            }),
          }),
        })
      )
    ).rejects.toThrow('Guest accounts cannot be deleted');
  });

  it('rejects attempts to delete a different username', async () => {
    await expect(
      deleteCurrentUserAccount({ username: 'bob' }, buildDependencies())
    ).rejects.toThrow('You can only delete your own account');
  });

  it('deletes the authenticated user id when the username matches after trimming', async () => {
    const deleteUserById = vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
    });

    await expect(
      deleteCurrentUserAccount(
        { username: '  alice  ' },
        buildDependencies({
          deleteUserById,
        })
      )
    ).resolves.toEqual({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
    });

    expect(deleteUserById).toHaveBeenCalledWith(1);
  });

  it('returns a not-found error when the account is already missing', async () => {
    await expect(
      deleteCurrentUserAccount(
        { username: 'alice' },
        buildDependencies({
          deleteUserById: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('User not found');
  });

  it('hides unexpected internal failures', async () => {
    await expect(
      deleteCurrentUserAccount(
        { username: 'alice' },
        buildDependencies({
          deleteUserById: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).rejects.toThrow('Something went wrong. Please try again later.');
  });
});

describe('deleteCurrentUserAccountFormAction', () => {
  it('returns an error state when the username field is missing', async () => {
    await expect(
      deleteCurrentUserAccountFormAction(
        initialDeleteCurrentUserAccountFormState,
        new FormData(),
        buildFormActionDependencies()
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Invalid delete account input',
    });
  });

  it('returns a success state when the account is deleted', async () => {
    const formData = new FormData();
    formData.set('username', 'alice');

    await expect(
      deleteCurrentUserAccountFormAction(
        initialDeleteCurrentUserAccountFormState,
        formData,
        buildFormActionDependencies()
      )
    ).resolves.toEqual({
      status: 'success',
      message: 'Your account has been deleted. Redirecting to login...',
    });
  });

  it('returns a known user-facing error message from the delete flow', async () => {
    const formData = new FormData();
    formData.set('username', 'alice');

    await expect(
      deleteCurrentUserAccountFormAction(
        initialDeleteCurrentUserAccountFormState,
        formData,
        buildFormActionDependencies({
          deleteCurrentUserAccount: vi
            .fn()
            .mockRejectedValue(new Error('You can only delete your own account')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'You can only delete your own account',
    });
  });

  it('masks unexpected internal errors with a generic message', async () => {
    const formData = new FormData();
    formData.set('username', 'alice');

    await expect(
      deleteCurrentUserAccountFormAction(
        initialDeleteCurrentUserAccountFormState,
        formData,
        buildFormActionDependencies({
          deleteCurrentUserAccount: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  });
});

describe('updateCurrentUsername', () => {
  it('rejects invalid username payloads', async () => {
    await expect(
      updateCurrentUsername({ username: '  ' }, buildUpdateDependencies())
    ).rejects.toThrow('Invalid username input');
  });

  it('requires an authenticated user session', async () => {
    await expect(
      updateCurrentUsername(
        { username: 'renamed-user' },
        buildUpdateDependencies({
          auth: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('You must be signed in to update your username');
  });

  it('rejects guest accounts', async () => {
    await expect(
      updateCurrentUsername(
        { username: 'renamed-user' },
        buildUpdateDependencies({
          auth: vi.fn().mockResolvedValue({
            user: buildSessionUser({
              username: 'guest',
              name: 'Guest',
              role: GUEST_ROLE,
            }),
          }),
        })
      )
    ).rejects.toThrow('Guest accounts cannot update their username');
  });

  it('rejects unchanged usernames after trimming', async () => {
    await expect(
      updateCurrentUsername({ username: '  alice  ' }, buildUpdateDependencies())
    ).rejects.toThrow('New username must be different from your current username');
  });

  it('rejects profane usernames before the rename lookup path', async () => {
    const findUserByUsername = vi.fn();

    await expect(
      updateCurrentUsername(
        { username: 'shittyuser' },
        buildUpdateDependencies({
          findUserByUsername,
        })
      )
    ).rejects.toThrow('Username contains inappropriate language.');

    expect(findUserByUsername).not.toHaveBeenCalled();
  });

  it('rejects usernames that are already in use by another account', async () => {
    await expect(
      updateCurrentUsername(
        { username: 'bob' },
        buildUpdateDependencies({
          findUserByUsername: vi.fn().mockResolvedValue({
            id: 99,
            username: 'bob',
            password: 'stored-hash',
            role: USER_ROLE,
          }),
        })
      )
    ).rejects.toThrow('Username already exists');
  });

  it('returns the updated user when the rename succeeds', async () => {
    const updateUsernameById = vi.fn().mockResolvedValue({
      id: 1,
      username: 'renamed_<->',
      role: USER_ROLE,
    });

    await expect(
      updateCurrentUsername(
        { username: '  renamed_<->  ' },
        buildUpdateDependencies({
          updateUsernameById,
        })
      )
    ).resolves.toEqual({
      id: 1,
      username: 'renamed_<->',
      role: USER_ROLE,
    });

    expect(updateUsernameById).toHaveBeenCalledWith(1, 'renamed_<->');
  });

  it('maps a database unique constraint error to a username exists error', async () => {
    await expect(
      updateCurrentUsername(
        { username: 'renamed-user' },
        buildUpdateDependencies({
          updateUsernameById: vi.fn().mockRejectedValue(
            Object.assign(new Error('UNIQUE constraint failed: users.username'), {
              code: 'SQLITE_CONSTRAINT_UNIQUE',
            })
          ),
        })
      )
    ).rejects.toThrow('Username already exists');
  });

  it('returns a not-found error when the account cannot be updated', async () => {
    await expect(
      updateCurrentUsername(
        { username: 'renamed-user' },
        buildUpdateDependencies({
          updateUsernameById: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('User not found');
  });

  it('hides unexpected internal failures', async () => {
    await expect(
      updateCurrentUsername(
        { username: 'renamed-user' },
        buildUpdateDependencies({
          updateUsernameById: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).rejects.toThrow('Something went wrong. Please try again later.');
  });
});

describe('updateCurrentUsernameFormAction', () => {
  it('returns an error state when the username field is missing', async () => {
    await expect(
      updateCurrentUsernameFormAction(
        initialUpdateCurrentUsernameFormState,
        new FormData(),
        buildUpdateFormActionDependencies()
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Invalid username input',
    });
  });

  it('returns a success state when the username is updated', async () => {
    const formData = new FormData();
    formData.set('username', 'renamed-user');

    await expect(
      updateCurrentUsernameFormAction(
        initialUpdateCurrentUsernameFormState,
        formData,
        buildUpdateFormActionDependencies()
      )
    ).resolves.toEqual({
      status: 'success',
      message: 'Username updated successfully.',
      updatedUsername: 'renamed-user',
    });
  });

  it('returns a known user-facing error from the rename flow', async () => {
    const formData = new FormData();
    formData.set('username', 'renamed-user');

    await expect(
      updateCurrentUsernameFormAction(
        initialUpdateCurrentUsernameFormState,
        formData,
        buildUpdateFormActionDependencies({
          updateCurrentUsername: vi.fn().mockRejectedValue(new Error('Username already exists')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Username already exists',
    });
  });

  it('returns a profanity error from the rename flow', async () => {
    const formData = new FormData();
    formData.set('username', 'sh1ttyuser');

    await expect(
      updateCurrentUsernameFormAction(
        initialUpdateCurrentUsernameFormState,
        formData,
        buildUpdateFormActionDependencies({
          updateCurrentUsername: vi
            .fn()
            .mockRejectedValue(new Error('Username contains inappropriate language.')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Username contains inappropriate language.',
    });
  });

  it('masks unexpected internal errors with a generic message', async () => {
    const formData = new FormData();
    formData.set('username', 'renamed-user');

    await expect(
      updateCurrentUsernameFormAction(
        initialUpdateCurrentUsernameFormState,
        formData,
        buildUpdateFormActionDependencies({
          updateCurrentUsername: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  });
});

describe('updateCurrentPin', () => {
  it('rejects invalid PIN payloads', async () => {
    await expect(
      updateCurrentPin(
        {
          currentPin: '12',
          newPin: '5678',
          confirmPin: '5678',
        },
        buildPinUpdateDependencies()
      )
    ).rejects.toThrow('Invalid PIN input');
  });

  it('requires an authenticated user session', async () => {
    await expect(
      updateCurrentPin(
        {
          currentPin: '1234',
          newPin: '5678',
          confirmPin: '5678',
        },
        buildPinUpdateDependencies({
          auth: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('You must be signed in to update your PIN');
  });

  it('rejects guest accounts', async () => {
    await expect(
      updateCurrentPin(
        {
          currentPin: '1234',
          newPin: '5678',
          confirmPin: '5678',
        },
        buildPinUpdateDependencies({
          auth: vi.fn().mockResolvedValue({
            user: buildSessionUser({
              username: 'guest',
              name: 'Guest',
              role: GUEST_ROLE,
            }),
          }),
        })
      )
    ).rejects.toThrow('Guest accounts cannot update their PIN');
  });

  it('returns a locked error when the PIN change flow is throttled', async () => {
    await expect(
      updateCurrentPin(
        {
          currentPin: '1234',
          newPin: '5678',
          confirmPin: '5678',
        },
        buildPinUpdateDependencies({
          getPinChangeThrottleStatus: vi.fn().mockReturnValue({
            locked: true,
            retryAfterSeconds: 30,
            remainingAttempts: 0,
          }),
        })
      )
    ).rejects.toThrow('Too many incorrect current PIN attempts. Try again in 30 seconds.');
  });

  it('records a failed attempt when the current PIN is incorrect', async () => {
    const recordFailedPinChangeAttempt = vi.fn().mockReturnValue({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 4,
    });

    await expect(
      updateCurrentPin(
        {
          currentPin: '9999',
          newPin: '5678',
          confirmPin: '5678',
        },
        buildPinUpdateDependencies({
          recordFailedPinChangeAttempt,
          verifyPin: vi.fn().mockResolvedValue(false),
        })
      )
    ).rejects.toThrow('Current PIN is incorrect');

    expect(recordFailedPinChangeAttempt).toHaveBeenCalledWith('user:1');
  });

  it('surfaces a lockout message when the failed attempt triggers throttling', async () => {
    await expect(
      updateCurrentPin(
        {
          currentPin: '9999',
          newPin: '5678',
          confirmPin: '5678',
        },
        buildPinUpdateDependencies({
          recordFailedPinChangeAttempt: vi.fn().mockReturnValue({
            locked: true,
            retryAfterSeconds: 30,
            remainingAttempts: 0,
          }),
          verifyPin: vi.fn().mockResolvedValue(false),
        })
      )
    ).rejects.toThrow('Too many incorrect current PIN attempts. Try again in 30 seconds.');
  });

  it('rejects a mismatched new PIN confirmation', async () => {
    const clearPinChangeThrottle = vi.fn();

    await expect(
      updateCurrentPin(
        {
          currentPin: '1234',
          newPin: '5678',
          confirmPin: '5670',
        },
        buildPinUpdateDependencies({
          clearPinChangeThrottle,
        })
      )
    ).rejects.toThrow('New PIN confirmation does not match');

    expect(clearPinChangeThrottle).toHaveBeenCalledWith('user:1');
  });

  it('rejects reusing the current PIN', async () => {
    await expect(
      updateCurrentPin(
        {
          currentPin: '1234',
          newPin: '1234',
          confirmPin: '1234',
        },
        buildPinUpdateDependencies()
      )
    ).rejects.toThrow('New PIN must be different from your current PIN');
  });

  it('returns the updated user when the PIN change succeeds', async () => {
    const clearPinChangeThrottle = vi.fn();
    const hashPin = vi.fn().mockResolvedValue('hashed-next-pin');
    const updatePasswordById = vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
    });

    await expect(
      updateCurrentPin(
        {
          currentPin: '1234',
          newPin: '5678',
          confirmPin: '5678',
        },
        buildPinUpdateDependencies({
          clearPinChangeThrottle,
          hashPin,
          updatePasswordById,
        })
      )
    ).resolves.toEqual({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
    });

    expect(clearPinChangeThrottle).toHaveBeenCalledWith('user:1');
    expect(hashPin).toHaveBeenCalledWith('5678');
    expect(updatePasswordById).toHaveBeenCalledWith(1, 'hashed-next-pin');
  });

  it('returns a not-found error when the credential record is missing', async () => {
    await expect(
      updateCurrentPin(
        {
          currentPin: '1234',
          newPin: '5678',
          confirmPin: '5678',
        },
        buildPinUpdateDependencies({
          findUserCredentialsById: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('User not found');
  });

  it('hides unexpected internal failures', async () => {
    await expect(
      updateCurrentPin(
        {
          currentPin: '1234',
          newPin: '5678',
          confirmPin: '5678',
        },
        buildPinUpdateDependencies({
          updatePasswordById: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).rejects.toThrow('Something went wrong. Please try again later.');
  });
});

describe('updateCurrentPinFormAction', () => {
  it('returns an error state when a PIN field is missing', async () => {
    const formData = new FormData();
    formData.set('currentPin', '1234');
    formData.set('newPin', '5678');

    await expect(
      updateCurrentPinFormAction(
        initialUpdateCurrentPinFormState,
        formData,
        buildPinUpdateFormActionDependencies()
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Invalid PIN input',
    });
  });

  it('returns a success state when the PIN is updated', async () => {
    const formData = new FormData();
    formData.set('currentPin', '1234');
    formData.set('newPin', '5678');
    formData.set('confirmPin', '5678');

    await expect(
      updateCurrentPinFormAction(
        initialUpdateCurrentPinFormState,
        formData,
        buildPinUpdateFormActionDependencies()
      )
    ).resolves.toEqual({
      status: 'success',
      message: 'PIN updated successfully.',
    });
  });

  it('returns a known user-facing error from the PIN flow', async () => {
    const formData = new FormData();
    formData.set('currentPin', '1234');
    formData.set('newPin', '5678');
    formData.set('confirmPin', '5678');

    await expect(
      updateCurrentPinFormAction(
        initialUpdateCurrentPinFormState,
        formData,
        buildPinUpdateFormActionDependencies({
          updateCurrentPin: vi.fn().mockRejectedValue(new Error('Current PIN is incorrect')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Current PIN is incorrect',
    });
  });

  it('masks unexpected internal errors with a generic message', async () => {
    const formData = new FormData();
    formData.set('currentPin', '1234');
    formData.set('newPin', '5678');
    formData.set('confirmPin', '5678');

    await expect(
      updateCurrentPinFormAction(
        initialUpdateCurrentPinFormState,
        formData,
        buildPinUpdateFormActionDependencies({
          updateCurrentPin: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  });
});

describe('updateCurrentProfileMetrics', () => {
  it('rejects invalid profile metric payloads', async () => {
    await expect(
      updateCurrentProfileMetrics(
        {
          weightKg: '10',
          ageYears: '30',
        },
        buildProfileMetricsDependencies()
      )
    ).rejects.toThrow('Invalid profile metrics input');
  });

  it('requires an authenticated user session', async () => {
    await expect(
      updateCurrentProfileMetrics(
        {
          weightKg: '72.5',
          ageYears: '34',
        },
        buildProfileMetricsDependencies({
          auth: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('You must be signed in to update your profile metrics');
  });

  it('rejects guest accounts', async () => {
    await expect(
      updateCurrentProfileMetrics(
        {
          weightKg: '72.5',
          ageYears: '34',
        },
        buildProfileMetricsDependencies({
          auth: vi.fn().mockResolvedValue({
            user: buildSessionUser({
              username: 'guest',
              name: 'Guest',
              role: GUEST_ROLE,
            }),
          }),
        })
      )
    ).rejects.toThrow('Guest accounts cannot update their profile metrics');
  });

  it('allows clearing both optional fields back to null', async () => {
    const updateProfileMetricsById = vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: null,
      ageYears: null,
      themeMode: THEME_MODE_DARK,
    });

    await expect(
      updateCurrentProfileMetrics(
        {
          weightKg: '',
          ageYears: '',
        },
        buildProfileMetricsDependencies({
          updateProfileMetricsById,
        })
      )
    ).resolves.toEqual({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: null,
      ageYears: null,
      themeMode: THEME_MODE_DARK,
    });

    expect(updateProfileMetricsById).toHaveBeenCalledWith(1, {
      weightKg: null,
      ageYears: null,
    });
  });

  it('returns the updated profile metrics when the save succeeds', async () => {
    const updateProfileMetricsById = vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_DARK,
    });

    await expect(
      updateCurrentProfileMetrics(
        {
          weightKg: '72.5',
          ageYears: '34',
        },
        buildProfileMetricsDependencies({
          updateProfileMetricsById,
        })
      )
    ).resolves.toEqual({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_DARK,
    });

    expect(updateProfileMetricsById).toHaveBeenCalledWith(1, {
      weightKg: 72.5,
      ageYears: 34,
    });
  });

  it('returns a not-found error when the current profile is missing', async () => {
    await expect(
      updateCurrentProfileMetrics(
        {
          weightKg: '72.5',
          ageYears: '34',
        },
        buildProfileMetricsDependencies({
          findUserProfileById: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('User not found');
  });

  it('hides unexpected internal failures', async () => {
    await expect(
      updateCurrentProfileMetrics(
        {
          weightKg: '72.5',
          ageYears: '34',
        },
        buildProfileMetricsDependencies({
          updateProfileMetricsById: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).rejects.toThrow('Something went wrong. Please try again later.');
  });
});

describe('updateCurrentProfileMetricsFormAction', () => {
  it('returns a success state when the profile metrics are updated', async () => {
    const formData = new FormData();
    formData.set('weightKg', '72.5');
    formData.set('ageYears', '34');

    await expect(
      updateCurrentProfileMetricsFormAction(
        initialUpdateCurrentProfileMetricsFormState,
        formData,
        buildProfileMetricsFormActionDependencies()
      )
    ).resolves.toEqual({
      status: 'success',
      message: 'Profile metrics updated successfully.',
      updatedWeightKg: 72.5,
      updatedAgeYears: 34,
    });
  });

  it('allows empty fields and returns cleared values', async () => {
    await expect(
      updateCurrentProfileMetricsFormAction(
        initialUpdateCurrentProfileMetricsFormState,
        new FormData(),
        buildProfileMetricsFormActionDependencies({
          updateCurrentProfileMetrics: vi.fn().mockResolvedValue({
            id: 1,
            username: 'alice',
            role: USER_ROLE,
            weightKg: null,
            ageYears: null,
            themeMode: THEME_MODE_DARK,
          }),
        })
      )
    ).resolves.toEqual({
      status: 'success',
      message: 'Profile metrics updated successfully.',
      updatedWeightKg: null,
      updatedAgeYears: null,
    });
  });

  it('returns a known user-facing error from the profile metrics flow', async () => {
    const formData = new FormData();
    formData.set('weightKg', '72.5');
    formData.set('ageYears', '34');

    await expect(
      updateCurrentProfileMetricsFormAction(
        initialUpdateCurrentProfileMetricsFormState,
        formData,
        buildProfileMetricsFormActionDependencies({
          updateCurrentProfileMetrics: vi.fn().mockRejectedValue(new Error('User not found')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'User not found',
    });
  });

  it('masks unexpected internal errors with a generic message', async () => {
    const formData = new FormData();
    formData.set('weightKg', '72.5');
    formData.set('ageYears', '34');

    await expect(
      updateCurrentProfileMetricsFormAction(
        initialUpdateCurrentProfileMetricsFormState,
        formData,
        buildProfileMetricsFormActionDependencies({
          updateCurrentProfileMetrics: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  });
});

describe('updateCurrentThemeMode', () => {
  it('rejects invalid theme payloads', async () => {
    await expect(
      updateCurrentThemeMode(
        {
          themeMode: 'violet',
        },
        buildThemeModeDependencies()
      )
    ).rejects.toThrow('Invalid theme mode input');
  });

  it('requires an authenticated user session', async () => {
    await expect(
      updateCurrentThemeMode(
        {
          themeMode: THEME_MODE_LIGHT,
        },
        buildThemeModeDependencies({
          auth: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('You must be signed in to update your theme mode');
  });

  it('rejects guest accounts', async () => {
    await expect(
      updateCurrentThemeMode(
        {
          themeMode: THEME_MODE_LIGHT,
        },
        buildThemeModeDependencies({
          auth: vi.fn().mockResolvedValue({
            user: buildSessionUser({
              username: 'guest',
              name: 'Guest',
              role: GUEST_ROLE,
            }),
          }),
        })
      )
    ).rejects.toThrow('Guest accounts cannot update their theme mode');
  });

  it('returns the updated profile when the save succeeds', async () => {
    const updateThemeModeById = vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_LIGHT,
    });

    await expect(
      updateCurrentThemeMode(
        {
          themeMode: THEME_MODE_LIGHT,
        },
        buildThemeModeDependencies({
          updateThemeModeById,
        })
      )
    ).resolves.toEqual({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_LIGHT,
    });

    expect(updateThemeModeById).toHaveBeenCalledWith(1, THEME_MODE_LIGHT);
  });

  it('returns a not-found error when the current profile is missing', async () => {
    await expect(
      updateCurrentThemeMode(
        {
          themeMode: THEME_MODE_LIGHT,
        },
        buildThemeModeDependencies({
          findUserProfileById: vi.fn().mockResolvedValue(null),
        })
      )
    ).rejects.toThrow('User not found');
  });

  it('hides unexpected internal failures', async () => {
    await expect(
      updateCurrentThemeMode(
        {
          themeMode: THEME_MODE_LIGHT,
        },
        buildThemeModeDependencies({
          updateThemeModeById: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).rejects.toThrow('Something went wrong. Please try again later.');
  });
});

describe('updateCurrentThemeModeFormAction', () => {
  it('returns a success state when the theme mode is updated', async () => {
    const formData = new FormData();
    formData.set('themeMode', THEME_MODE_LIGHT);

    await expect(
      updateCurrentThemeModeFormAction(
        initialUpdateCurrentThemeModeFormState,
        formData,
        buildThemeModeFormActionDependencies()
      )
    ).resolves.toEqual({
      status: 'success',
      message: 'Theme updated successfully.',
      updatedThemeMode: THEME_MODE_LIGHT,
    });
  });

  it('returns a known user-facing error from the theme flow', async () => {
    const formData = new FormData();
    formData.set('themeMode', THEME_MODE_LIGHT);

    await expect(
      updateCurrentThemeModeFormAction(
        initialUpdateCurrentThemeModeFormState,
        formData,
        buildThemeModeFormActionDependencies({
          updateCurrentThemeMode: vi
            .fn()
            .mockRejectedValue(new Error('Guest accounts cannot update their theme mode')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Guest accounts cannot update their theme mode',
    });
  });

  it('masks unexpected internal errors with a generic message', async () => {
    const formData = new FormData();
    formData.set('themeMode', THEME_MODE_LIGHT);

    await expect(
      updateCurrentThemeModeFormAction(
        initialUpdateCurrentThemeModeFormState,
        formData,
        buildThemeModeFormActionDependencies({
          updateCurrentThemeMode: vi.fn().mockRejectedValue(new Error('database offline')),
        })
      )
    ).resolves.toEqual({
      status: 'error',
      message: 'Something went wrong. Please try again later.',
    });
  });
});

type DeleteCurrentUserAccountDependencies = NonNullable<
  Parameters<typeof deleteCurrentUserAccount>[1]
>;

type CreateUserDependencies = NonNullable<Parameters<typeof createUser>[1]>;

type DiscardCurrentGuestAccountDependencies = NonNullable<
  Parameters<typeof discardCurrentGuestAccount>[0]
>;

type DeleteCurrentUserAccountFormActionDependencies = NonNullable<
  Parameters<typeof deleteCurrentUserAccountFormAction>[2]
>;

type UpdateCurrentUsernameDependencies = NonNullable<Parameters<typeof updateCurrentUsername>[1]>;

type UpdateCurrentUsernameFormActionDependencies = NonNullable<
  Parameters<typeof updateCurrentUsernameFormAction>[2]
>;

type UpdateCurrentPinDependencies = NonNullable<Parameters<typeof updateCurrentPin>[1]>;

type UpdateCurrentPinFormActionDependencies = NonNullable<
  Parameters<typeof updateCurrentPinFormAction>[2]
>;

type UpdateCurrentProfileMetricsDependencies = NonNullable<
  Parameters<typeof updateCurrentProfileMetrics>[1]
>;

type UpdateCurrentProfileMetricsFormActionDependencies = NonNullable<
  Parameters<typeof updateCurrentProfileMetricsFormAction>[2]
>;

type UpdateCurrentThemeModeDependencies = NonNullable<Parameters<typeof updateCurrentThemeMode>[1]>;

type UpdateCurrentThemeModeFormActionDependencies = NonNullable<
  Parameters<typeof updateCurrentThemeModeFormAction>[2]
>;

function buildDependencies(
  overrides: Partial<DeleteCurrentUserAccountDependencies> = {}
): DeleteCurrentUserAccountDependencies {
  return {
    auth: vi.fn().mockResolvedValue({
      user: buildSessionUser(),
    }),
    deleteUserById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
    }),
    findUserProfileById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      themeMode: THEME_MODE_DARK,
      createdAt: null,
    }),
    ...overrides,
  };
}

function buildCreateUserDependencies(
  overrides: Partial<CreateUserDependencies> = {}
): CreateUserDependencies {
  return {
    auth: vi.fn().mockResolvedValue(null),
    createUserAccount: vi.fn().mockResolvedValue({
      id: 2,
      username: 'runnerseven',
      role: USER_ROLE,
    }),
    findUserByUsername: vi.fn().mockResolvedValue(null),
    hashPin: vi.fn().mockResolvedValue('hashed-pin'),
    promoteGuestUserById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'runnerseven',
      role: USER_ROLE,
    }),
    ...overrides,
  };
}

function buildDiscardCurrentGuestAccountDependencies(
  overrides: Partial<DiscardCurrentGuestAccountDependencies> = {}
): DiscardCurrentGuestAccountDependencies {
  return {
    auth: vi.fn().mockResolvedValue({
      user: buildSessionUser({
        username: 'guest-session',
        name: 'Guest',
        role: GUEST_ROLE,
      }),
    }),
    deleteGuestUserById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'guest-session',
      role: GUEST_ROLE,
    }),
    ...overrides,
  };
}

function buildFormActionDependencies(
  overrides: Partial<DeleteCurrentUserAccountFormActionDependencies> = {}
): DeleteCurrentUserAccountFormActionDependencies {
  return {
    deleteCurrentUserAccount: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
    }),
    ...overrides,
  };
}

function buildUpdateDependencies(
  overrides: Partial<UpdateCurrentUsernameDependencies> = {}
): UpdateCurrentUsernameDependencies {
  return {
    auth: vi.fn().mockResolvedValue({
      user: buildSessionUser(),
    }),
    findUserByUsername: vi.fn().mockResolvedValue(null),
    findUserProfileById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      themeMode: THEME_MODE_DARK,
      createdAt: null,
    }),
    updateUsernameById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'renamed-user',
      role: USER_ROLE,
    }),
    ...overrides,
  };
}

function buildUpdateFormActionDependencies(
  overrides: Partial<UpdateCurrentUsernameFormActionDependencies> = {}
): UpdateCurrentUsernameFormActionDependencies {
  return {
    updateCurrentUsername: vi.fn().mockResolvedValue({
      id: 1,
      username: 'renamed-user',
      role: USER_ROLE,
    }),
    ...overrides,
  };
}

function buildPinUpdateDependencies(
  overrides: Partial<UpdateCurrentPinDependencies> = {}
): UpdateCurrentPinDependencies {
  return {
    auth: vi.fn().mockResolvedValue({
      user: buildSessionUser(),
    }),
    clearPinChangeThrottle: vi.fn(),
    findUserCredentialsById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      password: 'stored-hash',
      role: USER_ROLE,
    }),
    getPinChangeThrottleStatus: vi.fn().mockReturnValue({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 5,
    }),
    hashPin: vi.fn().mockResolvedValue('hashed-pin'),
    recordFailedPinChangeAttempt: vi.fn().mockReturnValue({
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: 4,
    }),
    updatePasswordById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
    }),
    verifyPin: vi.fn().mockImplementation(async (pin: string) => pin === '1234'),
    ...overrides,
  };
}

function buildPinUpdateFormActionDependencies(
  overrides: Partial<UpdateCurrentPinFormActionDependencies> = {}
): UpdateCurrentPinFormActionDependencies {
  return {
    updateCurrentPin: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
    }),
    ...overrides,
  };
}

function buildProfileMetricsDependencies(
  overrides: Partial<UpdateCurrentProfileMetricsDependencies> = {}
): UpdateCurrentProfileMetricsDependencies {
  return {
    auth: vi.fn().mockResolvedValue({
      user: buildSessionUser(),
    }),
    findUserProfileById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: null,
      ageYears: null,
      themeMode: THEME_MODE_DARK,
      createdAt: null,
    }),
    updateProfileMetricsById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_DARK,
    }),
    ...overrides,
  };
}

function buildProfileMetricsFormActionDependencies(
  overrides: Partial<UpdateCurrentProfileMetricsFormActionDependencies> = {}
): UpdateCurrentProfileMetricsFormActionDependencies {
  return {
    updateCurrentProfileMetrics: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_DARK,
    }),
    ...overrides,
  };
}

function buildThemeModeDependencies(
  overrides: Partial<UpdateCurrentThemeModeDependencies> = {}
): UpdateCurrentThemeModeDependencies {
  return {
    auth: vi.fn().mockResolvedValue({
      user: buildSessionUser(),
    }),
    findUserProfileById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_DARK,
      createdAt: null,
    }),
    updateThemeModeById: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_LIGHT,
    }),
    ...overrides,
  };
}

function buildThemeModeFormActionDependencies(
  overrides: Partial<UpdateCurrentThemeModeFormActionDependencies> = {}
): UpdateCurrentThemeModeFormActionDependencies {
  return {
    updateCurrentThemeMode: vi.fn().mockResolvedValue({
      id: 1,
      username: 'alice',
      role: USER_ROLE,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: THEME_MODE_LIGHT,
    }),
    ...overrides,
  };
}

function buildSessionUser(
  overrides: Partial<{
    id: string;
    name: string;
    role: typeof USER_ROLE | typeof GUEST_ROLE;
    username: string;
  }> = {}
) {
  return {
    id: '1',
    username: 'alice',
    name: 'alice',
    role: USER_ROLE,
    ...overrides,
  };
}
