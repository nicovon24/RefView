'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { SiteHeader } from '@/components/site/SiteHeader';
import type { Locale } from '@/lib/i18n/locale';
import { AccountPanel, type AccountState } from './AccountPanel';
import { OwnerSessionPanel, type OwnerSessionState } from './OwnerSessionPanel';
import { unsaveSavedAcademyLesson } from './saved-academy-actions';
import type { listSavedAcademyLessons } from './saved-academy-service';
import { defaultPreferences, effectiveReducedMotion, parsePreferences, readDevicePreferences, resetDevicePreferences, writeDevicePreferences, type DevicePreferences } from './device-preferences';
import './profile.css';

const copy = {
  es: {
    title: 'Tu perfil', intro: 'Ajustá cómo querés explorar RefView. Estas preferencias se guardan únicamente en este navegador.',
    preferences: 'Preferencias', language: 'Idioma', camera: 'Cámara', mode: 'Vista', third: 'Tercera persona', first: 'Primera persona',
    distance: 'Distancia de cámara', lateral: 'Desplazamiento lateral', sceneDefault: 'Predeterminado de cada escena', meters: 'm',
    input: 'Entrada', sensitivity: 'Sensibilidad del mouse', invert: 'Invertir eje vertical',
    display: 'Pantalla y movimiento', motion: 'Movimiento reducido', os: 'Seguir el sistema', yes: 'Sí', no: 'No',
    quality: 'Calidad gráfica', high: 'Alta', low: 'Baja', motionEffective: 'Movimiento reducido efectivo',
    reset: 'Restablecer preferencias locales', saved: 'Guardado en este navegador.', defaults: 'Usando valores predeterminados; todavía no hay preferencias guardadas.', resetDone: 'Preferencias locales restablecidas.', unsaved: 'No se pudo acceder al almacenamiento. Los cambios actuales no sobrevivirán a una recarga.',
    savedContent: 'Contenido guardado', savedEmpty: 'Todavía no hay contenido guardado disponible en este perfil.',
    scope: 'Alcance y eliminación', scopeBody: 'Estas preferencias son solo de este perfil de navegador. No se sincronizan entre dispositivos. Restablecerlas elimina la clave local; borrar los datos del sitio también las elimina.',
    note: 'La vista de controles toma estas preferencias al abrirse. La prueba local del incidente todavía no las usa; sin un valor elegido, cada escena conserva su encuadre predeterminado.',
  },
  en: {
    title: 'Your profile', intro: 'Choose how you want to explore RefView. These preferences are saved in this browser only.',
    preferences: 'Preferences', language: 'Language', camera: 'Camera', mode: 'View', third: 'Third person', first: 'First person',
    distance: 'Camera distance', lateral: 'Lateral offset', sceneDefault: 'Each scene’s default', meters: 'm',
    input: 'Input', sensitivity: 'Mouse sensitivity', invert: 'Invert vertical axis',
    display: 'Display and motion', motion: 'Reduced motion', os: 'Follow system', yes: 'Yes', no: 'No',
    quality: 'Graphics quality', high: 'High', low: 'Low', motionEffective: 'Effective reduced motion',
    reset: 'Reset local preferences', saved: 'Saved in this browser.', defaults: 'Using defaults; no preferences have been saved yet.', resetDone: 'Local preferences reset.', unsaved: 'Storage is unavailable. Current changes will not survive a reload.',
    savedContent: 'Saved content', savedEmpty: 'There is no saved content available in this profile yet.',
    scope: 'Scope and deletion', scopeBody: 'These preferences belong only to this browser profile. They do not sync across devices. Reset removes the local key; clearing site data removes it too.',
    note: 'The controls preview reads these preferences when it opens. The local incident playtest does not use them yet; without a chosen value, each scene keeps its default framing.',
  },
} as const;

const distances = Array.from({ length: 13 }, (_, index) => 2 + index * 0.5);
const lateralPositions = Array.from({ length: 13 }, (_, index) => -3 + index * 0.5);
const sensitivities = Array.from({ length: 19 }, (_, index) => Number((0.2 + index * 0.1).toFixed(1)));

