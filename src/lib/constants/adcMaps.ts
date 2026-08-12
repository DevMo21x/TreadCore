/**
 * ADC value mappings for treadmill elevation control.
 *
 * These values represent analog-to-digital converter readings for different
 * incline and decline levels on the treadmill (0-10 range).
 */

/** ADC values for incline levels (0-10) */
export const INCLINE_TO_ADC = {
  0: 200,
  1: 260,
  2: 320,
  3: 380,
  4: 440,
  5: 500,
  6: 560,
  7: 620,
  8: 680,
  9: 740,
  10: 800,
} as const;

/** Minimum ADC value threshold */
export const MIN_ADC = 200;
export const MAX_ADC = 800;

/**
 * Converts a raw ADC value from the hardware back to an incline level (0-10).
 * Finds the nearest level by minimum ADC distance.
 * @param adc - Raw ADC value received from hardware
 * @returns The nearest incline level (0-10)
 */
export function adcToLevel(adc: number): number {
  let nearestLevel = 0;
  let minDistance = Infinity;

  for (const [level, adcValue] of Object.entries(INCLINE_TO_ADC)) {
    const distance = Math.abs(adc - adcValue);
    if (distance < minDistance) {
      minDistance = distance;
      nearestLevel = parseInt(level, 10);
    }
  }

  return nearestLevel;
}
