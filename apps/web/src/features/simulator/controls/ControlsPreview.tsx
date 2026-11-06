'use client';

import Link from 'next/link';
import { SiteHeader } from '@/components/site/SiteHeader';
import { Canvas, useFrame } from '@react-three/fiber';
import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import * as THREE from 'three';
import type { Locale } from '@/lib/i18n/locale';
import { advanceFrame, cameraPose, initialPose, lookPose, type CameraSettings, type Movement, type Pose } from './controls';
import { effectiveReducedMotion, readDevicePreferences } from '@/features/profile/device-preferences';
import './controls.css';

type Phase = 'loading' | 'ready' | 'playing' | 'paused' | 'focus' | 'released' | 'error';
const labels = {
  es: {
    skip: 'Saltar al contenido',
    title: 'Controles de cancha', preview: 'Vista técnica de controles', disclosure: 'Campo neutro de prueba. Sin incidente, observación evaluada, decisión, repetición ni intento guardado.',
    enter: 'Entrar al campo', resume: 'Retomar', pause: 'Pausar', help: 'Ayuda', settings: 'Ajustes', back: 'Inicio',
    ready: 'Listo para entrar', playing: 'Control activo', paused: 'En pausa', focus: 'Se perdió el foco', released: 'Puntero liberado', loading: 'Cargando campo 3D…', error: 'No se pudo mostrar el campo 3D. Recargá para reintentar.', unsupported: 'WebGL no está disponible en este navegador.',
    instruction: 'WASD para moverte · Shift para correr · Mouse para mirar · Esc para soltar el puntero',
    camera: 'Cámara', third: 'Detrás del árbitro', first: 'Primera persona', distance: 'Distancia', lateral: 'Encuadre lateral', sensitivity: 'Sensibilidad', invert: 'Invertir eje Y', reduced: 'Reducir movimiento', quality: 'Calidad', low: 'Baja', high: 'Alta',
    close: 'Cerrar', helpTitle: 'Cómo moverte', helpBody: 'Hacé clic en Entrar al campo. Movete con WASD, corré con Shift y mirá con el mouse. C cambia la cámara. P o Esc pausa. Si salís de la ventana, retomá desde el botón.',
    mobile: 'Para mover al árbitro en este campo neutro necesitás una computadora con teclado y mouse. Todavía no hay controles táctiles.', location: 'Posición', pointer: 'El puntero se captura al entrar y se libera al pausar.',
    intro: 'Un campo neutro para probar desplazamiento, mirada y encuadre. No reproduce la jugada del incidente.', incidentLink: 'Revisar incidente 3D', playtestLink: 'Abrir prueba local', mobileTitle: 'Controles de escritorio',
  },
  en: {
    skip: 'Skip to content',
    title: 'Pitch controls', preview: 'Technical controls preview', disclosure: 'Neutral test field. No authored incident, scored observation, decision, replay, or saved attempt.',
    enter: 'Enter field', resume: 'Resume', pause: 'Pause', help: 'Help', settings: 'Settings', back: 'Home',
    ready: 'Ready to enter', playing: 'Controls active', paused: 'Paused', focus: 'Window focus lost', released: 'Pointer released', loading: 'Loading 3D field…', error: 'The 3D field could not be shown. Reload to retry.', unsupported: 'WebGL is unavailable in this browser.',
    instruction: 'WASD to move · Shift to sprint · Mouse to look · Esc to release the pointer',
    camera: 'Camera', third: 'Behind referee', first: 'First person', distance: 'Distance', lateral: 'Lateral framing', sensitivity: 'Sensitivity', invert: 'Invert Y axis', reduced: 'Reduce motion', quality: 'Quality', low: 'Low', high: 'High',
    close: 'Close', helpTitle: 'How to move', helpBody: 'Select Enter field. Move with WASD, sprint with Shift, and look with the mouse. C switches camera. P or Esc pauses. If you leave the window, resume with the button.',
    mobile: 'Moving the referee on this neutral field requires a desktop keyboard and mouse. Touch controls are not available yet.', location: 'Position', pointer: 'The pointer is captured when entering and released when paused.',
    intro: 'A neutral field for testing movement, looking around, and framing. It does not play the incident.', incidentLink: 'Review 3D incident', playtestLink: 'Open local playtest', mobileTitle: 'Desktop controls',
  },
} as const;

