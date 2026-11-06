'use client';

import Link from 'next/link';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { compileCanonicalScenarioSourceV2 } from '@refview/content';
import type { Locale } from '@/lib/i18n/locale';
import { cameraPose, type CameraSettings, type Pose } from '../controls/controls';
import { createIncidentEnvironment, mountIncidentEnvironment } from './environment';
import { applyAuthoringPlayerFrame, createPlayerModel, disposePlayerModel } from './player-model';
import { createRefereeModel, disposeRefereeModel } from './referee-model';
import { type ActorSceneNodes } from './playtest/exact-scene';
import { createRiggedSceneActor, playerVisualFrame } from '../rigged-player/scene-actor';
import { buildPublicLocomotionPlan, type LocomotionSample } from '../rigged-player/pose/locomotion';
import { loadVerifiedPlayerResources, type VerifiedPlayerResources } from '../rigged-player/resources';
import { createRiggedReferee } from '../rigged-player/referee';
import { stationaryRefereeMotion } from '../rigged-player/pose/referee-locomotion';
import { incidentThirdPersonCameraDefaults } from './incident-camera-defaults';
import type { ContactVisualization } from '../rigged-player/evidence/contact-visualization';
import { ContactDiagnosticOverlay } from './ContactDiagnosticOverlay';
import './incident.css';

type Playable = ReturnType<typeof compileCanonicalScenarioSourceV2>['playable'];
type Actor = Playable['actors'][number]['actors'][number];
type PoseSample = Readonly<{ leftLegPitchRad: number; rightLegPitchRad: number;
  leftArmPitchRad: number; rightArmPitchRad: number; torsoPitchRad: number }>;
type Point = Readonly<{ x: number; y: number; z: number }>;
type Segment = Readonly<{ start: Point; end: Point }>;
type JointName = 'hip' | 'spine' | 'neck' | 'head' | 'leftHip' | 'leftKnee' |
  'leftAnkle' | 'rightHip' | 'rightKnee' | 'rightAnkle' | 'leftShoulder' |
  'leftElbow' | 'leftWrist' | 'rightShoulder' | 'rightElbow' | 'rightWrist';
type SegmentName = 'torso' | 'neck' | 'leftThigh' | 'leftShin' | 'rightThigh' |
  'rightShin' | 'leftUpperArm' | 'leftForearm' | 'rightUpperArm' | 'rightForearm';
type RigModule = Readonly<{ samplePlayerGeometry: (pose: PoseSample) => {
  pose: PoseSample; joints: Record<JointName, Point>; segments: Record<SegmentName, Segment>;
  attachments: Record<string, Point>;
  parts: Record<string, { min: Point; max: Point }>;
} }>;
type ClipModule = Readonly<{ samplePose: (phaseQ: number) => PoseSample }>;
type Module = RigModule & ClipModule;

