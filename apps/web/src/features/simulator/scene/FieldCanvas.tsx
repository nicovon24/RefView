'use client';

import { Canvas } from '@react-three/fiber';
import { Component, type ReactNode, useState } from 'react';
import { copy, type Locale } from '@/lib/i18n/locale';

class CanvasErrorBoundary extends Component<
  { children: ReactNode; message: string },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <div className="scene-message" role="alert">{this.props.message}</div>;
    return this.props.children;
  }
}

function NeutralField() {
  return (
    <>
      <color attach="background" args={['#112f29']} />
      <ambientLight intensity={1.8} />
      <directionalLight position={[6, 12, 7]} intensity={2.2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 14]} />
        <meshStandardMaterial color="#245944" roughness={0.94} />
      </mesh>
      <gridHelper args={[22, 11, '#7bb69a', '#426f5d']} position={[0, 0.012, 0]} scale={[1, 1, 14 / 22]} />
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.05, 2.09, 64]} />
        <meshBasicMaterial color="#d2e8d3" />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.055, 14]} />
        <meshBasicMaterial color="#d2e8d3" />
      </mesh>
    </>
  );
}

export default function FieldCanvas({ locale }: { locale: Locale }) {
  const [supported] = useState<boolean | null>(() => {
    if (typeof document === 'undefined') return null;
    const probe = document.createElement('canvas');
    return Boolean(probe.getContext('webgl2') || probe.getContext('webgl'));
  });
  const [ready, setReady] = useState(false);
  const t = copy[locale];

  if (supported === false) return <div className="scene-message" role="alert">{t.unsupported}</div>;
  if (supported === null) return <div className="scene-message" role="status">{t.loading}</div>;

  return (
    <CanvasErrorBoundary message={t.error}>
      <Canvas
        aria-label={t.scene}
        camera={{ position: [0, 19, 22], fov: 44 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        onCreated={() => setReady(true)}
        fallback={<span>{t.unsupported}</span>}
      >
        <NeutralField />
      </Canvas>
      <div className="scene-status" role="status">{ready ? t.ready : t.loading}</div>
    </CanvasErrorBoundary>
  );
}
