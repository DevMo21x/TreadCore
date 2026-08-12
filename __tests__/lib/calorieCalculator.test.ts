import { calculateCaloriesBurned, DEFAULT_WEIGHT_KG } from '@/lib/treadmill/calories';
import { describe, it, expect } from 'vitest';

describe('calorieCalculator', () => {
  describe('DEFAULT_WEIGHT_KG', () => {
    it('should export default weight constant', () => {
      expect(DEFAULT_WEIGHT_KG).toBe(70);
    });
  });

  describe('calculateCaloriesBurned', () => {
    describe('walking speeds (≤8 km/h)', () => {
      it('should calculate calories for slow walking with zero incline', () => {
        // 4 km/h, 0 degrees, 1 hour (3600 seconds), 70 kg
        // S = (4 * 1000) / 60 = 66.67 m/min
        // G = tan(0) = 0
        // VO₂ = 3.5 + 0.1 * 66.67 + 1.8 * 66.67 * 0 = 3.5 + 6.667 = 10.167 ml/kg/min
        // calories = (10.167 * 70 * 5) / 1000 * (3600 / 60) = 3.558 * 60 = 213.48 cal
        const calories = calculateCaloriesBurned(4, 0, 3600);
        expect(calories).toBeCloseTo(213.48, 1);
      });

      it('should calculate calories for walking with positive incline', () => {
        // 4 km/h, 5 degrees, 1 hour, 70 kg
        // S = 66.67 m/min
        // G = tan(5 * π / 180) ≈ 0.08749
        // VO₂ = 3.5 + 0.1 * 66.67 + 1.8 * 66.67 * 0.08749 ≈ 3.5 + 6.667 + 10.5 ≈ 20.667
        const calories = calculateCaloriesBurned(4, 5, 3600);
        expect(calories).toBeGreaterThan(213); // Should be higher due to incline
        expect(calories).toBeLessThan(450);
      });

      it('should use default weight when not provided', () => {
        const caloriesWithDefault = calculateCaloriesBurned(4, 0, 3600);
        const caloriesWithExplicit = calculateCaloriesBurned(4, 0, 3600, 70);
        expect(caloriesWithDefault).toBe(caloriesWithExplicit);
      });

      it('should scale linearly with weight', () => {
        const calories70 = calculateCaloriesBurned(4, 0, 3600, 70);
        const calories140 = calculateCaloriesBurned(4, 0, 3600, 140);
        expect(calories140).toBeCloseTo(calories70 * 2, 1);
      });

      it('should scale linearly with duration', () => {
        const calories1hour = calculateCaloriesBurned(4, 0, 3600, 70);
        const calories2hours = calculateCaloriesBurned(4, 0, 7200, 70);
        expect(calories2hours).toBeCloseTo(calories1hour * 2, 1);
      });

      it('should handle boundary speed of 8 km/h (walking)', () => {
        // At exactly 8 km/h, should use walking equation
        // S = (8 * 1000) / 60 = 133.33 m/min
        // G = 0
        // VO₂ = 3.5 + 0.1 * 133.33 + 0 = 3.5 + 13.333 = 16.833
        const calories = calculateCaloriesBurned(8, 0, 3600, 70);
        expect(calories).toBeCloseTo(353.5, 1); // VO₂=16.833, 16.833*70*5/1000=5.892 cal/min, *60=353.52
      });
    });

    describe('running speeds (>8 km/h)', () => {
      it('should calculate calories for easy running', () => {
        // 10 km/h, 0 degrees, 1 hour, 70 kg
        // S = (10 * 1000) / 60 = 166.67 m/min
        // G = 0
        // VO₂ = 3.5 + 0.2 * 166.67 + 0 = 3.5 + 33.334 = 36.834
        // calories = (36.834 * 70 * 5) / 1000 * 60 = 12.892 * 60 = 773.52 cal
        const calories = calculateCaloriesBurned(10, 0, 3600, 70);
        expect(calories).toBeCloseTo(773.52, 0);
      });

      it('should calculate calories for running with incline', () => {
        // 10 km/h, 5 degrees, 1 hour, 70 kg
        // S = 166.67 m/min
        // G = tan(5 * π / 180) ≈ 0.08749
        // VO₂ = 3.5 + 0.2 * 166.67 + 0.9 * 166.67 * 0.08749 ≈ 3.5 + 33.334 + 13.125 ≈ 49.959
        const calories = calculateCaloriesBurned(10, 5, 3600, 70);
        expect(calories).toBeGreaterThan(773); // Should be higher due to incline
        expect(calories).toBeLessThan(1200);
      });

      it('should handle boundary speed of 8.01 km/h (running)', () => {
        // Just above 8 km/h, should use running equation
        // S = (8.01 * 1000) / 60 = 133.5 m/min
        // G = 0
        // VO₂ = 3.5 + 0.2 * 133.5 = 3.5 + 26.7 = 30.2
        const calories = calculateCaloriesBurned(8.01, 0, 3600, 70);
        expect(calories).toBeGreaterThan(588); // Running VO₂ > walking VO₂ at same speed
      });

      it('should calculate calories for moderate running (12 km/h)', () => {
        // 12 km/h, 0 degrees, 30 minutes, 70 kg
        // S = (12 * 1000) / 60 = 200 m/min
        // G = 0
        // VO₂ = 3.5 + 0.2 * 200 = 3.5 + 40 = 43.5
        // calories = (43.5 * 70 * 5) / 1000 * (1800 / 60) = 15.225 * 30 = 456.75
        const calories = calculateCaloriesBurned(12, 0, 1800, 70);
        expect(calories).toBeCloseTo(456.75, 0);
      });
    });

    describe('edge cases and zero values', () => {
      it('should handle zero speed', () => {
        // At 0 km/h (no movement), should still calculate based on ACSM formula
        // S = 0
        // G = 0
        // VO₂ = 3.5 (baseline)
        // calories = (3.5 * 70 * 5) / 1000 * (3600 / 60) = 1.225 * 60 = 73.5
        const calories = calculateCaloriesBurned(0, 0, 3600, 70);
        expect(calories).toBeCloseTo(73.5, 0);
      });

      it('should handle zero duration', () => {
        const calories = calculateCaloriesBurned(4, 0, 0, 70);
        expect(calories).toBeCloseTo(0, 2);
      });

      it('should handle zero incline', () => {
        // tan(0) = 0, incline should not affect calculation
        const calories = calculateCaloriesBurned(4, 0, 3600, 70);
        expect(calories).toBeGreaterThan(0);
      });

      it('should handle different weight values', () => {
        // Lower weight
        const calories50 = calculateCaloriesBurned(4, 0, 3600, 50);
        // Higher weight
        const calories100 = calculateCaloriesBurned(4, 0, 3600, 100);

        expect(calories100).toBeGreaterThan(calories50);
        expect(calories100 / calories50).toBeCloseTo(100 / 50, 1);
      });

      it('should handle high inclines (e.g., 30 degrees)', () => {
        // 4 km/h, 30 degrees (steep)
        // S = 66.67 m/min
        // G = tan(30 * π / 180) ≈ 0.5774
        // VO₂ = 3.5 + 0.1 * 66.67 + 1.8 * 66.67 * 0.5774 ≈ 3.5 + 6.667 + 69.28 ≈ 79.447
        const calories = calculateCaloriesBurned(4, 30, 3600, 70);
        expect(calories).toBeGreaterThan(213); // Much higher than flat walk
        expect(calories).toBeLessThan(2000); // But reasonable
      });
    });

    describe('VO₂ threshold verification', () => {
      it('walking equation should give lower VO₂ than running at speed boundary', () => {
        // At 8 km/h walking: VO₂ = 3.5 + 0.1*133.33 = 16.833
        const caloriesWalking = calculateCaloriesBurned(8, 0, 3600, 70);

        // Just above 8 km/h running: VO₂ = 3.5 + 0.2*133.5 = 30.2
        const caloriesRunning = calculateCaloriesBurned(8.01, 0, 3600, 70);

        // Running should be significantly higher
        expect(caloriesRunning).toBeGreaterThan(caloriesWalking * 1.5);
      });
    });

    describe('realistic workout scenarios', () => {
      it('should calculate 30-minute light walk (3 km/h)', () => {
        const calories = calculateCaloriesBurned(3, 0, 1800, 70);
        // S = 50 m/min, VO₂ = 3.5 + 5 = 8.5, calories = 8.5 * 70 * 5 / 1000 * 30 = 89.25
        expect(calories).toBeGreaterThan(80);
        expect(calories).toBeLessThan(100);
      });

      it('should calculate 45-minute moderate walk (5 km/h, 2% grade)', () => {
        const calories = calculateCaloriesBurned(5, 2, 2700, 70);
        // Should be between 250-400 calories
        expect(calories).toBeGreaterThan(250);
        expect(calories).toBeLessThan(400);
      });

      it('should calculate 20-minute run (10 km/h)', () => {
        const calories = calculateCaloriesBurned(10, 0, 1200, 70);
        // Should be between 250-350 calories
        expect(calories).toBeGreaterThan(250);
        expect(calories).toBeLessThan(350);
      });

      it('should calculate 30-minute hill running (12 km/h, 5% grade)', () => {
        const calories = calculateCaloriesBurned(12, 5, 1800, 70);
        // Should be between 500-700 calories
        expect(calories).toBeGreaterThan(500);
        expect(calories).toBeLessThan(700);
      });
    });
  });
});
