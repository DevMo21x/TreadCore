import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  deleteUserById,
  findUserCredentialsById,
  findUserProfileById,
  updatePasswordById,
  updateProfileMetricsById,
  updateThemeModeById,
  updateUsernameById,
} from '@/lib/users/userService';

const { mockDelete, mockSelect, mockUpdate } = vi.hoisted(() => ({
  mockDelete: vi.fn(),
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
}));

vi.mock('server-only', () => ({}));

vi.mock('@/db/index', () => ({
  default: {
    delete: mockDelete,
    select: mockSelect,
    update: mockUpdate,
  },
}));

function makeChain(methods: string[], rows: unknown[]) {
  const chain: Record<string, unknown> = {};
  const end = Promise.resolve(rows);

  methods.forEach((method) => {
    chain[method] = vi.fn(() => chain);
  });

  Object.assign(chain, {
    then: (resolve: (value: unknown) => unknown) => end.then(resolve),
    catch: (reject: (error: unknown) => unknown) => end.catch(reject),
    finally: (callback: () => void) => end.finally(callback),
  });

  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findUserProfileById', () => {
  it('returns null when the user does not exist', async () => {
    mockSelect.mockReturnValue(makeChain(['from', 'where', 'limit'], []));

    await expect(findUserProfileById(999)).resolves.toBeNull();
  });

  it('returns the selected profile fields for an existing user', async () => {
    const createdAt = new Date('2026-01-15T10:30:00.000Z');
    const profileRow = {
      id: 7,
      username: 'runner7',
      role: 'user' as const,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: 'light' as const,
      createdAt,
    };

    mockSelect.mockReturnValue(makeChain(['from', 'where', 'limit'], [profileRow]));

    await expect(findUserProfileById(7)).resolves.toEqual(profileRow);
  });
});

