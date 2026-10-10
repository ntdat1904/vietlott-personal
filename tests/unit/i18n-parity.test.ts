import { describe, expect, it } from 'vitest';
import en from '../../src/i18n/locales/en.json';
import vi from '../../src/i18n/locales/vi.json';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flattenKeys(value as Record<string, unknown>, full);
    }
    return [full];
  });
}

// EN uses i18next plural keys (_one/_other); VI only needs _other. Normalize
// plural suffixes before comparing so the two locale files can be compared fairly.
function normalizePlural(key: string): string {
  return key.replace(/_(one|other)$/, '');
}

describe('i18n key parity', () => {
  it('en.json and vi.json cover the same set of (normalized) keys', () => {
    const enKeys = new Set(flattenKeys(en).map(normalizePlural));
    const viKeys = new Set(flattenKeys(vi).map(normalizePlural));
    const missingInVi = [...enKeys].filter((k) => !viKeys.has(k));
    const missingInEn = [...viKeys].filter((k) => !enKeys.has(k));
    expect(missingInVi).toEqual([]);
    expect(missingInEn).toEqual([]);
  });
});
