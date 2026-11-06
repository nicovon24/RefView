'use client';

import Link from 'next/link';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { createRiggedPlayer, type KitStyle, type Silhouette } from '../rigged-player/model';
import type { Locale } from '@/lib/i18n/locale';
import './player-audition.css';

const assetRoot = '/assets/player-audition';
const motions = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop', 'Sprint_Loop'] as const;
type Motion = typeof motions[number];
type CameraView = 'match' | 'close' | 'front';
const copy = {
  es: {
    title: 'Prueba de personajes', intro: 'Compará las variantes del modelo articulado que se usa en la prueba local del incidente.',
    back: 'Volver al juego', distance: 'Cámara', close: 'Cerca', match: 'Distancia de juego', front: 'Frente',
    silhouette: 'Silueta', athletic: 'Deportiva', source: 'Original',
    kit: 'Camiseta', solid: 'Clásica', stripes: 'Rayas', sash: 'Banda',
    motions: { Idle_Loop: 'Quieto', Walk_Loop: 'Caminar', Jog_Fwd_Loop: 'Trote', Sprint_Loop: 'Correr' },
    note: 'Prototipo visual · camiseta y medias de color de prueba · sin efecto en la evaluación',
    loading: 'Cargando personajes y animaciones…', error: 'No se pudo cargar el modelo 3D.', retry: 'Reintentar',
  },
  en: {
    title: 'Player audition', intro: 'Compare variants of the rigged model used in the local incident playtest.',
    back: 'Back to playtest', distance: 'Camera', close: 'Close', match: 'Match distance', front: 'Front',
    silhouette: 'Silhouette', athletic: 'Athletic', source: 'Original',
    kit: 'Shirt', solid: 'Classic', stripes: 'Stripes', sash: 'Sash',
    motions: { Idle_Loop: 'Idle', Walk_Loop: 'Walk', Jog_Fwd_Loop: 'Jog', Sprint_Loop: 'Sprint' },
    note: 'Visual prototype · trial jersey and socks · no effect on evaluation',
    loading: 'Loading players and animations…', error: 'The 3D model could not be loaded.', retry: 'Retry',
  },
} as const;

class AuditionErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function Player({ position, color, number, motion, phase, silhouette, kitStyle, onReady }: { position: [number, number, number]; color: string; number: number; motion: Motion; phase: number; silhouette: Silhouette; kitStyle: KitStyle; onReady?: () => void }) {
  const model = useGLTF(`${assetRoot}/Superhero_Male_FullBody.gltf`);
  const hair = useGLTF(`${assetRoot}/hair/Hair_SimpleParted.gltf`);
  const animation = useGLTF(`${assetRoot}/UAL1_Standard.glb`);
  const player = useMemo(() => createRiggedPlayer({ bodyScene: model.scene, hairScene: hair.scene, color, number, silhouette, kitStyle }), [model.scene, hair.scene, color, number, silhouette, kitStyle]);
  const actor = player.root;
  const mixer = useMemo(() => new THREE.AnimationMixer(actor), [actor]);
  useEffect(() => { onReady?.(); }, [onReady]);
  useEffect(() => {
    const clip = animation.animations.find((candidate) => candidate.name === motion);
    if (!clip) return;
    const action = mixer.clipAction(clip);
    action.reset().play();
    action.time = phase;
    return () => { action.stop(); mixer.uncacheClip(clip); };
  }, [animation.animations, mixer, motion, phase]);
  useFrame((_, delta) => mixer.update(Math.min(delta, 0.05)));
  useEffect(() => () => player.dispose(), [player]);
  return <group position={position} rotation={[0, Math.PI, 0]}><primitive object={actor} dispose={null} /><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}><circleGeometry args={[0.38, 32]} /><meshBasicMaterial color="#123822" transparent opacity={0.24} depthWrite={false} /></mesh></group>;
}