type SavedLessons = Awaited<ReturnType<typeof listSavedAcademyLessons>>;
const savedCopy = {
  es: { missing: 'Iniciá una sesión privada para guardar lecciones de la Academia.',
    unavailable: 'No podemos consultar tus lecciones guardadas ahora.',
    empty: 'Todavía no guardaste ninguna lección.', browse: 'Explorar la Academia',
    version: 'Versión', available: 'Disponible', retired: 'Retirada',
    unavailableItem: 'No disponible', generic: 'Lección guardada',
    open: 'Abrir lección', remove: 'Quitar de guardados', removing: 'Quitando…',
    removeError: 'No se pudo quitar la lección. Volvé a intentarlo.',
    sessionScope: 'Las lecciones guardadas pertenecen a esta sesión privada y vencen con ella.',
    accountScope: 'Las lecciones vinculadas se conservan en tu cuenta hasta que la elimines.',
    unknownScope: 'No podemos confirmar ahora el estado de los datos guardados.' },
  en: { missing: 'Start a private session to save Academy lessons.',
    unavailable: 'We cannot load your saved lessons right now.',
    empty: 'You have not saved any lessons yet.', browse: 'Explore the Academy',
    version: 'Version', available: 'Available', retired: 'Retired',
    unavailableItem: 'Unavailable', generic: 'Saved lesson',
    open: 'Open lesson', remove: 'Remove saved lesson', removing: 'Removing…',
    removeError: 'Could not remove the lesson. Try again.',
    sessionScope: 'Saved lessons belong to this private session and expire with it.',
    accountScope: 'Linked lessons remain in your account until you delete it.',
    unknownScope: 'We cannot confirm the saved data status right now.' },
} as const;

