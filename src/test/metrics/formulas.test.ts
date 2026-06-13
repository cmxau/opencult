import { describe, it, expect } from 'vitest';
import {
  computeFFMI,
  computeASMI,
  computeMuscleFatRatio,
  computeObesityClass,
  computeBodyFatCategory,
  computeHydrationCategory,
  computeTDEE,
  computeIdealWeightRange,
} from '@/features/metrics/formulas';

describe('computeFFMI', () => {
  it('calculates FFMI from LBM and height', () => {
    // 60kg LBM, 1.75m height → 60 / (1.75²) = 60 / 3.0625 ≈ 19.59
    expect(computeFFMI(60, 1.75)).toBeCloseTo(19.59, 1);
  });
  it('returns 0 for zero height', () => {
    expect(computeFFMI(60, 0)).toBe(0);
  });
});

describe('computeASMI', () => {
  it('calculates ASMI from skeletal muscle mass and height', () => {
    // 32kg SMM, 1.70m → 32 / 2.89 ≈ 11.07
    expect(computeASMI(32, 1.70)).toBeCloseTo(11.07, 1);
  });
});

describe('computeMuscleFatRatio', () => {
  it('divides muscle by fat', () => {
    expect(computeMuscleFatRatio(45, 15)).toBeCloseTo(3.0, 1);
  });
  it('returns 0 when fat mass is 0', () => {
    expect(computeMuscleFatRatio(45, 0)).toBe(0);
  });
});

describe('computeObesityClass', () => {
  it('classifies underweight', () => {
    expect(computeObesityClass(17.5)).toBe('Underweight');
  });
  it('classifies normal', () => {
    expect(computeObesityClass(22)).toBe('Normal');
  });
  it('classifies overweight', () => {
    expect(computeObesityClass(27)).toBe('Overweight');
  });
  it('classifies obese class I', () => {
    expect(computeObesityClass(32)).toBe('Obese Class I');
  });
  it('classifies obese class II', () => {
    expect(computeObesityClass(37)).toBe('Obese Class II');
  });
  it('classifies obese class III', () => {
    expect(computeObesityClass(42)).toBe('Obese Class III');
  });
});

describe('computeBodyFatCategory', () => {
  it('male athlete range', () => {
    expect(computeBodyFatCategory(10, 'male')).toBe('Athlete');
  });
  it('female fitness range', () => {
    expect(computeBodyFatCategory(23, 'female')).toBe('Fitness');
  });
  it('male obese', () => {
    expect(computeBodyFatCategory(30, 'male')).toBe('Obese');
  });
  it('female essential fat', () => {
    expect(computeBodyFatCategory(12, 'female')).toBe('Essential Fat');
  });
});

describe('computeHydrationCategory', () => {
  it('male optimal', () => {
    expect(computeHydrationCategory(62, 'male')).toBe('Optimal');
  });
  it('male low', () => {
    expect(computeHydrationCategory(55, 'male')).toBe('Low');
  });
  it('female optimal', () => {
    expect(computeHydrationCategory(52, 'female')).toBe('Optimal');
  });
  it('female high', () => {
    expect(computeHydrationCategory(65, 'female')).toBe('High');
  });
});

describe('computeTDEE', () => {
  it('sedentary multiplier 1.2', () => {
    expect(computeTDEE(2000, 'sedentary')).toBe(2400);
  });
  it('active multiplier 1.725', () => {
    expect(computeTDEE(2000, 'active')).toBe(3450);
  });
});

describe('computeIdealWeightRange', () => {
  it('male 175cm gives plausible range', () => {
    const range = computeIdealWeightRange(175, 'male');
    expect(range.low).toBeGreaterThan(60);
    expect(range.high).toBeLessThan(80);
    expect(range.high).toBeGreaterThan(range.low);
  });
  it('female 165cm gives plausible range', () => {
    const range = computeIdealWeightRange(165, 'female');
    expect(range.low).toBeGreaterThan(50);
    expect(range.high).toBeLessThan(70);
  });
});