const copy = {
  es: { title: 'Incidente 001 · vista de autoría', warning: 'Vista local para revisar la evidencia visual. La jugada todavía no está aprobada para entrenamiento ni registra intentos.',
    play: 'Reproducir', pause: 'Pausar', reset: 'Reiniciar', contact: 'Ir al contacto', tick: 'Tick',
    camera: 'Cámara', first: 'Primera persona', third: 'Detrás del árbitro', position: 'Posición',
    positionA: 'Posición A', positionB: 'Posición B', passView: 'Revisar pase',
    passNotice: 'Vista elevada solo para revisar el pase; no cuenta como observación en vivo.',
    load: 'Cargando módulos 3D…',
    error: 'No se pudieron verificar los módulos visuales.', back: 'Volver a controles',
    frame: 'Fotograma canónico', mode: 'Modo de cámara', status: 'Estado', ready: 'Listo',
    instruction: 'Arrastrá el control de tick para revisar la jugada. Las posiciones A y B son candidatas para calibración.',
    enterFullscreen: 'Pantalla completa', exitFullscreen: 'Salir de pantalla completa',
    fullscreenUnavailable: 'La pantalla completa no está disponible en este navegador.',
    fullscreenError: 'No se pudo cambiar a pantalla completa. Intentá de nuevo.',
    authoring: 'Vista de autoría', transport: 'Reproducción', viewpoints: 'Puntos de vista',
    local: 'Vista previa · sin guardar', playing: 'En reproducción', timeline: 'Línea de tiempo', home: 'Inicio',
    playtest: 'Probar en la cancha', navigate: 'Navegación del simulador',
  },
  en: { title: 'Incident 001 · authoring preview', warning: 'Local visual evidence review. This incident is not yet approved for training and does not save attempts.',
    play: 'Play', pause: 'Pause', reset: 'Reset', contact: 'Go to contact', tick: 'Tick',
    camera: 'Camera', first: 'First person', third: 'Behind referee', position: 'Position',
    positionA: 'Position A', positionB: 'Position B', passView: 'Review pass',
    passNotice: 'Elevated authoring view of the pass; it does not count as live observation.',
    load: 'Loading 3D modules…',
    error: 'The visual modules could not be verified.', back: 'Back to controls',
    frame: 'Canonical frame', mode: 'Camera mode', status: 'Status', ready: 'Ready',
    instruction: 'Use the tick slider to inspect the play. Positions A and B are calibration candidates.',
    enterFullscreen: 'Fullscreen', exitFullscreen: 'Exit fullscreen',
    fullscreenUnavailable: 'Fullscreen is not available in this browser.',
    fullscreenError: 'Could not change fullscreen mode. Try again.',
    authoring: 'Authoring preview', transport: 'Playback', viewpoints: 'Viewpoints',
    local: 'Preview · unsaved', playing: 'Playing', timeline: 'Timeline', home: 'Home',
    playtest: 'Try on the pitch', navigate: 'Simulator navigation',
  },
} as const;

function sha256(buffer: ArrayBuffer): Promise<string> {
  return crypto.subtle.digest('SHA-256', buffer).then((digest) =>
    `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')}`);
}

