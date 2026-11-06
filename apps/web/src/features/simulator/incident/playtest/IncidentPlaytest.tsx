'use client';

import Link from 'next/link';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { compileCanonicalScenarioSourceV2 } from '@refview/content';
import type { ViewSample } from '@refview/simulation';
import type { Locale } from '@/lib/i18n/locale';
import { createExactSceneRenderer, type SceneActor } from './exact-scene';
import { createIncidentEnvironment, mountIncidentEnvironment } from '../environment';
import { createRiggedSceneActor } from '../../rigged-player/scene-actor';
import { buildPublicLocomotionPlan } from '../../rigged-player/pose/locomotion';
import { loadVerifiedPlayerResources, type VerifiedPlayerResources } from '../../rigged-player/resources';
import { createRiggedReferee } from '../../rigged-player/referee';
import { incidentThirdPersonCameraDefaults } from '../incident-camera-defaults';
import { createLocalIncidentController, type ActiveSurface, type LocalIncidentController, type LocalLifecycle } from './live-controller';
import { createPublicPlayback } from './public-playback';
import { requestEntryCapabilities } from './entry-flow';
import './incident-playtest.css';

type PlayableScenarioV2 = ReturnType<typeof compileCanonicalScenarioSourceV2>['playable'];
type VisualModule = { samplePlayerGeometry?: (pose: unknown) => unknown; samplePose?: (phaseQ: number) => unknown };
type LoadedAssets = { modules: Map<string, unknown>; resources: VerifiedPlayerResources };
function initialCameraChoice(): Pick<ViewSample, 'cameraMode' | 'cameraDistanceM' | 'cameraLateralOffsetM'> {
  return { cameraMode: 'thirdPerson' as const,
    cameraDistanceM: incidentThirdPersonCameraDefaults.distance,
    cameraLateralOffsetM: incidentThirdPersonCameraDefaults.lateral };
}
const copy = {
  es: { title: 'Incidente 001 · prueba local', warning: 'Prueba local sin guardar ni puntuar. Esta jugada todavía no está publicada para entrenamiento.', loading: 'Verificando módulos visuales…', error: 'No se pudieron verificar o mostrar los módulos visuales.', ready: 'Listo para jugar', playing: 'En juego', paused: 'En pausa', sealed: 'Recorrido terminado', failed: 'Error del recorrido', start: 'Iniciar con mouse', resume: 'Reanudar con mouse', restart: 'Reiniciar', retry: 'Reintentar carga', fullscreen: 'Pantalla completa', exitFullscreen: 'Salir de pantalla completa', pause: 'Pausar', first: 'Primera persona', third: 'Detrás del árbitro', camera: 'Cámara', distance: 'Distancia', lateral: 'Desplazamiento lateral', tick: 'Tick', receipts: 'Fotogramas exactos', breaks: 'Pausas', hint: 'WASD mueve, Shift corre, mouse mira, Esc pausa.', desktop: 'Esta prueba 3D requiere una pantalla y controles de escritorio. Abrila en una computadora con teclado y mouse para jugar el incidente.', back: 'Volver a controles', adjustments: 'Ajustes de cámara', technical: 'Detalles técnicos', progress: 'Progreso del recorrido', pointerDenied: 'El navegador no permitió capturar el mouse. Hacé clic en Iniciar con mouse para reintentar; revisá los permisos del sitio si persiste.', fullscreenDenied: 'El navegador no pudo cambiar a pantalla completa. Podés jugar en esta ventana y volver a intentarlo desde la pausa.' },
  en: { title: 'Incident 001 · local playtest', warning: 'Local playtest: unsaved and unscored. This incident is not published for training yet.', loading: 'Verifying visual modules…', error: 'The visual modules could not be verified or displayed.', ready: 'Ready to play', playing: 'Playing', paused: 'Paused', sealed: 'Run complete', failed: 'Run error', start: 'Start with mouse', resume: 'Resume with mouse', restart: 'Restart', retry: 'Retry loading', fullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen', pause: 'Pause', first: 'First person', third: 'Behind referee', camera: 'Camera', distance: 'Distance', lateral: 'Lateral offset', tick: 'Tick', receipts: 'Exact frames', breaks: 'Pauses', hint: 'WASD moves, Shift sprints, mouse looks, Esc pauses.', desktop: 'This 3D playtest needs a desktop screen, keyboard, and mouse. Open it on a computer to play the incident.', back: 'Back to controls', adjustments: 'Camera adjustments', technical: 'Technical details', progress: 'Run progress', pointerDenied: 'The browser blocked mouse capture. Click Start with mouse to try again; check site permissions if it continues.', fullscreenDenied: 'The browser could not change fullscreen mode. You can play in this window and retry from the pause menu.' },
} as const;

async function verifyModules(playable: PlayableScenarioV2, signal: AbortSignal): Promise<Map<string, unknown>> {
  const modules = new Map<string, unknown>();
  for (const asset of playable.assetManifest) {
    signal.throwIfAborted();
    if (asset.kind !== 'proceduralModule' || !/^\/assets\/asset-00[1-4]\.mjs$/.test(asset.neutralClientPath)) throw new Error('unexpected visual asset');
    const response = await fetch(asset.neutralClientPath, { cache: 'no-store', signal });
    if (!response.ok) throw new Error('visual asset unavailable');
    const bytes = await response.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    const hash = `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
    if (hash !== asset.sha256) throw new Error('visual asset digest mismatch');
    const url = URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' }));
    try {
      const visualModule = await import(/* webpackIgnore: true */ url) as VisualModule;
      if (typeof visualModule.samplePlayerGeometry !== 'function' && typeof visualModule.samplePose !== 'function') throw new Error('invalid visual module');
      modules.set(asset.assetHandle, visualModule);
    } finally { URL.revokeObjectURL(url); }
  }
  return modules;
}

function Scene({ playable, assets, controller, onUpdate, onError }: { playable: PlayableScenarioV2; assets: LoadedAssets; controller: LocalIncidentController; onUpdate: () => void; onError: () => void }) {
  const { modules, resources } = assets;
  const locomotion = useMemo(() => buildPublicLocomotionPlan(playable.actors, 60), [playable]);
  const { scene, camera, gl } = useThree();
  const rendererRef = useRef<ReturnType<typeof createExactSceneRenderer> | null>(null);
  useEffect(() => {
    const existing = new Set(scene.children);
    const environment = createIncidentEnvironment();
    const unmountEnvironment = mountIncidentEnvironment(scene, environment);
    const actors = new Map<string, SceneActor>();
    const ownedPlayers: ReturnType<typeof createRiggedSceneActor>[] = [];
    try {
      for (const actor of playable.actors[0]!.actors) {
        const nodes = createRiggedSceneActor(actor.actorHandle, resources, locomotion[actor.actorHandle]);
        ownedPlayers.push(nodes); actors.set(actor.actorHandle, nodes); scene.add(nodes.root);
      }
    } catch (error) {
      console.error('Incident player creation failed', error);
      for (const actor of ownedPlayers) { scene.remove(actor.root); actor.dispose(); }
      unmountEnvironment();
      onError();
      return;
    }
    let referee: ReturnType<typeof createRiggedReferee>;
    try { referee = createRiggedReferee(resources); }
    catch (error) {
      console.error('Incident referee creation failed', error);
      for (const actor of ownedPlayers) { scene.remove(actor.root); actor.dispose(); }
      unmountEnvironment();
      onError();
      return;
    }
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), new THREE.MeshStandardMaterial({ color: '#f7f7ef' })); ball.castShadow = true; scene.add(ball);
    scene.add(referee.root);
    const attached = scene.children.filter((node) => !existing.has(node));
    rendererRef.current = createExactSceneRenderer({ scene, camera: camera as THREE.PerspectiveCamera,
      gl, actors, ball, referee, rigBindings: new Map(playable.actorRigBindings.map((item) =>
        [item.actorHandle, item.rigAssetHandle])), modules });
    return () => {
      rendererRef.current = null;
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      for (const node of attached) {
        if (node === environment.root) continue;
        scene.remove(node);
        if (ownedPlayers.some((actor) => actor.root === node)) continue;
        if (node === referee.root) { referee.dispose(); continue; }
        node.traverse((part) => {
          if (!(part instanceof THREE.Mesh)) return;
          geometries.add(part.geometry);
          for (const material of Array.isArray(part.material) ? part.material : [part.material]) materials.add(material);
        });
      }
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();
      for (const actor of ownedPlayers) actor.dispose();
      unmountEnvironment();
    };
  }, [scene, camera, gl, playable, modules, resources, locomotion, onError]);
  const playback = useMemo(() => createPublicPlayback(playable), [playable]);
  const lastReport = useRef(0);
  useFrame(() => {
    try {
      const render = rendererRef.current;
      if (!render) return;
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const aspect = rect.width / rect.height;
      if (aspect < 0.75 || aspect > 2.5) return;
      const surface: ActiveSurface = { documentVisible: !document.hidden, pointerLocked: document.pointerLockElement === gl.domElement, focused: document.hasFocus() };
      if (controller.state === 'playing' && Math.abs(aspect - controller.currentView.viewportAspectRatio) > 1e-6) {
        controller.setViewport(aspect);
        if (surface.pointerLocked) void document.exitPointerLock();
      }
      if (controller.state === 'playing') controller.frame(Math.round(performance.now() * 1000), surface, render, () => { void document.exitPointerLock(); });
      else render({ tick: controller.currentTick, view: { ...controller.currentView, viewportAspectRatio: aspect },
        world: playback.fixture.snapshot(controller.currentTick), refereeMotion: controller.currentRefereeMotion });
      const now = performance.now();
      if (now - lastReport.current > 100 || controller.state !== 'playing') { lastReport.current = now; onUpdate(); }
    } catch (error) { console.error('Incident playtest render failed', error); onError(); if (document.pointerLockElement === gl.domElement) void document.exitPointerLock(); }
  }, 1);
  return null;
}

export function IncidentPlaytest({ locale, playable }: { locale: Locale; playable: PlayableScenarioV2 }) {
  const t = copy[locale];
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [failed, setFailed] = useState(false);
  const [, setFailureDetail] = useState('');
  const [loadRevision, setLoadRevision] = useState(0);
  const [desktop, setDesktop] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const [apiIssue, setApiIssue] = useState<'pointer' | 'fullscreen' | null>(null);
  const [controller, setController] = useState<LocalIncidentController | null>(null);
  const [state, setState] = useState<LocalLifecycle>('loading');
  const [entryPending, setEntryPending] = useState(false);
  const [entered, setEntered] = useState(false);
  const [cameraChoice, setCameraChoice] = useState(() => initialCameraChoice());
  const [tick, setTick] = useState(0);
  const sceneError = useCallback(() => {
    setFailureDetail('Scene render failed'); setFailed(true); setState('error');
    if (document.pointerLockElement) void document.exitPointerLock();
  }, []);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageRef = useRef<HTMLElement | null>(null);
  const controllerRef = useRef<LocalIncidentController | null>(null);
  const pendingRef = useRef(false);
  const enteredRef = useRef(false);
  const menuOpenRef = useRef(false);
  const lastInputUs = useRef(0);
  const inputTime = () => { const us = Math.round(performance.now() * 1000); lastInputUs.current = Math.max(us, lastInputUs.current + 1); return lastInputUs.current; };
  const update = () => { const run = controllerRef.current; if (!run) return; setState(run.state); setTick(run.currentTick); };
  const surface = (canvas: HTMLCanvasElement): ActiveSurface => ({ documentVisible: !document.hidden, pointerLocked: document.pointerLockElement === canvas, focused: document.hasFocus() });
  useEffect(() => { const query = window.matchMedia('(min-width: 701px)'); const change = () => setDesktop(query.matches); change(); query.addEventListener('change', change); return () => query.removeEventListener('change', change); }, []);
  useEffect(() => {
    setFullscreenSupported(Boolean(document.fullscreenEnabled && stageRef.current?.requestFullscreen));
    const sync = () => {
      const active = document.fullscreenElement === stageRef.current;
      setFullscreen(active);
      if (active) setApiIssue((issue) => issue === 'fullscreen' ? null : issue);
      if (!active && enteredRef.current && !pendingRef.current && controllerRef.current?.state === 'playing' && canvasRef.current) {
        controllerRef.current.suspend({ ...surface(canvasRef.current), pointerLocked: false });
        if (document.pointerLockElement === canvasRef.current) void document.exitPointerLock();
        update();
      }
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  useEffect(() => {
    let active = true;
    let failedLoad = false;
    let loaded: VerifiedPlayerResources | null = null;
    const abort = new AbortController();
    const rig = loadVerifiedPlayerResources({ signal: abort.signal }).then((value) => {
      loaded = value;
      if (!active || failedLoad) value.dispose();
      return value;
    });
    void Promise.all([verifyModules(playable, abort.signal), rig]).then(([modules, resources]) => {
      if (active) setAssets({ modules, resources });
    }).catch((error) => {
      failedLoad = true;
      abort.abort();
      loaded?.dispose();
      if (active) {
        console.error('Incident playtest asset verification failed', error);
        setFailureDetail(String(error)); setFailed(true); setState('error');
      }
    });
    return () => { active = false; abort.abort(); loaded?.dispose(); };
  }, [playable, loadRevision]);
  const createRun = (canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    if (!Number.isFinite(aspect) || aspect < 0.75 || aspect > 2.5) { setFailureDetail(`Canvas aspect ${aspect}`); setFailed(true); setState('error'); return null; }
    const initialView: ViewSample = { tick: 0, refereePosition: { ...playable.initialRefereePose.position }, lookYaw: playable.initialRefereePose.lookYaw, lookPitch: playable.initialRefereePose.lookPitch, ...initialCameraChoice(), viewportAspectRatio: aspect, verticalFovRad: 50 * Math.PI / 180 };
    const run = createLocalIncidentController({ source: playable, initialView, scenarioContentHash: playable.contentHash });
    run.ready(); controllerRef.current = run; setController(run); setState('ready'); setTick(0);
    return run;
  };
  useEffect(() => {
    if (!controller || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const sync = () => {
      if (pendingRef.current || !enteredRef.current) return;
      const current = surface(canvas);
      if (controller.state === 'playing' && (!current.documentVisible || !current.pointerLocked || !current.focused)) { menuOpenRef.current = true; controller.suspend(current); }
      else if (!menuOpenRef.current && (controller.state === 'ready' || controller.state === 'paused') && current.documentVisible && current.pointerLocked && current.focused) {
        const stamp = inputTime();
        if (controller.state === 'ready') controller.start(stamp, current); else controller.resume(stamp, current);
        setApiIssue((issue) => issue === 'pointer' ? null : issue);
      }
      update();
    };
    const key = (event: KeyboardEvent) => {
      if (event.code === 'KeyM' && !event.repeat && controller.state === 'playing') {
        event.preventDefault();
        menuOpenRef.current = true;
        controller.suspend({ ...surface(canvas), pointerLocked: false });
        update();
        if (document.pointerLockElement === canvas) void document.exitPointerLock();
        return;
      }
      if (event.code === 'Escape') {
        if (controller.state === 'playing') { menuOpenRef.current = true; controller.suspend({ ...surface(canvas), pointerLocked: false }); update(); }
        if (document.pointerLockElement === canvas) void document.exitPointerLock();
        return;
      }
      if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(event.code) || controller.state !== 'playing') return;
      event.preventDefault(); controller.key(event.code, event.type === 'keydown', inputTime());
    };
    const mouse = (event: MouseEvent) => { if (controller.state === 'playing' && surface(canvas).pointerLocked) controller.mouse(event.movementX, event.movementY, inputTime()); };
    const resize = () => {
      if (pendingRef.current) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) { if (controller.state === 'playing') controller.suspend({ ...surface(canvas), focused: false }); update(); return; }
      const aspect = rect.width / rect.height;
      if (controller.state === 'playing' || controller.state === 'paused') {
        try { controller.setViewport(aspect); if (controller.state === 'paused' && document.pointerLockElement === canvas) void document.exitPointerLock(); update(); }
        catch (error) { setFailureDetail(String(error)); setFailed(true); setState('error'); }
      }
    };
    const pointerError = () => { if (!pendingRef.current) setApiIssue('pointer'); };
    document.addEventListener('pointerlockchange', sync); document.addEventListener('pointerlockerror', pointerError);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('blur', sync); window.addEventListener('focus', sync); window.addEventListener('resize', resize);
    window.addEventListener('keydown', key); window.addEventListener('keyup', key); window.addEventListener('mousemove', mouse);
    if (pendingRef.current && enteredRef.current && controllerRef.current === controller) {
      pendingRef.current = false;
      setEntryPending(false);
    }
    sync();
    return () => { document.removeEventListener('pointerlockchange', sync); document.removeEventListener('pointerlockerror', pointerError); document.removeEventListener('visibilitychange', sync); window.removeEventListener('blur', sync); window.removeEventListener('focus', sync); window.removeEventListener('resize', resize); window.removeEventListener('keydown', key); window.removeEventListener('keyup', key); window.removeEventListener('mousemove', mouse); };
  }, [controller]);
  const acquire = () => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || failed || pendingRef.current || (state !== 'ready' && state !== 'paused')) return;
    menuOpenRef.current = false;
    setApiIssue(null);
    void requestEntryCapabilities(
      () => canvas.requestPointerLock(),
      () => {
        if (document.fullscreenElement === stage || !fullscreenSupported) return;
        return stage.requestFullscreen();
      },
    ).then((result) => {
      if (result.pointer === 'denied' || document.pointerLockElement !== canvas) { menuOpenRef.current = true; setApiIssue('pointer'); }
      else if (result.fullscreen === 'denied') setApiIssue('fullscreen');
    });
  };
  const enter = () => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage || failed || pendingRef.current || state !== 'ready') return;
    pendingRef.current = true; menuOpenRef.current = false; setEntryPending(true); setApiIssue(null);
    void requestEntryCapabilities(
      () => canvas.requestPointerLock(),
      () => { if (!document.fullscreenEnabled || !stage.requestFullscreen) throw new Error('fullscreen unavailable'); return stage.requestFullscreen(); },
    ).then(async (result) => {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (canvasRef.current !== canvas || !stage.isConnected) return;
      const run = createRun(canvas);
      if (!run) { if (document.pointerLockElement === canvas) void document.exitPointerLock(); return; }
      enteredRef.current = true; setEntered(true);
      if (result.pointer === 'denied' || document.pointerLockElement !== canvas) setApiIssue('pointer');
      else if (result.fullscreen === 'denied') setApiIssue('fullscreen');
      // The controller effect starts the new run once its scene and listeners have committed.
    }).catch((error) => { setFailureDetail(String(error)); setFailed(true); setState('error'); pendingRef.current = false; setEntryPending(false); });
  };
  const changeCamera = (change: Parameters<LocalIncidentController['setCamera']>[0]) => { if (!controller) return; controller.setCamera(change); setCameraChoice((prior) => ({ ...prior, ...change })); update(); };
  const restart = () => {
    if (!canvasRef.current) return;
    if (document.pointerLockElement === canvasRef.current) void document.exitPointerLock();
    menuOpenRef.current = true;
    setCameraChoice(initialCameraChoice());
    setApiIssue(null); createRun(canvasRef.current);
  };
  const retry = () => {
    if (document.pointerLockElement) void document.exitPointerLock();
    canvasRef.current = null; controllerRef.current = null; setController(null); setAssets(null);
    setFailed(false); setFailureDetail(''); setApiIssue(null); setState('loading');
    setTick(0); setEntered(false); enteredRef.current = false; pendingRef.current = false; menuOpenRef.current = false; setEntryPending(false);
    setCameraChoice(initialCameraChoice());
    setLoadRevision((revision) => revision + 1);
  };
  const toggleFullscreen = () => {
    if (!stageRef.current || !fullscreenSupported) return;
    try { const request = document.fullscreenElement === stageRef.current ? document.exitFullscreen() : stageRef.current.requestFullscreen(); void Promise.resolve(request).catch(() => setApiIssue('fullscreen')); }
    catch { setApiIssue('fullscreen'); }
  };
  const stateLabel = failed ? t.failed : entryPending ? (locale === 'es' ? 'Preparando cancha…' : 'Preparing field…') : state === 'playing' ? t.playing : state === 'paused' ? t.paused : state === 'sealed' ? t.sealed : t.ready;
  const menuVisible = desktop && !entryPending && !failed && state !== 'playing' && state !== 'loading';
  return <main className="playtest-page">
    <h1 className="playtest-sr-only">{t.title}</h1>
    <section className="playtest-stage" ref={stageRef} aria-label={t.title}>
      {assets && !failed && desktop && <div className="playtest-canvas"><Canvas key={loadRevision} shadows camera={{ position: [0, 2, 20], fov: 50, near: 1.1, far: 160 }} dpr={[1, 1.5]} onCreated={({ gl }) => { canvasRef.current = gl.domElement; createRun(gl.domElement); }}>{controller && <Scene playable={playable} assets={assets} controller={controller} onUpdate={update} onError={sceneError} />}</Canvas></div>}
      {!desktop ? <div className="playtest-panel playtest-mobile"><strong>{t.desktop}</strong><p>{t.warning}</p><Link href={`/${locale}/simulator/incident-preview`}>{locale === 'es' ? 'Ver el incidente' : 'View incident'}</Link></div> : failed || !assets ? <div className="playtest-panel" role={failed ? 'alert' : 'status'}><strong>{failed ? t.failed : t.loading}</strong>{failed && <><p>{t.error}</p><button type="button" onClick={retry}>{t.retry}</button><Link href={`/${locale}`}>{locale === 'es' ? 'Volver' : 'Return'}</Link></>}</div> : entryPending ? <div className="playtest-panel" role="status"><strong>{stateLabel}</strong></div> : menuVisible ? <div className="playtest-panel playtest-menu" role="region" aria-label={stateLabel}>
        <span className="playtest-kicker">{locale === 'es' ? 'VISTA PREVIA LOCAL' : 'LOCAL PREVIEW'}</span>
        <strong>{!entered ? t.title : stateLabel}</strong>
        <p>{t.warning} {locale === 'es' ? 'Nuevo aspecto de jugadores pendiente de calibración visual.' : 'New player appearance awaiting visual calibration.'}</p>
        {!entered && <p>{locale === 'es' ? 'WASD para moverte. Shift para correr. Mouse para mirar. M abre el menú; Esc pausa.' : 'WASD to move. Shift to sprint. Mouse to look. M opens the menu; Esc pauses.'}</p>}
        {apiIssue && <p className="playtest-api-issue" role="alert">{apiIssue === 'pointer' ? t.pointerDenied : t.fullscreenDenied}</p>}
        <div className="playtest-buttons">
          {!entered && <button className="playtest-primary" type="button" onClick={enter}>{locale === 'es' ? 'Entrar a la cancha' : 'Enter the field'}</button>}
          {entered && (state === 'ready' || state === 'paused') && <button className="playtest-primary" type="button" onClick={acquire}>{state === 'paused' ? t.resume : t.start}</button>}
          {entered && <button type="button" onClick={restart}>{t.restart}</button>}
          {entered && state !== 'sealed' && <button type="button" onClick={() => changeCamera({ cameraMode: cameraChoice.cameraMode === 'firstPerson' ? 'thirdPerson' : 'firstPerson' })}>{t.camera}: {cameraChoice.cameraMode === 'firstPerson' ? t.first : t.third}</button>}
          {entered && fullscreenSupported && <button type="button" aria-pressed={fullscreen} onClick={toggleFullscreen}>{fullscreen ? t.exitFullscreen : t.fullscreen}</button>}
          {entered && <Link className="playtest-button-link" href={`/${locale}`}>{locale === 'es' ? 'Volver' : 'Return'}</Link>}
        </div>
        {entered && state !== 'sealed' && <details className="playtest-advanced"><summary>{t.adjustments}</summary><div className="playtest-sliders"><label>{t.distance}: {cameraChoice.cameraDistanceM.toFixed(1)} m<input type="range" min="2" max="8" step="0.5" value={cameraChoice.cameraDistanceM} onChange={(event) => changeCamera({ cameraDistanceM: Number(event.target.value) })} /></label><label>{t.lateral}: {cameraChoice.cameraLateralOffsetM.toFixed(1)} m<input type="range" min="-3" max="3" step="0.5" value={cameraChoice.cameraLateralOffsetM} onChange={(event) => changeCamera({ cameraLateralOffsetM: Number(event.target.value) })} /></label></div></details>}
        {entered && <p className="playtest-progress">{t.progress}: <span data-testid="playtest-tick">{tick}</span> / 480</p>}
      </div> : null}
      {state === 'playing' && !failed && <div className="playtest-playing-labels"><span>{locale === 'es' ? 'VISTA PREVIA LOCAL' : 'LOCAL PREVIEW'}</span><span>{locale === 'es' ? 'M: menú · Esc: pausa' : 'M: menu · Esc: pause'}</span>{apiIssue === 'fullscreen' && <span className="playtest-playing-issue" role="alert">{t.fullscreenDenied}</span>}</div>}
    </section>
  </main>;
}
