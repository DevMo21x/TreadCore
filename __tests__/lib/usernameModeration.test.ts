import {
  USERNAME_INAPPROPRIATE_LANGUAGE_MESSAGE,
  normalizeUsernameForModeration,
  validateUsername,
} from '@/lib/users/usernameModeration';
import { describe, expect, it } from 'vitest';

describe('usernameModeration', () => {
  it('normalizes common leetspeak substitutions before checking profanity', () => {
    expect(normalizeUsernameForModeration(' @sshole99 ')).toBe('asshole99');
  });

  it('rejects usernames that are directly profane', () => {
    expect(validateUsername('asshole')).toEqual({
      valid: false,
      error: USERNAME_INAPPROPRIATE_LANGUAGE_MESSAGE,
    });
  });

  it('rejects leetspeak usernames that hide profanity inside a larger token', () => {
    expect(validateUsername('sh1ttyuser')).toEqual({
      valid: false,
      error: USERNAME_INAPPROPRIATE_LANGUAGE_MESSAGE,
    });
    expect(validateUsername('@sshole99')).toEqual({
      valid: false,
      error: USERNAME_INAPPROPRIATE_LANGUAGE_MESSAGE,
    });
  });

  it('allows clean usernames that would otherwise match short profane substrings incidentally', () => {
    expect(validateUsername('passionateRunner')).toEqual({ valid: true });
  });
});
