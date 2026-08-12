import { z } from 'zod';

export const PIN_MIN_LENGTH = 4;
export const PIN_MAX_LENGTH = 32;
export const PIN_CHARACTER_PATTERN = /^[0-9]$/;
export const PIN_PATTERN = new RegExp(`^[0-9]{${PIN_MIN_LENGTH},${PIN_MAX_LENGTH}}$`);

export const pinSchema = z.string().regex(PIN_PATTERN);

export function isPinCharacter(key: string) {
  return PIN_CHARACTER_PATTERN.test(key);
}