class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Stripe({ x, z, width, depth }: { x: number; z: number; width: number; depth: number }) {
  return <mesh position={[x, 0.025, z]}><boxGeometry args={[width, 0.012, depth]} /><meshBasicMaterial color="#dce8cf" /></mesh>;
}

function Pitch() {
  return <>
    <color attach="background" args={['#10251e']} />
    <ambientLight intensity={1.6} />
    <directionalLight position={[18, 30, 12]} intensity={2.4} />
    <mesh position={[0, -0.045, 0]}><boxGeometry args={[112, 0.08, 75]} /><meshStandardMaterial color="#132e23" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[105, 68]} /><meshStandardMaterial color="#2e6142" roughness={1} /></mesh>
    {[-52.5, 52.5].map((x) => <Stripe key={x} x={x} z={0} width={0.11} depth={68} />)}
    {[-34, 34].map((z) => <Stripe key={z} x={0} z={z} width={105} depth={0.11} />)}
    <Stripe x={0} z={0} width={0.11} depth={68} />
    <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[9.08, 9.18, 96]} /><meshBasicMaterial color="#dce8cf" /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <Stripe x={side * 44.25} z={-20.16} width={16.5} depth={0.11} />
      <Stripe x={side * 44.25} z={20.16} width={16.5} depth={0.11} />
      <Stripe x={side * 36} z={0} width={0.11} depth={40.32} />
      <Stripe x={side * 49.75} z={-9.16} width={5.5} depth={0.11} />
      <Stripe x={side * 49.75} z={9.16} width={5.5} depth={0.11} />
      <Stripe x={side * 47} z={0} width={0.11} depth={18.32} />
    </group>)}
  </>;
}

function MovingScene({ poseRef, movementRef, settings, active, reducedMotion, onPose }: { poseRef: RefObject<Pose>; movementRef: RefObject<Movement>; settings: CameraSettings; active: boolean; reducedMotion: boolean; onPose: (pose: Pose) => void }) {
  const marker = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const remaining = useRef(0);
  useFrame(({ camera }, delta) => {
    if (active) {
      const next = advanceFrame(poseRef.current, movementRef.current, remaining.current, delta);
      poseRef.current = next.pose;
      remaining.current = next.remainingSeconds;
      elapsed.current += delta;
      if (elapsed.current > 0.12) { onPose(poseRef.current); elapsed.current = 0; }
    } else remaining.current = 0;
    if (marker.current) { marker.current.position.set(poseRef.current.x, 0, poseRef.current.z); marker.current.rotation.y = poseRef.current.yaw; marker.current.visible = settings.mode === 'thirdPerson'; }
    const view = cameraPose(poseRef.current, settings);
    const desired = new THREE.Vector3(...view.position);
    if (reducedMotion) camera.position.copy(desired);
    else camera.position.lerp(desired, 1 - Math.exp(-delta * 11));
    camera.lookAt(...view.target);
  });
  return <>
    <Pitch />
    <group ref={marker}>
      <mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.23, 0.28, 1.15, 12]} /><meshStandardMaterial color="#101b19" /></mesh>
      <mesh position={[0, 1.62, 0]}><sphereGeometry args={[0.19, 12, 10]} /><meshStandardMaterial color="#c6a482" /></mesh>
      <mesh position={[0, 0.34, -0.13]}><boxGeometry args={[0.1, 0.68, 0.11]} /><meshStandardMaterial color="#101b19" /></mesh>
      <mesh position={[0, 0.34, 0.13]}><boxGeometry args={[0.1, 0.68, 0.11]} /><meshStandardMaterial color="#101b19" /></mesh>
    </group>
  </>;
}

const emptyMovement: Movement = { forward: false, backward: false, left: false, right: false, sprint: false };