function Scene({ motion, view, silhouette, kitStyle, onReady }: { motion: Motion; view: CameraView; silhouette: Silhouette; kitStyle: KitStyle; onReady: () => void }) {
  const position: [number, number, number] = view === 'front' ? [0, 1.85, -3.8] : view === 'close' ? [1.2, 1.8, 2.8] : [2.8, 2.6, 5.9];
  return <Canvas shadows dpr={[1, 1.75]} camera={{ position, fov: 43 }}>
    <color attach="background" args={['#0b1e1a']} />
    <ambientLight intensity={1.1} />
    <hemisphereLight args={['#d9edff', '#33563b', 1.3]} />
    <directionalLight position={[4, 8, 5]} intensity={2.1} castShadow shadow-mapSize={[1024, 1024]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[20, 16]} /><meshStandardMaterial color="#4a9263" roughness={1} /></mesh>
    {Array.from({ length: 9 }, (_, index) => <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003 + index * 0.0001, index - 4]}><planeGeometry args={[20, 0.48]} /><meshBasicMaterial color={index % 2 ? '#81bb7b' : '#2f7f52'} transparent opacity={0.08} depthWrite={false} /></mesh>)}
    <Suspense fallback={null}>
      <Player position={[-1.55, 0, 0]} color="#1d5ab2" number={7} motion={motion} phase={0} silhouette={silhouette} kitStyle={kitStyle} />
      <Player position={[0, 0, -0.3]} color="#d4ba3c" number={9} motion={motion} phase={0.32} silhouette={silhouette} kitStyle={kitStyle} onReady={onReady} />
      <Player position={[1.55, 0, 0]} color="#1d5ab2" number={11} motion={motion} phase={0.7} silhouette={silhouette} kitStyle={kitStyle} />
    </Suspense>
    <OrbitControls target={[0, 1.05, 0]} enablePan={false} minDistance={3} maxDistance={18} maxPolarAngle={Math.PI / 2.05} />
  </Canvas>;
}

export function PlayerAudition({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [motion, setMotion] = useState<Motion>('Jog_Fwd_Loop');
  const [view, setView] = useState<CameraView>('match');
  const [silhouette, setSilhouette] = useState<Silhouette>('athletic');
  const [kitStyle, setKitStyle] = useState<KitStyle>('solid');
  const [ready, setReady] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const markReady = useCallback(() => setReady(true), []);
  const retry = () => {
    useGLTF.clear(`${assetRoot}/Superhero_Male_FullBody.gltf`);
    useGLTF.clear(`${assetRoot}/hair/Hair_SimpleParted.gltf`);
    useGLTF.clear(`${assetRoot}/UAL1_Standard.glb`);
    setReady(false);
    setRetryKey((value) => value + 1);
  };
  return <main className="audition-page">
    <header className="audition-header"><Link href={`/${locale}/simulator/incident-playtest`}>← {t.back}</Link><span>REFVIEW / 3D</span></header>
    <div className="audition-copy"><h1>{t.title}</h1><p>{t.intro}</p></div>
    <section className="audition-stage" aria-label={t.title}>
      <AuditionErrorBoundary key={retryKey} fallback={<div className="audition-stage-message" role="alert"><p>{t.error}</p><button type="button" onClick={retry}>{t.retry}</button></div>}>
        <Scene key={view} motion={motion} view={view} silhouette={silhouette} kitStyle={kitStyle} onReady={markReady} />
        {!ready && <div className="audition-stage-message" role="status">{t.loading}</div>}
      </AuditionErrorBoundary>
    </section>
    <div className="audition-toolbar"><div className="audition-group" aria-label={locale === 'es' ? 'Animación' : 'Animation'}>{motions.map((item) => <button key={item} type="button" className={motion === item ? 'active' : ''} onClick={() => setMotion(item)} aria-pressed={motion === item}>{t.motions[item]}</button>)}</div><div className="audition-group" aria-label={t.kit}>{(['solid', 'stripes', 'sash'] as const).map((style) => <button key={style} type="button" className={kitStyle === style ? 'active' : ''} aria-pressed={kitStyle === style} onClick={() => setKitStyle(style)}>{t[style]}</button>)}</div><div className="audition-group" aria-label={t.silhouette}><button type="button" className={silhouette === 'athletic' ? 'active' : ''} aria-pressed={silhouette === 'athletic'} onClick={() => setSilhouette('athletic')}>{t.athletic}</button><button type="button" className={silhouette === 'source' ? 'active' : ''} aria-pressed={silhouette === 'source'} onClick={() => setSilhouette('source')}>{t.source}</button></div><div className="audition-group" aria-label={t.distance}>{(['match', 'close', 'front'] as const).map((camera) => <button key={camera} type="button" className={view === camera ? 'active' : ''} aria-pressed={view === camera} onClick={() => setView(camera)}>{t[camera]}</button>)}</div></div>
    <p className="audition-note">{t.note}</p>
  </main>;
}
