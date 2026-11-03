'use client';

import dynamic from 'next/dynamic';
import type { Locale } from '@/lib/i18n/locale';

const FieldCanvas = dynamic(() => import('./FieldCanvas'), {
  ssr: false,
  loading: () => <div className="scene-message" role="status">Cargando vista 3D… / Loading 3D view…</div>,
});

export function ScenePreview({ locale }: { locale: Locale }) {
  return <div className="scene-frame"><FieldCanvas locale={locale} /></div>;
}