describe('findUserCredentialsById', () => {
  it('returns null for an invalid user id without hitting the database', async () => {
    await expect(findUserCredentialsById(0)).resolves.toBeNull();

    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('returns null when the credential record does not exist', async () => {
    mockSelect.mockReturnValue(makeChain(['from', 'where', 'limit'], []));

    await expect(findUserCredentialsById(999)).resolves.toBeNull();
  });

  it('returns the selected credential fields for an existing user', async () => {
    const credentialRow = {
      id: 7,
      username: 'runner7',
      password: 'stored-hash',
      role: 'user' as const,
    };

    mockSelect.mockReturnValue(makeChain(['from', 'where', 'limit'], [credentialRow]));

    await expect(findUserCredentialsById(7)).resolves.toEqual(credentialRow);
  });
});

describe('deleteUserById', () => {
  it('returns null for an invalid user id without hitting the database', async () => {
    await expect(deleteUserById(0)).resolves.toBeNull();

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('returns null when no deletable user matches the id', async () => {
    mockDelete.mockReturnValue(makeChain(['where', 'returning'], []));

    await expect(deleteUserById(999)).resolves.toBeNull();
  });

  it('returns the deleted user when the row is removed', async () => {
    const deletedUser = {
      id: 7,
      username: 'runner7',
      role: 'user' as const,
    };

    mockDelete.mockReturnValue(makeChain(['where', 'returning'], [deletedUser]));

    await expect(deleteUserById(7)).resolves.toEqual(deletedUser);
  });
});

describe('updateUsernameById', () => {
  it('returns null for an invalid user id without hitting the database', async () => {
    await expect(updateUsernameById(0, 'alice')).resolves.toBeNull();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns null for an empty username without hitting the database', async () => {
    await expect(updateUsernameById(7, '   ')).resolves.toBeNull();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns null when no deletable user matches the id', async () => {
    mockUpdate.mockReturnValue(makeChain(['set', 'where', 'returning'], []));

    await expect(updateUsernameById(7, 'updated-name')).resolves.toBeNull();
  });

  it('returns the updated user when the row is renamed', async () => {
    const updatedUser = {
      id: 7,
      username: 'updated-name',
      role: 'user' as const,
    };

    mockUpdate.mockReturnValue(makeChain(['set', 'where', 'returning'], [updatedUser]));

    await expect(updateUsernameById(7, '  updated-name  ')).resolves.toEqual(updatedUser);
  });
});

describe('updateProfileMetricsById', () => {
  it('returns null for an invalid user id without hitting the database', async () => {
    await expect(updateProfileMetricsById(0, { weightKg: 72.5, ageYears: 34 })).resolves.toBeNull();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns null for an invalid weight without hitting the database', async () => {
    await expect(updateProfileMetricsById(7, { weightKg: 0, ageYears: 34 })).resolves.toBeNull();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns null for an invalid age without hitting the database', async () => {
    await expect(
      updateProfileMetricsById(7, { weightKg: 72.5, ageYears: 34.5 })
    ).resolves.toBeNull();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns null when no updatable user matches the id', async () => {
    mockUpdate.mockReturnValue(makeChain(['set', 'where', 'returning'], []));

    await expect(updateProfileMetricsById(7, { weightKg: 72.5, ageYears: 34 })).resolves.toBeNull();
  });

  it('returns the updated user metrics when the row is updated', async () => {
    const updatedUser = {
      id: 7,
      username: 'runner7',
      role: 'user' as const,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: 'dark' as const,
    };

    mockUpdate.mockReturnValue(makeChain(['set', 'where', 'returning'], [updatedUser]));

    await expect(updateProfileMetricsById(7, { weightKg: 72.5, ageYears: 34 })).resolves.toEqual(
      updatedUser
    );
  });

  it('allows clearing both optional fields back to null', async () => {
    const updatedUser = {
      id: 7,
      username: 'runner7',
      role: 'user' as const,
      weightKg: null,
      ageYears: null,
      themeMode: 'dark' as const,
    };

    mockUpdate.mockReturnValue(makeChain(['set', 'where', 'returning'], [updatedUser]));

    await expect(updateProfileMetricsById(7, { weightKg: null, ageYears: null })).resolves.toEqual(
      updatedUser
    );
  });
});

describe('updateThemeModeById', () => {
  it('returns null for an invalid user id without hitting the database', async () => {
    await expect(updateThemeModeById(0, 'light')).resolves.toBeNull();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns null when no updatable user matches the id', async () => {
    mockUpdate.mockReturnValue(makeChain(['set', 'where', 'returning'], []));

    await expect(updateThemeModeById(7, 'light')).resolves.toBeNull();
  });

  it('returns the updated profile when the theme mode is saved', async () => {
    const updatedUser = {
      id: 7,
      username: 'runner7',
      role: 'user' as const,
      weightKg: 72.5,
      ageYears: 34,
      themeMode: 'light' as const,
    };

    mockUpdate.mockReturnValue(makeChain(['set', 'where', 'returning'], [updatedUser]));

    await expect(updateThemeModeById(7, 'light')).resolves.toEqual(updatedUser);
  });
});

describe('updatePasswordById', () => {
  it('returns null for an invalid user id without hitting the database', async () => {
    await expect(updatePasswordById(0, 'hashed-pin')).resolves.toBeNull();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns null for an empty hash without hitting the database', async () => {
    await expect(updatePasswordById(7, '   ')).resolves.toBeNull();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns null when no updatable user matches the id', async () => {
    mockUpdate.mockReturnValue(makeChain(['set', 'where', 'returning'], []));

    await expect(updatePasswordById(7, 'hashed-pin')).resolves.toBeNull();
  });

  it('returns the updated user when the password hash is saved', async () => {
    const updatedUser = {
      id: 7,
      username: 'runner7',
      role: 'user' as const,
    };

    mockUpdate.mockReturnValue(makeChain(['set', 'where', 'returning'], [updatedUser]));

    await expect(updatePasswordById(7, '  hashed-pin  ')).resolves.toEqual(updatedUser);
  });
});
