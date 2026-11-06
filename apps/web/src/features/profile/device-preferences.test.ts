import { afterEach, describe, expect, it, vi } from 'vitest';
import { defaultPreferences, parsePreferences, readPreferences, readDevicePreferences, resetDevicePreferences, resetPreferences, savePreferences, writeDevicePreferences, effectiveReducedMotion, preferenceKey } from './device-preferences';

afterEach(() => vi.unstubAllGlobals());

describe('device preferences', () => {
  it('falls back per field, discards unknown fields, and rejects a schema mismatch', () => {
    expect(parsePreferences({ schemaVersion: 1, locale: 'en', cameraMode: 'bad', cameraDistanceM: 2.25, cameraLateralM: -2.5, mouseSensitivity: Infinity, invertY: true, reducedMotion: false, quality: 'low', secret: 'discard' })).toEqual({
      ...defaultPreferences, locale: 'en', cameraLateralM: -2.5, invertY: true, reducedMotion: false, quality: 'low',
    });
    expect(parsePreferences({ ...defaultPreferences, schemaVersion: 2, locale: 'en' })).toEqual(defaultPreferences);
    expect(parsePreferences(null)).toEqual(defaultPreferences);
    const valid = { ...defaultPreferences, locale: 'en', cameraMode: 'firstPerson' as const, cameraDistanceM: 5, cameraLateralM: 2, mouseSensitivity: 1.3, invertY: true, reducedMotion: true, quality: 'low' as const };
    expect(parsePreferences({ ...valid, locale: 'fr' })).toEqual({ ...valid, locale: 'es' });
    expect(parsePreferences({ ...valid, cameraLateralM: 0.25 })).toEqual({ ...valid, cameraLateralM: null });
    expect(parsePreferences({ ...valid, invertY: 'yes' })).toEqual({ ...valid, invertY: false });
    expect(parsePreferences({ ...valid, reducedMotion: 'yes' })).toEqual({ ...valid, reducedMotion: null });
    expect(parsePreferences({ ...valid, quality: 'ultra' })).toEqual({ ...valid, quality: 'high' });
  });

  it('validates finite step values and writes only normalized records', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    expect(savePreferences({ ...defaultPreferences, cameraDistanceM: 8, cameraLateralM: 3, mouseSensitivity: 1.7 }, storage)).toBe(true);
    expect(readPreferences(storage)).toEqual({ preferences: { ...defaultPreferences, cameraDistanceM: 8, cameraLateralM: 3, mouseSensitivity: 1.7 }, available: true, stored: true });
    expect(savePreferences({ ...defaultPreferences, cameraDistanceM: 8.25, mouseSensitivity: NaN }, storage)).toBe(true);
    expect(readPreferences(storage).preferences).toEqual(defaultPreferences);
    expect(JSON.parse(values.get(preferenceKey)!)).toEqual(defaultPreferences);
    expect(resetPreferences(storage)).toBe(true);
    expect(values.has(preferenceKey)).toBe(false);
  });

  it('keeps defaults on malformed or inaccessible storage and reports write/reset failures', () => {
    const malformed = { getItem: () => '{', setItem: () => {}, removeItem: () => {} };
    expect(readPreferences(malformed)).toEqual({ preferences: defaultPreferences, available: true, stored: false });
    const broken = { getItem: (): string => { throw Error('blocked'); }, setItem: (): void => { throw Error('quota'); }, removeItem: (): void => { throw Error('blocked'); } };
    expect(readPreferences(broken)).toEqual({ preferences: defaultPreferences, available: false, stored: false });
    expect(savePreferences(defaultPreferences, broken)).toBe(false);
    expect(resetPreferences(broken)).toBe(false);
  });

  it('uses the OS motion choice only when no preference is stored', () => {
    expect(effectiveReducedMotion(null, true)).toBe(true);
    expect(effectiveReducedMotion(false, true)).toBe(false);
    expect(effectiveReducedMotion(true, false)).toBe(true);
  });

  it('retains the stored locale when another setting changes on an explicit locale route', () => {
    const values = new Map<string, string>([[preferenceKey, JSON.stringify({ ...defaultPreferences, locale: 'en' })]]);
    vi.stubGlobal('window', { localStorage: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } } });
    const routeLocale = 'es';
    const current = readDevicePreferences().preferences;
    expect(routeLocale).toBe('es');
    expect(current.locale).toBe('en');
    expect(writeDevicePreferences({ ...current, quality: 'low' })).toBe(true);
    expect(readDevicePreferences().preferences).toMatchObject({ locale: 'en', quality: 'low' });
  });

  it('keeps in-memory selections across route reads after a failed write, then resets them', () => {
    const storage = { getItem: () => null, setItem: (): void => { throw Error('quota'); }, removeItem: (): void => { throw Error('blocked'); } };
    vi.stubGlobal('window', { localStorage: storage });
    expect(writeDevicePreferences({ ...defaultPreferences, locale: 'en', cameraMode: 'firstPerson', quality: 'low' })).toBe(false);
    expect(readDevicePreferences()).toEqual({ preferences: { ...defaultPreferences, locale: 'en', cameraMode: 'firstPerson', quality: 'low' }, available: false, stored: false });
    expect(resetDevicePreferences()).toBe(false);
    expect(readDevicePreferences().preferences).toEqual(defaultPreferences);
  });
});
