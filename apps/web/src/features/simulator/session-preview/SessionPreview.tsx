'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { establishPreviewSession } from './actions';

type Locale = 'es' | 'en';
type Status = 'active' | 'missing';

const labels = {
  es: {
    title: 'Prueba técnica de sesión anónima',
    description: 'Esta página comprueba una sesión de navegador en una base de datos de prueba aislada. No hay incidente, intento, puntuación ni publicación.',
    active: 'Sesión activa', missing: 'Sin sesión activa',
    establish: 'Establecer sesión', reload: 'Recargar estado', working: 'Guardando…', error: 'No se pudo establecer la sesión.',
  },
  en: {
    title: 'Anonymous session technical preview',
    description: 'This page checks a browser session in an isolated test database. There is no incident, attempt, score, or publication.',
    active: 'Active session', missing: 'No active session',
    establish: 'Establish session', reload: 'Reload status', working: 'Saving…', error: 'Could not establish session.',
  },
} as const;

export function SessionPreview({ locale, initialStatus }: { locale: Locale; initialStatus: Status }) {
  const copy = labels[locale];
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function establish() {
    setPending(true);
    setError(false);
    try {
      const result = await establishPreviewSession({});
      setStatus(result.status);
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return <main style={{ maxWidth: 700, margin: '4rem auto', padding: '0 1.5rem', lineHeight: 1.6 }}>
    <h1>{copy.title}</h1>
    <p>{copy.description}</p>
    <p role="status">{status === 'active' ? copy.active : copy.missing}</p>
    <button type="button" onClick={establish} disabled={pending}>{pending ? copy.working : copy.establish}</button>{' '}
    <button type="button" onClick={() => window.location.reload()}>{copy.reload}</button>
    {error && <p role="alert">{copy.error}</p>}
  </main>;
}
