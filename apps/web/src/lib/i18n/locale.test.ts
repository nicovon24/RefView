import { describe, expect, it } from 'vitest';
import { resolveLocale } from './locale';

describe('resolveLocale', () => {
  it('defaults unsupported locales to Spanish', () => {
    expect(resolveLocale(undefined)).toBe('es');
    expect(resolveLocale('fr')).toBe('es');
  });

  it('preserves the English alternative', () => {
    expect(resolveLocale('en')).toBe('en');
  });
});