export function ControlsPreview({ locale }: { locale: Locale }) {
  const t = labels[locale];
  const [phase, setPhase] = useState<Phase>('loading');
  const [supported, setSupported] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<CameraSettings>({ mode: 'thirdPerson', distance: 4, lateral: 0 });
  const [sensitivity, setSensitivity] = useState(1);
  const [invertY, setInvertY] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [quality, setQuality] = useState<'low' | 'high'>('high');
  const [panel, setPanel] = useState<'help' | 'settings' | null>(null);
  const [displayPose, setDisplayPose] = useState<Pose>(initialPose);
  const poseRef = useRef<Pose>(initialPose);
  const movementRef = useRef<Movement>(emptyMovement);
  const motionTouchedRef = useRef(false);
  const canvasHost = useRef<HTMLDivElement>(null);
  const active = phase === 'playing';

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => {
      if (motionTouchedRef.current) return;
      const { preferences } = readDevicePreferences();
      setReducedMotion(effectiveReducedMotion(preferences.reducedMotion, motionQuery.matches));
    };
    const frame = window.requestAnimationFrame(() => {
      const probe = document.createElement('canvas');
      setSupported(Boolean(probe.getContext('webgl2') || probe.getContext('webgl')));
      const { preferences } = readDevicePreferences();
      setSettings({ mode: preferences.cameraMode, distance: preferences.cameraDistanceM ?? 4, lateral: preferences.cameraLateralM ?? 0 });
      setSensitivity(preferences.mouseSensitivity);
      setInvertY(preferences.invertY);
      setReducedMotion(effectiveReducedMotion(preferences.reducedMotion, motionQuery.matches));
      setQuality(preferences.quality);
    });
    motionQuery.addEventListener('change', syncMotion);
    return () => { window.cancelAnimationFrame(frame); motionQuery.removeEventListener('change', syncMotion); };
  }, []);

  useEffect(() => {
    const clear = () => { movementRef.current = emptyMovement; };
    const onLock = () => {
      if (document.pointerLockElement === canvasHost.current?.querySelector('canvas')) setPhase('playing');
      else { clear(); setPhase((current) => current === 'playing' ? 'released' : current); }
    };
    const onBlur = () => { clear(); setPhase((current) => current === 'playing' ? 'focus' : current); if (document.pointerLockElement) document.exitPointerLock(); };
    const onVisibility = () => { if (document.hidden) onBlur(); };
    document.addEventListener('pointerlockchange', onLock);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => { document.removeEventListener('pointerlockchange', onLock); window.removeEventListener('blur', onBlur); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent, pressed: boolean) => {
      const key = event.key.toLowerCase();
      if (key === 'p' && pressed && phase === 'playing') { movementRef.current = emptyMovement; document.exitPointerLock(); setPhase('paused'); return; }
      if (key === 'c' && pressed && phase === 'playing') { setSettings((old) => ({ ...old, mode: old.mode === 'thirdPerson' ? 'firstPerson' : 'thirdPerson' })); return; }
      if (phase !== 'playing') return;
      const map: Record<string, keyof Movement> = { w: 'forward', s: 'backward', a: 'left', d: 'right', shift: 'sprint' };
      const field = map[key];
      if (field) { event.preventDefault(); movementRef.current = { ...movementRef.current, [field]: pressed }; }
    };
    const down = (event: KeyboardEvent) => onKey(event, true);
    const up = (event: KeyboardEvent) => onKey(event, false);
    const mouse = (event: MouseEvent) => { if (phase === 'playing') poseRef.current = lookPose(poseRef.current, event.movementX, event.movementY, sensitivity, invertY); };
    document.addEventListener('keydown', down); document.addEventListener('keyup', up); document.addEventListener('mousemove', mouse);
    return () => { document.removeEventListener('keydown', down); document.removeEventListener('keyup', up); document.removeEventListener('mousemove', mouse); };
  }, [phase, sensitivity, invertY]);

  const enter = async () => {
    if (supported !== true || phase === 'loading' || phase === 'error') return;
    const canvas = canvasHost.current?.querySelector('canvas');
    if (!canvas) return;
    setPanel(null);
    try { await canvas.requestPointerLock(); setPhase('playing'); }
    catch { setPhase('released'); }
  };
  const pause = () => { movementRef.current = emptyMovement; if (document.pointerLockElement) document.exitPointerLock(); setPhase('paused'); };
  const togglePanel = (name: 'help' | 'settings') => { if (active) pause(); setPanel((old) => old === name ? null : name); };
  const status = supported === false ? t.unsupported : phase === 'loading' ? t.loading : phase === 'error' ? t.error : phase === 'focus' ? t.focus : phase === 'released' ? t.released : phase === 'paused' ? t.paused : phase === 'playing' ? t.playing : t.ready;

  return <main className="controls-page">
    <a className="controls-skip" href="#controls-title">{t.skip}</a>
    <SiteHeader locale={locale} active="controls" title={t.title} />
    <div className="controls-intro">
      <div><h1 id="controls-title" tabIndex={-1}>{t.title}</h1><p>{t.intro}</p></div>
      <div className="controls-quicklinks"><Link href={`/${locale}/simulator/incident-preview`}>{t.incidentLink}</Link><Link href={`/${locale}/simulator/incident-playtest`}>{t.playtestLink}</Link></div>
    </div>
    <aside className="controls-mobile" aria-labelledby="controls-mobile-title"><h2 id="controls-mobile-title">{t.mobileTitle}</h2><p>{t.mobile}</p><Link href={`/${locale}/simulator/incident-preview`}>{t.incidentLink}</Link></aside>
    <section className="controls-stage" id="controls-stage" tabIndex={-1} aria-label={t.title}>
      <div className="controls-viewport" ref={canvasHost}>
        {supported === true && <SceneBoundary onError={() => setPhase('error')}><div className="controls-canvas"><Canvas aria-label={t.preview} camera={{ position: [-22, 2.1, -8], fov: 70 }} dpr={quality === 'low' ? 1 : [1, 1.5]} onCreated={() => setPhase((current) => current === 'loading' ? 'ready' : current)}><MovingScene poseRef={poseRef} movementRef={movementRef} settings={settings} active={active} reducedMotion={reducedMotion} onPose={setDisplayPose} /></Canvas></div></SceneBoundary>}
        {supported === false && <div className="controls-fallback" role="alert">{t.unsupported}</div>}
        {supported !== false && (supported === null || phase === 'loading' || phase === 'error') && <div className="controls-fallback" role={phase === 'error' ? 'alert' : 'status'}>{status}</div>}
        <div className="controls-topline"><span className="controls-tag">{t.preview}</span><span className="controls-location">{t.location} {displayPose.x.toFixed(1)}, {displayPose.z.toFixed(1)} m</span></div>
        <div className="controls-crosshair" aria-hidden="true" />
        <div className="controls-bottomline"><span role="status" aria-live="polite" className={`controls-state controls-state--${phase}`}>{status}</span>{supported !== false && <span>{t.instruction}</span>}</div>
      </div>
      <div className="controls-actions">
        <button type="button" className="controls-primary" onClick={active ? pause : enter} disabled={supported !== true || phase === 'loading' || phase === 'error'}>{active ? t.pause : phase === 'ready' ? t.enter : t.resume}</button>
        <button type="button" onClick={() => togglePanel('help')} aria-expanded={panel === 'help'}>{t.help}</button>
        <button type="button" onClick={() => togglePanel('settings')} aria-expanded={panel === 'settings'}>{t.settings}</button>
        <span className="controls-camera-label">{t.camera}</span>
        <button type="button" onClick={() => setSettings((old) => ({ ...old, mode: old.mode === 'thirdPerson' ? 'firstPerson' : 'thirdPerson' }))}>{settings.mode === 'thirdPerson' ? t.third : t.first} / C</button>
      </div>
      {panel === 'help' && <div className="controls-panel"><h2>{t.helpTitle}</h2><p>{t.helpBody}</p><p>{t.pointer}</p><button type="button" onClick={() => setPanel(null)}>{t.close}</button></div>}
      {panel === 'settings' && <div className="controls-panel controls-settings"><h2>{t.settings}</h2>
        <label>{t.distance} <output>{settings.distance.toFixed(1)} m</output><input type="range" min="2" max="8" step="0.5" value={settings.distance} onChange={(e) => setSettings({ ...settings, distance: Number(e.target.value) })} /></label>
        <label>{t.lateral} <output>{settings.lateral.toFixed(1)} m</output><input type="range" min="-3" max="3" step="0.5" value={settings.lateral} onChange={(e) => setSettings({ ...settings, lateral: Number(e.target.value) })} /></label>
        <label>{t.sensitivity} <output>{sensitivity.toFixed(1)}</output><input type="range" min="0.2" max="2" step="0.1" value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} /></label>
        <label className="controls-check"><input type="checkbox" checked={invertY} onChange={(e) => setInvertY(e.target.checked)} />{t.invert}</label>
        <label className="controls-check"><input type="checkbox" checked={reducedMotion} onChange={(e) => { motionTouchedRef.current = true; setReducedMotion(e.target.checked); }} />{t.reduced}</label>
        <label>{t.quality}<select value={quality} onChange={(e) => setQuality(e.target.value as 'low' | 'high')}><option value="low">{t.low}</option><option value="high">{t.high}</option></select></label>
        <button type="button" onClick={() => setPanel(null)}>{t.close}</button>
      </div>}
    </section>
    <footer className="controls-footer"><p>{t.disclosure}</p><Link href={`/${locale}`}>{t.back}</Link></footer>
  </main>;
}
