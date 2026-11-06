import type { Locale } from '@/lib/i18n/locale';

export const preferenceKey = 'refview.preferences.v1';

export type DevicePreferences = {
  schemaVersion: 1;
  locale: Locale;
  cameraMode: 'thirdPerson' | 'firstPerson';
  cameraDistanceM: number | null;
  cameraLateralM: number | null;
  mouseSensitivity: number;
  invertY: boolean;
  reducedMotion: boolean | null;
  quality: 'low' | 'high';
};

export const defaultPreferences: DevicePreferences = {
  schemaVersion: 1,
  locale: 'es',
  cameraMode: 'thirdPerson',
  cameraDistanceM: null,
  cameraLateralM: null,
  mouseSensitivity: 1,
  invertY: false,
  reducedMotion: null,
  quality: 'high',
};

type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type ReadResult = { preferences: DevicePreferences; available: boolean; stored: boolean };
let volatilePreferences: DevicePreferences | null = null;

function stepped(value: unknown, min: number, max: number, step: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max &&
    Math.abs((value - min) / step - Math.round((value - min) / step)) < 1e-9;
}

export function parsePreferences(input: unknown): DevicePreferences {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return { ...defaultPreferences };
  const record = input as Record<string, unknown>;
  if (record.schemaVersion !== 1) return { ...defaultPreferences };
  return {
    schemaVersion: 1,
    locale: record.locale === 'en' ? 'en' : 'es',
    cameraMode: record.cameraMode === 'firstPerson' ? 'firstPerson' : 'thirdPerson',
    cameraDistanceM: record.cameraDistanceM === null || stepped(record.cameraDistanceM, 2, 8, 0.5) ? record.cameraDistanceM as number | null : null,
    cameraLateralM: record.cameraLateralM === null || stepped(record.cameraLateralM, -3, 3, 0.5) ? record.cameraLateralM as number | null : null,
    mouseSensitivity: stepped(record.mouseSensitivity, 0.2, 2, 0.1) ? record.mouseSensitivity : 1,
    invertY: typeof record.invertY === 'boolean' ? record.invertY : false,
    reducedMotion: record.reducedMotion === null || typeof record.reducedMotion === 'boolean' ? record.reducedMotion : null,
    quality: record.quality === 'low' ? 'low' : 'high',
  };
}

export function readPreferences(storage: StoragePort): ReadResult {
  let raw: string | null;
  try { raw = storage.getItem(preferenceKey); }
  catch { return { preferences: { ...defaultPreferences }, available: false, stored: false }; }
  if (raw === null) return { preferences: { ...defaultPreferences }, available: true, stored: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    const stored = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && (parsed as Record<string, unknown>).schemaVersion === 1;
    return { preferences: parsePreferences(parsed), available: true, stored };
  }
  catch { return { preferences: { ...defaultPreferences }, available: true, stored: false }; }
}

export function savePreferences(input: unknown, storage: StoragePort): boolean {
  try { storage.setItem(preferenceKey, JSON.stringify(parsePreferences(input))); return true; }
  catch { return false; }
}

export function resetPreferences(storage: StoragePort): boolean {
  try { storage.removeItem(preferenceKey); return true; }
  catch { return false; }
}

export function effectiveReducedMotion(choice: boolean | null, osPrefersReducedMotion: boolean): boolean {
  return choice ?? osPrefersReducedMotion;
}

export function readDevicePreferences(): ReadResult {
  if (volatilePreferences) return { preferences: { ...volatilePreferences }, available: false, stored: false };
  if (typeof window === 'undefined') return { preferences: { ...defaultPreferences }, available: false, stored: false };
  try { return readPreferences(window.localStorage); }
  catch { return { preferences: { ...defaultPreferences }, available: false, stored: false }; }
}

export function writeDevicePreferences(next: unknown): boolean {
  const normalized = parsePreferences(next);
  if (typeof window === 'undefined') return false;
  try {
    if (savePreferences(normalized, window.localStorage)) { volatilePreferences = null; return true; }
  } catch { /* Fall through to volatile preferences. */ }
  volatilePreferences = normalized;
  return false;
}

export function resetDevicePreferences(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (resetPreferences(window.localStorage)) { volatilePreferences = null; return true; }
  } catch { /* Fall through to volatile defaults. */ }
  volatilePreferences = { ...defaultPreferences };
  return false;
}

export function savePreferredLocale(locale: Locale): boolean {
  const { preferences } = readDevicePreferences();
  return writeDevicePreferences({ ...preferences, locale });
}
