import { z } from 'zod';

export const MIN_WEIGHT_KG = 20;
export const MAX_WEIGHT_KG = 500;
export const MIN_AGE_YEARS = 5;
export const MAX_AGE_YEARS = 120;

function normalizeOptionalNumericInput(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return null;
    }

    const parsedValue = Number(trimmedValue);

    if (Number.isNaN(parsedValue)) {
      return value;
    }

    return parsedValue;
  }

  return value;
}

export const optionalWeightKgSchema = z.preprocess(
  normalizeOptionalNumericInput,
  z.number().min(MIN_WEIGHT_KG).max(MAX_WEIGHT_KG).nullable()
);

export const optionalAgeYearsSchema = z.preprocess(
  normalizeOptionalNumericInput,
  z.number().int().min(MIN_AGE_YEARS).max(MAX_AGE_YEARS).nullable()
);

export const profileMetricsSchema = z.object({
  weightKg: optionalWeightKgSchema,
  ageYears: optionalAgeYearsSchema,
});

export type ProfileMetricsInput = z.infer<typeof profileMetricsSchema>;
