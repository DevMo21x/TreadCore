/**
 * Calorie Burn Calculator using ACSM (American College of Sports Medicine) formulas
 *
 * Implements the standard walking and running VO₂ equations:
 * - Walking (≤8 km/h): VO₂ = 3.5 + 0.1*S + 1.8*S*G
 * - Running (>8 km/h): VO₂ = 3.5 + 0.2*S + 0.9*S*G
 *
 * Where:
 * - S = speed in m/min (converted from km/h)
 * - G = grade (tan of incline in degrees)
 */

/** Default body weight in kilograms used if not specified */
export const DEFAULT_WEIGHT_KG = 70;

/** Parameters for calorie calculation */
interface CalorieParams {
  speedKmH: number;
  inclineDegrees: number;
  durationSeconds: number;
  weightKg?: number;
}

/**
 * Calculate oxygen uptake (VO₂) using ACSM formulas
 * @param speedKmH - Treadmill speed in kilometers per hour
 * @param inclineDegrees - Treadmill incline in degrees
 * @returns VO₂ in ml/kg/min
 */
function getACSMVO2(speedKmH: number, inclineDegrees: number): number {
  // Convert speed from km/h to m/min
  const S = (speedKmH * 1000) / 60;

  // Convert incline from degrees to grade (tan of angle in radians)
  const G = Math.tan((inclineDegrees * Math.PI) / 180);

  // Determine if walking or running based on speed threshold
  if (speedKmH <= 8) {
    // Walking equation: VO₂ = 3.5 + 0.1*S + 1.8*S*G
    return 3.5 + 0.1 * S + 1.8 * S * G;
  } else {
    // Running equation: VO₂ = 3.5 + 0.2*S + 0.9*S*G
    return 3.5 + 0.2 * S + 0.9 * S * G;
  }
}

/**
 * Calculate calories burned during exercise
 * @param speedKmH - Treadmill speed in kilometers per hour
 * @param inclineDegrees - Treadmill incline in degrees
 * @param durationSeconds - Duration of exercise in seconds
 * @param weightKg - Body weight in kilograms (defaults to 70)
 * @returns Estimated calories burned
 */
export function calculateCaloriesBurned(
  speedKmH: number,
  inclineDegrees: number,
  durationSeconds: number,
  weightKg: number = DEFAULT_WEIGHT_KG
): number {
  // Get VO₂ in ml/kg/min
  const VO2 = getACSMVO2(speedKmH, inclineDegrees);

  // Calculate calories burned
  // Formula: calories = (VO₂ × weightKg × 5 / 1000) × (durationSeconds / 60)
  const calories = ((VO2 * weightKg * 5) / 1000) * (durationSeconds / 60);

  return calories;
}
