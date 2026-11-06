'use client';

import { useEffect } from 'react';
import { readDevicePreferences } from '@/features/profile/device-preferences';

export default function Home() {
  useEffect(() => {
    const { preferences } = readDevicePreferences();
    window.location.replace(`/${preferences.locale}`);
  }, []);
  return <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}><p>RefView · Cargando / Loading…</p></main>;
}
