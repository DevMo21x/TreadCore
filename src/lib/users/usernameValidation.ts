import { z } from 'zod';

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_CHARACTER_PATTERN = /^[A-Za-z_<>-]$/;
export const USERNAME_PATTERN = new RegExp(
  `^[A-Za-z_<>-]{${USERNAME_MIN_LENGTH},${USERNAME_MAX_LENGTH}}$`
);

export function normalizeUsername(username: string) {
  return username.trim();
}

export function isUsernameCharacter(key: string) {
  return USERNAME_CHARACTER_PATTERN.test(key);
}

export const usernameSchema = z
  .string()
  .trim()
  .min(USERNAME_MIN_LENGTH)
  .max(USERNAME_MAX_LENGTH)
  .regex(
    USERNAME_PATTERN,
    'Username can only contain letters (A-Z), underscore (_), hyphen (-), and angle brackets (< >)'
  );
