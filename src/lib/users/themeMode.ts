import { z } from 'zod';

export const THEME_MODE_DARK = 'dark' as const;
export const THEME_MODE_LIGHT = 'light' as const;

export const themeModeValues = [THEME_MODE_DARK, THEME_MODE_LIGHT] as const;

export type ThemeMode = (typeof themeModeValues)[number];

export const themeModeSchema = z.object({
  themeMode: z.enum(themeModeValues),
});