function SavedAcademyPanel({ locale, result, accountState }: { locale: Locale;
  result: SavedLessons; accountState: AccountState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const t = savedCopy[locale];

  function remove(lessonId: string, version: number) {
    setError('');
    startTransition(async () => {
      try {
        await unsaveSavedAcademyLesson({ lessonId, version });
        router.refresh();
      } catch {
        setError(t.removeError);
      }
    });
  }

  return <section className="rv-profile__saved" aria-labelledby="saved-academy-heading">
    <h2 id="saved-academy-heading">{locale === 'es' ? 'Contenido guardado' : 'Saved content'}</h2>
    {result.kind === 'missing' ? <p>{t.missing}</p>
      : result.kind === 'unavailable' ? <p role="status">{t.unavailable}</p>
        : result.lessons.length === 0 ? <p>{t.empty} <Link href={`/${locale}/academy`}>{t.browse}</Link></p>
          : <ul className="rv-profile__saved-list">{result.lessons.map((item) => <li key={`${item.lessonId}:${item.version}`}>
            <strong>{item.state === 'available' ? item.lesson?.title : t.generic}</strong>
            <span>{t.version} {item.version} · {item.state === 'available' ? t.available : item.state === 'retired' ? t.retired : t.unavailableItem}</span>
            <div className="rv-profile__saved-actions">
              {item.state === 'available' && item.lesson && <Link href={`/${locale}/academy/${encodeURIComponent(item.lessonId)}?version=${item.version}`}>{t.open}</Link>}
              <button type="button" disabled={pending} onClick={() => remove(item.lessonId, item.version)}>{pending ? t.removing : t.remove}</button>
            </div>
          </li>)}</ul>}
    <p className="rv-profile__saved-error" role="status" aria-live="polite">{error}</p>
    <p className="rv-profile__saved-scope">{accountState === 'active' ? t.accountScope
      : accountState === 'unavailable' ? t.unknownScope : t.sessionScope}</p>
  </section>;
}

export function ProfilePage({ locale, ownerSession, savedLessons,
  accountState, googleConfigured }:
  { locale: Locale; ownerSession: OwnerSessionState; savedLessons: SavedLessons;
    accountState: AccountState; googleConfigured: boolean }) {
  const router = useRouter();
  const t = copy[locale];
  const [preferences, setPreferences] = useState<DevicePreferences>({ ...defaultPreferences, locale });
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState<'defaults' | 'saved' | 'reset' | 'unsaved'>('defaults');
  const [osReducedMotion, setOsReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    queueMicrotask(() => {
      if (cancelled) return;
      const result = readDevicePreferences();
      setPreferences(result.preferences);
      setStorageAvailable(result.available);
      setSaveState(result.available ? result.stored ? 'saved' : 'defaults' : 'unsaved');
      setOsReducedMotion(query.matches);
      setReady(true);
    });
    const update = () => setOsReducedMotion(query.matches);
    query.addEventListener('change', update);
    return () => { cancelled = true; query.removeEventListener('change', update); };
  }, [locale]);

  function update(patch: Partial<DevicePreferences>) {
    const next = parsePreferences({ ...preferences, ...patch });
    setPreferences(next);
    const saved = writeDevicePreferences(next);
    setStorageAvailable(saved);
    setSaveState(saved ? 'saved' : 'unsaved');
    if (patch.locale && patch.locale !== locale) router.push(`/${patch.locale}/profile`);
  }

  function reset() {
    setPreferences({ ...defaultPreferences });
    const cleared = resetDevicePreferences();
    setStorageAvailable(cleared);
    setSaveState(cleared ? 'reset' : 'unsaved');
  }

  return <div className="rv-profile">
    <a className="rv-profile__skip" href="#profile-title">{locale === 'es' ? 'Ir al contenido' : 'Skip to content'}</a>
    <SiteHeader locale={locale} active="profile" />
    <main className="rv-profile__main">
      <div className="rv-profile__hero"><p className="rv-profile__eyebrow">REFVIEW / PROFILE</p><h1 id="profile-title">{t.title}</h1><p>{t.intro}</p></div>
      <div className="rv-profile__layout">
        <section className="rv-profile__panel" aria-labelledby="preferences-heading">
          <h2 id="preferences-heading">{t.preferences}</h2>
          <p className="rv-profile__notice">{t.note}</p>
          <fieldset><legend>{t.language}</legend><div className="rv-profile__choices">
            <button type="button" className={locale === 'es' ? 'is-selected' : ''} aria-pressed={locale === 'es'} onClick={() => update({ locale: 'es' })}>Español</button>
            <button type="button" className={locale === 'en' ? 'is-selected' : ''} aria-pressed={locale === 'en'} onClick={() => update({ locale: 'en' })}>English</button>
          </div></fieldset>
          <fieldset><legend>{t.camera}</legend><div className="rv-profile__fields">
            <label>{t.mode}<select value={preferences.cameraMode} onChange={(event) => update({ cameraMode: event.target.value as DevicePreferences['cameraMode'] })}><option value="thirdPerson">{t.third}</option><option value="firstPerson">{t.first}</option></select></label>
            <label>{t.distance}<select value={preferences.cameraDistanceM ?? ''} onChange={(event) => update({ cameraDistanceM: event.target.value === '' ? null : Number(event.target.value) })}><option value="">{t.sceneDefault}</option>{distances.map((value) => <option key={value} value={value}>{value} {t.meters}</option>)}</select></label>
            <label>{t.lateral}<select value={preferences.cameraLateralM ?? ''} onChange={(event) => update({ cameraLateralM: event.target.value === '' ? null : Number(event.target.value) })}><option value="">{t.sceneDefault}</option>{lateralPositions.map((value) => <option key={value} value={value}>{value} {t.meters}</option>)}</select></label>
          </div></fieldset>
          <fieldset><legend>{t.input}</legend><div className="rv-profile__fields">
            <label>{t.sensitivity}<select value={preferences.mouseSensitivity} onChange={(event) => update({ mouseSensitivity: Number(event.target.value) })}>{sensitivities.map((value) => <option key={value} value={value}>{value.toFixed(1)}×</option>)}</select></label>
            <label className="rv-profile__check"><input type="checkbox" checked={preferences.invertY} onChange={(event) => update({ invertY: event.target.checked })}/>{t.invert}</label>
          </div></fieldset>
          <fieldset><legend>{t.display}</legend><div className="rv-profile__fields">
            <label>{t.motion}<select value={preferences.reducedMotion === null ? 'os' : String(preferences.reducedMotion)} onChange={(event) => update({ reducedMotion: event.target.value === 'os' ? null : event.target.value === 'true' })}><option value="os">{t.os}</option><option value="true">{t.yes}</option><option value="false">{t.no}</option></select></label>
            <p className="rv-profile__hint">{t.motionEffective}: {effectiveReducedMotion(preferences.reducedMotion, osReducedMotion) ? t.yes : t.no}{preferences.reducedMotion === null ? ` (${t.os})` : ''}</p>
            <label>{t.quality}<select value={preferences.quality} onChange={(event) => update({ quality: event.target.value as DevicePreferences['quality'] })}><option value="high">{t.high}</option><option value="low">{t.low}</option></select></label>
          </div></fieldset>
          <div className="rv-profile__footer"><button type="button" onClick={reset}>{t.reset}</button><p role="status">{ready ? !storageAvailable ? t.unsaved : saveState === 'saved' ? t.saved : saveState === 'reset' ? t.resetDone : t.defaults : ''}</p></div>
        </section>
        <aside className="rv-profile__aside">
          <AccountPanel locale={locale} state={accountState}
            canAttach={ownerSession.status === 'active'} googleConfigured={googleConfigured} />
          {accountState === 'missing' && <OwnerSessionPanel locale={locale} initialState={ownerSession} />}
          <SavedAcademyPanel locale={locale} result={savedLessons} accountState={accountState} />
          <section><h2>{t.scope}</h2><p>{t.scopeBody}</p></section>
        </aside>
      </div>
    </main>
  </div>;
}
