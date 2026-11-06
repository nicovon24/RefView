import { useMemo } from 'react';
import * as THREE from 'three';
import type { ContactVisualPatch, ContactVisualRow } from '../rigged-player/evidence/contact-visualization';

type Point = Readonly<{ x: number; y: number; z: number }>;
const tuple = (point: Point): [number, number, number] => [point.x, point.y, point.z];

function Triangle({ patch, color, compact }: { patch: ContactVisualPatch; color: string; compact: boolean }) {
  const outline = useMemo(() => {
    const vertices = [...patch.vertices, patch.vertices[0]!].flatMap((point) => [point.x, point.y, point.z]);
    return new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  }, [patch]);
  return <>
    <lineLoop geometry={outline} castShadow={false} receiveShadow={false}>
      <lineBasicMaterial color={color} depthTest depthWrite={false} />
    </lineLoop>
    <mesh position={tuple(patch.point)} castShadow={false} receiveShadow={false}>
      <sphereGeometry args={[compact ? 0.008 : 0.055, 12, 8]} />
      <meshBasicMaterial color={color} depthTest depthWrite={false} />
    </mesh>
    <mesh position={tuple(patch.leftAnkle)} castShadow={false} receiveShadow={false}>
      <sphereGeometry args={[compact ? 0.020 : 0.105, 12, 8]} />
      <meshBasicMaterial color={color} wireframe depthTest depthWrite={false} />
    </mesh>
  </>;
}

export function ContactDiagnosticOverlay({ row, compact = false }: { row: ContactVisualRow; compact?: boolean }) {
  return <group renderOrder={1}>
    <Triangle patch={row.defender} color="#00e5ff" compact={compact} />
    <Triangle patch={row.attacker} color="#ff32d6" compact={compact} />
  </group>;
}
