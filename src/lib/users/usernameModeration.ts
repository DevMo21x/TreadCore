import 'server-only';

import { Filter } from 'bad-words';

import { normalizeUsername } from '@/lib/users/usernameValidation';

export const USERNAME_INAPPROPRIATE_LANGUAGE_MESSAGE = 'Username contains inappropriate language.';

const filter = new Filter();

const leetspeakMap: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  $: 's',
  '!': 'i',
};

const substringProfanityList = Array.from(
  new Set(
    filter.list
      .map((word) => word.toLowerCase().replace(/[^a-z]/g, ''))
      .filter((word) => word.length >= 4)
  )
);

export function normalizeUsernameForModeration(username: string) {
  return normalizeUsername(username)
    .toLowerCase()
    .split('')
    .map((char) => leetspeakMap[char] ?? char)
    .join('');
}

function stripNonLetters(value: string) {
  return value.replace(/[^a-z]/g, '');
}

function containsProfaneSubstring(username: string) {
  const lettersOnlyUsername = stripNonLetters(username);

  return substringProfanityList.some((profaneWord) => lettersOnlyUsername.includes(profaneWord));
}

export function validateUsername(username: string) {
  const normalizedUsername = normalizeUsernameForModeration(username);

  if (
    filter.isProfane(username) ||
    filter.isProfane(normalizedUsername) ||
    containsProfaneSubstring(normalizedUsername)
  ) {
    return {
      valid: false as const,
      error: USERNAME_INAPPROPRIATE_LANGUAGE_MESSAGE,
    };
  }

  return { valid: true as const };
}

export function assertUsernameIsAllowed(username: string) {
  const result = validateUsername(username);

  if (!result.valid) {
    throw new Error(result.error);
  }
}
