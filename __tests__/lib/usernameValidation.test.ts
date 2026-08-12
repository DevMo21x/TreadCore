import { isUsernameCharacter, usernameSchema } from '@/lib/users/usernameValidation';
import { describe, expect, it } from 'vitest';

describe('usernameValidation', () => {
  it('accepts underscore, hyphen, and angle brackets characters', () => {
    expect(isUsernameCharacter('_')).toBe(true);
    expect(isUsernameCharacter('-')).toBe(true);
    expect(isUsernameCharacter('<')).toBe(true);
    expect(isUsernameCharacter('>')).toBe(true);
  });

  it('allows usernames containing the full supported special-character set', () => {
    expect(usernameSchema.parse('runner_<->')).toBe('runner_<->');
  });

  it('rejects unsupported username characters', () => {
    expect(isUsernameCharacter('#')).toBe(false);
    expect(() => usernameSchema.parse('runner#name')).toThrow(
      'Username can only contain letters (A-Z), underscore (_), hyphen (-), and angle brackets (< >)'
    );
  });
});
