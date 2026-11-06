'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { Locale } from '@/lib/i18n/locale';
import { bootstrapOwnerSession, deleteOwnerSession, readOwnerSession } from './owner-session-actions';

export type OwnerSessionState =
  | { status: 'missing' }
  | { status: 'active'; expiresAt: string }
  | { status: 'unavailable' };

const copy = {
  es: {
    heading: 'Sesión privada', missing: 'No hay una sesión privada activa en este navegador.',
    active: 'Sesión privada activa en este navegador. Vence el',
    unavailable: 'La sesión privada no está disponible ahora. No podemos confirmar si existe una sesión.',
    bootstrap: 'Iniciar sesión privada', delete: 'Eliminar datos de esta sesión',
    confirmDelete: '¿Eliminar los datos de esta sesión privada del servidor? Esta acción no se puede deshacer. Las preferencias locales permanecerán en este navegador.',
    retry: 'Volver a comprobar',
    busy: 'Procesando…', scope: 'Esta sesión anónima dura como máximo siete días y solo funciona en este navegador. No se sincroniza entre dispositivos.',
    deletion: 'Eliminar esta sesión borra sus datos asociados del servidor. Las preferencias locales de este navegador se administran por separado.',
    empty: 'Este perfil todavía no muestra contenido guardado ni intentos. La prueba local del simulador no guarda ni califica intentos.',
  },
  en: {
    heading: 'Private session', missing: 'There is no active private session in this browser.',
    active: 'Private session active in this browser. Expires on',
    unavailable: 'The private session is unavailable now. We cannot confirm whether a session exists.',
    bootstrap: 'Start private session', delete: 'Delete this session data',
    confirmDelete: 'Delete this private session’s server data? This cannot be undone. Local preferences will remain in this browser.',
    retry: 'Check again',
    busy: 'Working…', scope: 'This anonymous session lasts at most seven days and works only in this browser. It does not sync across devices.',
    deletion: 'Deleting this session removes its associated server data. This browser’s local preferences are managed separately.',
    empty: 'This profile does not show saved content or attempts yet. The local simulator playtest does not save or score attempts.',
  },
} as const;

type Props = { locale: Locale; initialState: OwnerSessionState };

export function OwnerSessionPanel({ locale, initialState }: Props) {
  const serverStateKey = initialState.status === 'active'
    ? `active:${initialState.expiresAt}` : initialState.status;
  return <OwnerSessionPanelContent key={serverStateKey} locale={locale} initialState={initialState} />;
}

function OwnerSessionPanelContent({ locale, initialState }: Props) {
  const router = useRouter();
  const t = copy[locale];
  const [state, setState] = useState(initialState);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<OwnerSessionState>) {
    startTransition(async () => {
      try {
        setState(await action());
        router.refresh();
      } catch {
        setState({ status: 'unavailable' });
      }
    });
  }

  return <section className="rv-profile__owner" aria-labelledby="owner-session-heading">
    <h2 id="owner-session-heading">{t.heading}</h2>
    <p role="status" aria-live="polite">
      {pending ? t.busy : state.status === 'active'
        ? `${t.active} ${new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(state.expiresAt))} UTC.`
        : state.status === 'missing' ? t.missing : t.unavailable}
    </p>
    <p>{t.scope}</p>
    {state.status === 'missing' && <button type="button" disabled={pending} onClick={() => run(() => bootstrapOwnerSession({}))}>{t.bootstrap}</button>}
    {state.status === 'active' && <button type="button" disabled={pending} onClick={() => {
      if (window.confirm(t.confirmDelete)) run(() => deleteOwnerSession({}));
    }}>{t.delete}</button>}
    {state.status === 'unavailable' && <button type="button" disabled={pending} onClick={() => run(() => readOwnerSession({}))}>{t.retry}</button>}
    <p className="rv-profile__owner-note">{t.deletion}</p>
  </section>;
}
