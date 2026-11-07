'use client';

import { useState, useTransition } from 'react';
import type { Locale } from '@/lib/i18n/locale';
import { attachCurrentAnonymousData, deleteCurrentAccount, forgetInvalidAccountSession,
  logoutCurrentAccount } from './account-lifecycle-actions';

export type AccountState = 'missing' | 'active' | 'unavailable';

const copy = {
  es: {
    heading: 'Cuenta RefView', unavailable: 'No podemos confirmar tu cuenta ahora. Si acabás de cerrar sesión, reiniciá el acceso de este navegador.',
    recover: 'Reiniciar acceso con Google', recoverError: 'No se pudo reiniciar el acceso. Volvé a intentarlo.',
    pendingSetup: 'El acceso con Google estará disponible cuando se configure en este entorno.',
    login: 'Continuar con Google', loginError: 'No se pudo iniciar el acceso con Google.',
    active: 'Tu cuenta conserva los ejercicios y las lecciones guardadas hasta que la elimines.',
    attach: 'Vincular datos de este navegador', attachBody: 'Esta acción incorpora los ejercicios y guardados de tu sesión privada actual a la cuenta. Después podrás consultarlos desde otros dispositivos. La sesión privada anterior dejará de dar acceso a esos datos.',
    attachError: 'No se pudieron vincular los datos. Comprobá ambas sesiones y volvé a intentarlo.',
    attached: 'Datos vinculados con tu cuenta.', logout: 'Cerrar sesión en este dispositivo',
    logoutError: 'No se pudo cerrar la sesión.', delete: 'Eliminar cuenta y datos',
    deleteBody: 'Se eliminarán la cuenta, sus sesiones, ejercicios, lecciones guardadas y los partidos y opiniones privados que hayas preparado en Comunidad. Esta acción no se puede deshacer. Las preferencias locales de este navegador se administran por separado.',
    confirmLabel: 'Para confirmar, escribí DELETE REFVIEW', deleteError: 'No se pudo eliminar la cuenta. Iniciá sesión de nuevo si la sesión ya no es reciente.',
    busy: 'Procesando…',
  },
  en: {
    heading: 'RefView account', unavailable: 'We cannot confirm your account right now. If you just signed out, reset sign-in in this browser.',
    recover: 'Reset Google sign-in', recoverError: 'Could not reset sign-in. Try again.',
    pendingSetup: 'Google sign-in will be available once it is configured in this environment.',
    login: 'Continue with Google', loginError: 'Could not start Google sign-in.',
    active: 'Your account keeps exercises and saved lessons until you delete it.',
    attach: 'Attach data from this browser', attachBody: 'This adds the exercises and saved lessons from your current private session to your account. You can then access them on other devices. The old private session will no longer access that data.',
    attachError: 'Could not attach the data. Check both sessions and try again.',
    attached: 'Data attached to your account.', logout: 'Sign out on this device',
    logoutError: 'Could not sign out.', delete: 'Delete account and data',
    deleteBody: 'Your account, sessions, exercises, saved lessons, and private matches and opinions prepared in Community will be deleted. This cannot be undone. Local preferences in this browser are managed separately.',
    confirmLabel: 'To confirm, type DELETE REFVIEW', deleteError: 'Could not delete the account. Sign in again if your session is no longer recent.',
    busy: 'Working…',
  },
} as const;

export function AccountPanel({ locale, state, canAttach, googleConfigured }: {
  locale: Locale; state: AccountState; canAttach: boolean; googleConfigured: boolean;
}) {
  const t = copy[locale];
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState('');

  function run(operation: () => Promise<unknown>, errorMessage: string) {
    setMessage('');
    startTransition(async () => {
      try {
        await operation();
        window.location.reload();
      } catch { setMessage(errorMessage); }
    });
  }

  async function login() {
    setMessage('');
    try {
      const response = await fetch(`/api/auth/sign-in/social?locale=${locale}`, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: 'google' }),
      });
      if (!response.ok) throw new Error('Google sign-in unavailable');
      const result: unknown = await response.json();
      const value = typeof result === 'object' && result !== null && 'url' in result
        ? result.url : null;
      if (typeof value !== 'string') throw new Error('Google sign-in unavailable');
      const url = new URL(value);
      if (url.protocol !== 'https:' || url.hostname !== 'accounts.google.com') {
        throw new Error('Google sign-in unavailable');
      }
      window.location.assign(url.href);
    } catch { setMessage(t.loginError); }
  }

  return <section className="rv-profile__owner" aria-labelledby="account-heading">
    <h2 id="account-heading">{t.heading}</h2>
    {state === 'unavailable' ? <><p>{t.unavailable}</p>
        <button type="button" disabled={pending}
          onClick={() => run(() => forgetInvalidAccountSession({}), t.recoverError)}>{t.recover}</button></>
      : state === 'missing' ? googleConfigured
        ? <button type="button" disabled={pending} onClick={() => void login()}>{t.login}</button>
        : <p>{t.pendingSetup}</p>
        : <>
          <p>{t.active}</p>
          {canAttach && <><p>{t.attachBody}</p><button type="button" disabled={pending}
            onClick={() => run(() => attachCurrentAnonymousData({}), t.attachError)}>{t.attach}</button></>}
          <button type="button" disabled={pending}
            onClick={() => run(() => logoutCurrentAccount({}), t.logoutError)}>{t.logout}</button>
          <div><p>{t.deleteBody}</p><label>{t.confirmLabel}
            <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off" spellCheck={false}/></label>
            <button type="button" disabled={pending || confirmation !== 'DELETE REFVIEW'}
              onClick={() => run(() => deleteCurrentAccount({ confirmation }), t.deleteError)}>{t.delete}</button>
          </div>
        </>}
    <p role="status" aria-live="polite">{pending ? t.busy : message}</p>
  </section>;
}
