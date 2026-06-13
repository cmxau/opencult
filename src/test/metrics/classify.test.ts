import { describe, it, expect } from 'vitest';
import { classifyBMI, classifyVisceralFat, classifyHeartRate, classifyFFMI } from '@/features/metrics/classify';

describe('classifyBMI', () => {
  it('returns normal for 22', () => {
    expect(classifyBMI(22).status).toBe('normal');
  });
  it('returns high for 32', () => {
    expect(classifyBMI(32).status).toBe('high');
  });
  it('returns low for 17', () => {
    expect(classifyBMI(17).status).toBe('low');
  });
});

describe('classifyVisceralFat', () => {
  it('level 1-9 normal', () => {
    expect(classifyVisceralFat(5).status).toBe('normal');
  });
  it('level 10-14 high', () => {
    expect(classifyVisceralFat(12).status).toBe('high');
  });
  it('level 15+ alert', () => {
    expect(classifyVisceralFat(18).status).toBe('alert');
  });
});

describe('classifyHeartRate', () => {
  it('60-100 bpm normal at rest', () => {
    expect(classifyHeartRate(72).status).toBe('normal');
  });
  it('below 60 flagged low', () => {
    expect(classifyHeartRate(50).status).toBe('low');
  });
  it('above 100 flagged high', () => {
    expect(classifyHeartRate(105).status).toBe('high');
  });
});

describe('classifyFFMI', () => {
  it('male 19 is normal', () => {
    expect(classifyFFMI(19, 'male').status).toBe('normal');
  });
  it('male 15 is low', () => {
    expect(classifyFFMI(15, 'male').status).toBe('low');
  });
  it('female 16 is normal', () => {
    expect(classifyFFMI(16, 'female').status).toBe('normal');
  });
});