async function loadModules(playable: Playable, signal: AbortSignal): Promise<Map<string, Module>> {
  const modules = new Map<string, Module>();
  for (const asset of playable.assetManifest) {
    signal.throwIfAborted();
    const response = await fetch(asset.neutralClientPath, { cache: 'no-store', signal });
    if (!response.ok) throw new Error(`visual module request failed: ${asset.assetHandle}`);
    const bytes = await response.arrayBuffer();
    if (await sha256(bytes) !== asset.sha256) throw new Error(`visual module digest mismatch: ${asset.assetHandle}`);
    const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' }));
    try {
      modules.set(asset.assetHandle, await import(/* webpackIgnore: true */ objectUrl) as Module);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  return modules;
}

function Pitch() {
  const { scene } = useThree();
  useLayoutEffect(() => mountIncidentEnvironment(scene, createIncidentEnvironment()), [scene]);
  return null;
}

type LoadedAssets = { modules: Map<string, Module>; resources: VerifiedPlayerResources };
type Appearance = 'rigged' | 'procedural';
type CloseContactPreset = 'close-defender' | 'close-attacker' | 'lateral-left' | 'lateral-right';
type DiagnosticCamera = Readonly<{ position: [number, number, number]; target: [number, number, number] }>;

function lateralCamera(row: ContactVisualization['rows'][number], side: 'left' | 'right'): DiagnosticCamera | null {
  const horizontalAxis = Math.hypot(row.axis.x, row.axis.z);
  if (horizontalAxis < 1e-6) return null;
  const midpoint = {
    x: (row.defender.point.x + row.attacker.point.x) / 2,
    y: (row.defender.point.y + row.attacker.point.y) / 2,
    z: (row.defender.point.z + row.attacker.point.z) / 2,
  };
  const direction = side === 'left' ? 1 : -1;
  return {
    position: [midpoint.x - direction * 1.5 * row.axis.z / horizontalAxis,
      0.6, midpoint.z + direction * 1.5 * row.axis.x / horizontalAxis],
    target: [midpoint.x, midpoint.y, midpoint.z],
  };
}

function Player({ actor, tick, rig, clip, resources, actorPlan, appearance, onError }: { actor: Actor; tick: number; rig: RigModule;
  clip: ClipModule; resources: VerifiedPlayerResources; actorPlan: readonly LocomotionSample[];
  appearance: Appearance; onError: (failed: boolean) => void }) {
  const { scene } = useThree();
  const nodes = useRef<ActorSceneNodes | ReturnType<typeof createRiggedSceneActor> | null>(null);
  useLayoutEffect(() => {
    let model: ActorSceneNodes | ReturnType<typeof createRiggedSceneActor>;
    try {
      model = appearance === 'rigged' ? createRiggedSceneActor(actor.actorHandle, resources, actorPlan) : createPlayerModel(actor.actorHandle);
    } catch (error) { console.error('Incident player creation failed', error); onError(true); return; }
    nodes.current = model;
    scene.add(model.root);
    return () => { scene.remove(model.root); nodes.current = null;
      if ('kind' in model) model.dispose(); else disposePlayerModel(model.root); };
  }, [scene, actor.actorHandle, resources, actorPlan, appearance, onError]);
  useLayoutEffect(() => {
    if (!nodes.current) return;
    try {
      if ('kind' in nodes.current) nodes.current.applyFrame(playerVisualFrame(tick, actor));
      else applyAuthoringPlayerFrame(nodes.current, actor, rig, clip);
    } catch (error) { console.error('Incident player pose failed', error); onError(true); }
  }, [actor, tick, rig, clip, appearance, onError]);
  return null;
}

function Scene({ playable, assets, tick, pose, settings, passReview, closeContactPreset, diagnosticCamera, appearance, contactRow, renderKey, onError, onRendered }: { playable: Playable;
  assets: LoadedAssets; tick: number; pose: Pose; settings: CameraSettings;
  passReview: boolean; closeContactPreset: CloseContactPreset | null; diagnosticCamera: DiagnosticCamera | null; appearance: Appearance;
  contactRow?: ContactVisualization['rows'][number]; renderKey: string;
  onError: (failed: boolean) => void; onRendered: () => void }) {
  const { modules, resources } = assets;
  const locomotion = useMemo(() => buildPublicLocomotionPlan(playable.actors, 60), [playable]);
  const lastRenderedKey = useRef<string | null>(null);
  const bindings = useMemo(() => new Map(playable.actorRigBindings.map((binding) =>
    [binding.actorHandle, binding.rigAssetHandle])), [playable]);
  const referee = useRef<THREE.Group | ReturnType<typeof createRiggedReferee> | null>(null);
  const { scene } = useThree();
  useLayoutEffect(() => {
    let model: THREE.Group | ReturnType<typeof createRiggedReferee>;
    try { model = appearance === 'rigged' ? createRiggedReferee(resources) : createRefereeModel(); }
    catch (error) { console.error('Incident referee creation failed', error); onError(true); return; }
    referee.current = model;
    const root = 'applyFrame' in model ? model.root : model;
    scene.add(root);
    return () => { scene.remove(root); referee.current = null;
      if ('applyFrame' in model) model.dispose(); else disposeRefereeModel(model); };
  }, [scene, appearance, resources, onError]);
  useFrame(({ camera }) => {
    if (camera instanceof THREE.PerspectiveCamera) {
      const near = closeContactPreset ? 0.05 : 1.1;
      if (camera.near !== near) {
        camera.near = near;
        camera.updateProjectionMatrix();
      }
    }
    if (passReview) {
      camera.position.set(2, 11, 24);
      camera.lookAt(10, 0, 30);
      if (referee.current) {
        if ('applyFrame' in referee.current) referee.current.applyFrame({ tick,
          position: { x: pose.x, y: 0, z: pose.z }, lookYaw: pose.yaw,
          cameraMode: settings.mode, elevatedReview: true, motion: stationaryRefereeMotion(tick) });
        else referee.current.visible = false;
      }
      return;
    }
    const view = closeContactPreset?.startsWith('lateral-') && diagnosticCamera
      ? diagnosticCamera : cameraPose(pose, settings);
    camera.position.set(...view.position);
    camera.lookAt(...view.target);
    if (referee.current) {
      if ('applyFrame' in referee.current) referee.current.applyFrame({ tick,
        position: { x: pose.x, y: 0, z: pose.z }, lookYaw: pose.yaw,
        cameraMode: settings.mode, elevatedReview: false, motion: stationaryRefereeMotion(tick) });
      else {
        referee.current.position.set(pose.x, 0, pose.z);
        referee.current.rotation.set(0, pose.yaw, 0);
        referee.current.visible = settings.mode === 'thirdPerson';
      }
    }
  });
  return <>
    <Pitch />
    {playable.actors[tick]!.actors.map((actor) => {
      const rig = modules.get(bindings.get(actor.actorHandle) ?? '');
      const clip = modules.get(actor.clipHandle);
      if (!rig?.samplePlayerGeometry || !clip?.samplePose) return null;
      return <Player key={actor.actorHandle} actor={actor} tick={tick} rig={rig} clip={clip}
        resources={resources} actorPlan={locomotion[actor.actorHandle]!} appearance={appearance} onError={onError} />;
    })}
    {contactRow && <ContactDiagnosticOverlay row={contactRow} compact={Boolean(closeContactPreset)} />}
    <mesh castShadow position={Object.values(playable.ball[tick]!.ball.position) as [number, number, number]}
      onAfterRender={() => {
        if (lastRenderedKey.current !== renderKey) {
          lastRenderedKey.current = renderKey;
          queueMicrotask(onRendered);
        }
      }}>
      <sphereGeometry args={[0.11, 16, 12]} /><meshStandardMaterial color="#f7f7ef" /></mesh>
  </>;
}

export function IncidentPreview({ locale, playable, initialTick, initialCamera, contactDiagnostic }: {
  locale: Locale; playable: Playable; initialTick: number;
  initialCamera: 'firstPerson' | 'thirdPerson'; contactDiagnostic?: ContactVisualization;
}) {
  const t = copy[locale];
  const [assets, setAssets] = useState<LoadedAssets | null>(null);
  const [loadRevision, setLoadRevision] = useState(0);
  const [appearance, setAppearance] = useState<Appearance>('rigged');
  const [sceneReady, setSceneReady] = useState(false);
  const [renderReceipt, setRenderReceipt] = useState<string | null>(null);
  const [markers, setMarkers] = useState(false);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(initialTick);
  const [playing, setPlaying] = useState(false);
  const [passReview, setPassReview] = useState(false);
  const [closeContactPreset, setCloseContactPreset] = useState<CloseContactPreset | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const focusReviewOnOpen = useRef(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(true);
  const [fullscreenError, setFullscreenError] = useState(false);
  const [camera, setCamera] = useState<CameraSettings>({ mode: initialCamera, ...incidentThirdPersonCameraDefaults });
  const [pose, setPose] = useState<Pose>({ x: playable.initialRefereePose.position.x,
    z: playable.initialRefereePose.position.z, yaw: playable.initialRefereePose.lookYaw,
    pitch: playable.initialRefereePose.lookPitch });
  const contactAt366 = contactDiagnostic?.rows.find((row) => row.tick === 366);
  const diagnosticCamera = closeContactPreset === 'lateral-left' || closeContactPreset === 'lateral-right'
    ? contactAt366 ? lateralCamera(contactAt366, closeContactPreset === 'lateral-left' ? 'left' : 'right') : null
    : null;
  const presetName = passReview ? 'pass' : closeContactPreset ?? (pose.x === 6 && pose.z === 32 ? 'A' :
    pose.x === 12 && pose.z === 26.5 ? 'B' : 'custom');
  const contactRow = markers && appearance === 'rigged' && !passReview
    ? contactDiagnostic?.rows.find((row) => row.tick === tick) : undefined;
  const receipt = JSON.stringify({ tick, preset: presetName, camera: passReview ? 'elevated' :
    closeContactPreset?.startsWith('lateral-') ? closeContactPreset : camera.mode,
    markers: Boolean(contactRow), appearance });
  const receiptReady = sceneReady && renderReceipt === receipt;

  useLayoutEffect(() => {
    if (reviewOpen && focusReviewOnOpen.current) {
      reviewRef.current?.focus();
      focusReviewOnOpen.current = false;
    }
  }, [reviewOpen]);

  useEffect(() => {
    let active = true;
    let failedLoad = false;
    let loaded: VerifiedPlayerResources | null = null;
    const controller = new AbortController();
    const rig = loadVerifiedPlayerResources({ signal: controller.signal }).then((value) => {
      loaded = value;
      if (!active || failedLoad) value.dispose();
      return value;
    });
    void Promise.all([loadModules(playable, controller.signal), rig]).then(([modules, resources]) => {
      if (active) setAssets({ modules, resources });
    }).catch(() => { failedLoad = true; controller.abort(); loaded?.dispose(); if (active) setError(true); });
    return () => { active = false; controller.abort(); loaded?.dispose(); };
  }, [playable, loadRevision]);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let last = performance.now();
    let remainder = 0;
    const advance = (now: number) => {
      remainder += Math.min(100, now - last) * 0.06;
      last = now;
      const steps = Math.floor(remainder);
      remainder -= steps;
      if (steps > 0) setTick((current) => {
        const next = Math.min(480, current + steps);
        if (next === 480) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const toggleReview = (event: KeyboardEvent) => {
      if (event.code === 'KeyM' && !event.repeat && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        setReviewOpen((open) => !open);
        setPlaying(false);
      }
      if (event.code === 'Escape') setReviewOpen(false);
    };
    document.addEventListener('keydown', toggleReview);
    return () => document.removeEventListener('keydown', toggleReview);
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      setFullscreen(document.fullscreenElement === viewportRef.current);
      setFullscreenError(false);
    };
    const reportFullscreenError = () => setFullscreenError(true);
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.fullscreenElement === viewportRef.current) {
        void document.exitFullscreen().catch(reportFullscreenError);
      }
    };
    setFullscreenSupported(Boolean(document.fullscreenEnabled && viewportRef.current?.requestFullscreen));
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('fullscreenerror', reportFullscreenError);
    document.addEventListener('keydown', exitOnEscape);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('fullscreenerror', reportFullscreenError);
      document.removeEventListener('keydown', exitOnEscape);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      setFullscreenError(false);
      if (document.fullscreenElement === viewportRef.current) {
        await document.exitFullscreen();
      } else {
        await viewportRef.current?.requestFullscreen();
      }
    } catch {
      setFullscreenError(true);
    }
  };

  const preset = (kind: 'A' | 'B') => {
    setPlaying(false);
    setPassReview(false);
    setCloseContactPreset(null);
    const point = kind === 'A' ? { x: 6, z: 32 } : { x: 12, z: 26.5 };
    const dx = 13.8 - point.x;
    const dz = 36.8 - point.z;
    setPose({ ...point, yaw: Math.atan2(dx, dz),
      pitch: Math.atan2(0.8 - 1.7, Math.hypot(dx, dz)) });
  };
  const closeContact = (side: 'defender' | 'attacker') => {
    const row = contactDiagnostic?.rows.find((candidate) => candidate.tick === 366);
    if (!row) return;
    const horizontalAxis = Math.hypot(row.axis.x, row.axis.z);
    if (horizontalAxis < 1e-6) return;
    const midpoint = {
      x: (row.defender.point.x + row.attacker.point.x) / 2,
      y: (row.defender.point.y + row.attacker.point.y) / 2,
      z: (row.defender.point.z + row.attacker.point.z) / 2,
    };
    const direction = side === 'defender' ? 1 : -1;
    const x = midpoint.x + direction * 1.8 * row.axis.x / horizontalAxis;
    const z = midpoint.z + direction * 1.8 * row.axis.z / horizontalAxis;
    setPlaying(false);
    setPassReview(false);
    setTick(366);
    setCamera((current) => ({ ...current, mode: 'firstPerson' }));
    setPose({ x, z, yaw: Math.atan2(midpoint.x - x, midpoint.z - z),
      pitch: Math.atan2(midpoint.y - 1.7, 1.8) });
    setCloseContactPreset(side === 'defender' ? 'close-defender' : 'close-attacker');
  };
  const lateralContact = (side: 'left' | 'right') => {
    if (!contactAt366 || !lateralCamera(contactAt366, side)) return;
    setPlaying(false);
    setPassReview(false);
    setTick(366);
    setCloseContactPreset(side === 'left' ? 'lateral-left' : 'lateral-right');
  };
  return <main className={`incident-page${reviewOpen ? ' is-review-open' : ''}`}>
    <a className="incident-skip" href="#incident-workspace" onClick={(event) => {
      event.preventDefault();
      if (reviewOpen) reviewRef.current?.focus();
      else focusReviewOnOpen.current = true;
      setReviewOpen(true);
      setPlaying(false);
    }}>{t.transport}</a>
    <h1 className="incident-page-title">{t.title}</h1>
    <div className="incident-viewport" ref={viewportRef}>
    <section className="incident-stage" aria-label={t.frame}>
      {assets && !error ? <div className="incident-canvas" data-scene-ready={sceneReady}
        data-render-receipt={receiptReady ? receipt : undefined}><Canvas shadows camera={{ position: [0, 2.1, 20], fov: 50, near: 1.1, far: 160 }} dpr={[1, 1.5]}>
        <Scene playable={playable} assets={assets} tick={tick} pose={pose}
          settings={camera} passReview={passReview} closeContactPreset={closeContactPreset} diagnosticCamera={diagnosticCamera}
          appearance={appearance} contactRow={contactRow} renderKey={receipt}
          onError={setError} onRendered={() => { setSceneReady(true); setRenderReceipt((current) => current === receipt ? current : receipt); }} />
      </Canvas></div> : <div className="incident-loading" role={error ? 'alert' : 'status'}>
        {error ? <>{t.error} <button type="button" onClick={() => { setPlaying(false); setAssets(null); setSceneReady(false); setError(false); setLoadRevision((value) => value + 1); }}>{locale === 'es' ? 'Reintentar carga' : 'Retry loading'}</button></> : t.load}</div>}
      <div className="incident-overlay"><span><span className={playing ? 'incident-state-dot is-playing' : 'incident-state-dot'} aria-hidden="true" />{playing ? t.playing : t.local}</span>
        <span>{passReview ? t.passView : closeContactPreset === 'lateral-left'
          ? (locale === 'es' ? 'Lateral izquierda' : 'Lateral left')
          : closeContactPreset === 'lateral-right' ? (locale === 'es' ? 'Lateral derecha' : 'Lateral right')
            : camera.mode === 'firstPerson' ? t.first : t.third}</span></div>
      <span className="incident-authoring-badge">{t.authoring}</span>
    </section>
    <button className="incident-review-toggle" type="button" aria-controls="incident-workspace" aria-expanded={reviewOpen}
      onClick={() => { setReviewOpen((open) => !open); setPlaying(false); }}>
      {reviewOpen ? (locale === 'es' ? 'Cerrar herramientas · M' : 'Close review tools · M') : (locale === 'es' ? 'Herramientas de revisión · M' : 'Review tools · M')}
    </button>
    <section id="incident-workspace" ref={reviewRef} className="incident-controls" aria-label={locale === 'es' ? 'Herramientas de revisión' : 'Review tools'} tabIndex={-1} hidden={!reviewOpen}>
      <p className="incident-warning"><span className="incident-warning-label">{t.authoring}</span>{t.warning} {locale === 'es' ? 'Nuevo aspecto de jugadores pendiente de calibración visual.' : 'New player appearance awaiting visual calibration.'}</p>
      <div className="incident-timeline">
        <div className="incident-timeline-heading"><label htmlFor="incident-timeline">{t.timeline}</label>
          <output htmlFor="incident-timeline" aria-live="off">{(tick / 60).toFixed(2)} <span>/ 8.00 s</span></output></div>
        <input id="incident-timeline" type="range" min="0" max="480" step="1" value={tick}
          aria-valuetext={`${t.tick} ${tick} / 480`}
          onChange={(event) => { setPlaying(false); setTick(Number(event.target.value)); }} />
      </div>
      <div className="incident-toolbar">
      <fieldset className="incident-buttons incident-transport"><legend>{t.transport}</legend>
        <button type="button" disabled={!assets || error} onClick={() => { if (!playing) setReviewOpen(false); setPlaying(!playing); }}>
          {playing ? t.pause : t.play}</button>
        <button type="button" onClick={() => { setPlaying(false); setPassReview(false); setCloseContactPreset(null); setTick(0);
          setCamera({ mode: initialCamera, ...incidentThirdPersonCameraDefaults }); }}>{t.reset}</button>
        <button type="button" onClick={() => { setPlaying(false); setPassReview(false); setTick(366); }}>{t.contact}</button>
      </fieldset>
      <fieldset className="incident-buttons incident-camera"><legend>{t.mode}</legend>
        <button type="button" onClick={() => {
          setPassReview(false);
          setCloseContactPreset(null);
          setCamera((old) => ({ ...old,
            mode: old.mode === 'firstPerson' ? 'thirdPerson' : 'firstPerson' }));
        }}>
          {t.camera}: {camera.mode === 'firstPerson' ? t.first : t.third}</button>
      </fieldset>
      <fieldset className="incident-buttons incident-views"><legend>{t.position}</legend>
        <button type="button" aria-pressed={!passReview && pose.x === 6 && pose.z === 32} onClick={() => preset('A')}>{t.positionA}</button>
        <button type="button" aria-pressed={!passReview && pose.x === 12 && pose.z === 26.5} onClick={() => preset('B')}>{t.positionB}</button>
      </fieldset>
      <fieldset className="incident-buttons"><legend>{locale === 'es' ? 'Apariencia' : 'Appearance'}</legend>
        <button type="button" aria-pressed={appearance === 'rigged'} onClick={() => setAppearance('rigged')}>{locale === 'es' ? 'Jugadores seleccionados' : 'Selected players'}</button>
        <button type="button" aria-pressed={appearance === 'procedural'} onClick={() => { setAppearance('procedural'); setMarkers(false); }}>{locale === 'es' ? 'Comparación anterior' : 'Previous comparison'}</button>
      </fieldset>
      <fieldset className="incident-buttons incident-pass"><legend>{t.authoring}</legend>
        <button type="button" aria-pressed={passReview} onClick={() => {
          setPlaying(false); setTick(120);
          setPassReview(true);
          setCloseContactPreset(null);
          setPose({ x: 0, z: 30, yaw: Math.PI / 2, pitch: Math.atan2(-0.9, 10) });
        }}>{t.passView}</button>
      </fieldset>
      {contactDiagnostic && <fieldset className="incident-buttons incident-diagnostic">
        <legend>{locale === 'es' ? 'Diagnóstico de contacto' : 'Contact diagnostic'}</legend>
        <button type="button" aria-pressed={closeContactPreset === 'close-defender'} onClick={() => closeContact('defender')}>
          {locale === 'es' ? 'Cerca desde el defensor' : 'Close defender side'}</button>
        <button type="button" aria-pressed={closeContactPreset === 'close-attacker'} onClick={() => closeContact('attacker')}>
          {locale === 'es' ? 'Cerca desde el atacante' : 'Close attacker side'}</button>
        <button type="button" aria-pressed={closeContactPreset === 'lateral-left'} onClick={() => lateralContact('left')}>
          {locale === 'es' ? 'Lateral izquierda' : 'Lateral left'}</button>
        <button type="button" aria-pressed={closeContactPreset === 'lateral-right'} onClick={() => lateralContact('right')}>
          {locale === 'es' ? 'Lateral derecha' : 'Lateral right'}</button>
        <button type="button" aria-pressed={markers} onClick={() => { setPlaying(false); setMarkers((value) => !value); }}>
          {locale === 'es' ? 'Marcas anatómicas' : 'Anatomy markers'}: {markers ? 'On' : 'Off'}</button>
        {([364, 366, 370, 371] as const).map((fixedTick) => <button key={fixedTick} type="button"
          onClick={() => { setPlaying(false); setPassReview(false); setTick(fixedTick); }}>
          {t.tick} {fixedTick}</button>)}
      </fieldset>}
      <div className="incident-buttons incident-display">
        <button type="button" disabled={!fullscreenSupported} aria-pressed={fullscreen}
          onClick={toggleFullscreen}>{fullscreen ? t.exitFullscreen : t.enterFullscreen}</button>
      </div>
      </div>
      <div className="incident-detail-row"><p>{passReview ? t.passNotice : t.instruction}</p>
        <span>{t.tick} <strong data-testid="incident-tick">{tick}</strong> / 480</span></div>
      {!fullscreenSupported && <p role="status">{t.fullscreenUnavailable}</p>}
      {fullscreenError && <p role="alert">{t.fullscreenError}</p>}
      <footer className="incident-footer"><Link href={`/${locale}`}>{t.home}</Link>
        <Link href={`/${locale}/simulator/controls`}>{t.back}</Link>
        <Link href={`/${locale}/simulator/incident-playtest`}>{t.playtest}</Link>
        <Link href="/es/simulator/incident-preview" lang="es" aria-label="Español">ES</Link>
        <Link href="/en/simulator/incident-preview" lang="en" aria-label="English">EN</Link></footer>
    </section>
    </div>
  </main>;
}
