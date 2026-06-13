/**
 * Pure unit conversion + formatting helpers.
 */

import type { WeightUnit, HeightUnit } from './db/types';

const KG_TO_LBS = 2.2046226218;
const CM_TO_IN  = 0.3937007874;

/* Weight */
export function kgToLbs(kg: number): number { return kg * KG_TO_LBS; }
export function lbsToKg(lbs: number): number { return lbs / KG_TO_LBS; }

export function formatWeight(kg: number, unit: WeightUnit, digits = 1): string {
  if (unit === 'lbs') return `${kgToLbs(kg).toFixed(digits)} lbs`;
  return `${kg.toFixed(digits)} kg`;
}

export function formatWeightValue(kg: number, unit: WeightUnit, digits = 1): string {
  if (unit === 'lbs') return kgToLbs(kg).toFixed(digits);
  return kg.toFixed(digits);
}

export function weightUnitLabel(unit: WeightUnit): string {
  return unit === 'lbs' ? 'lbs' : 'kg';
}

/* Height */
export function cmToInches(cm: number): number { return cm * CM_TO_IN; }
export function inchesToCm(inches: number): number { return inches / CM_TO_IN; }

export function cmToFtIn(cm: number): { ft: number; in: number } {
  const total = cm * CM_TO_IN;
  const ft = Math.floor(total / 12);
  const inch = Math.round(total - ft * 12);
  return { ft, in: inch };
}

export function ftInToCm(ft: number, inches: number): number {
  return (ft * 12 + inches) / CM_TO_IN;
}

export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'ft') {
    const { ft, in: inches } = cmToFtIn(cm);
    return `${ft}'${inches}"`;
  }
  return `${Math.round(cm)} cm`;
}

export function heightUnitLabel(unit: HeightUnit): string {
  return unit === 'ft' ? 'ft/in' : 'cm';
}
