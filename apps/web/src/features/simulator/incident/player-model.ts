import * as THREE from 'three';
import { applyPlayerPose, JOINT_NAMES, SEGMENT_NAMES, type ActorSceneNodes } from './playtest/exact-scene';

/** Authoring's public actor/asset adapter uses the same placement as exact playtest rendering. */
export function applyAuthoringPlayerFrame<P>(nodes: ActorSceneNodes,
  actor: Readonly<{ position: Readonly<{ x: number; y: number; z: number }>;
    yawRad: number; phaseQ: number }>,
  rig: Readonly<{ samplePlayerGeometry: (pose: P) => Parameters<typeof applyPlayerPose>[3] }>,
  clip: Readonly<{ samplePose: (phaseQ: number) => P }>): void {
  applyPlayerPose(nodes, actor.position, actor.yawRad,
    rig.samplePlayerGeometry(clip.samplePose(actor.phaseQ)));
}

type JerseyStation = Readonly<{ y: number; width: number; depth: number }>;
const SHIRT_NUMBERS: Readonly<Record<string, number>> = {
  'actor-001': 8, 'actor-002': 9, 'actor-003': 10, 'actor-004': 1,
  'actor-005': 2, 'actor-006': 4, 'actor-007': 5,
};
function actorVariation(handle: string): number {
  let hash = 2166136261;
  for (const character of handle) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return hash >>> 0;
}
const UPPER_JERSEY_STATIONS: readonly JerseyStation[] = [
  { y: -0.5, width: 0.188, depth: 0.155 },
  { y: -0.38, width: 0.205, depth: 0.165 },
  { y: -0.23, width: 0.222, depth: 0.174 },
  { y: 0.03, width: 0.232, depth: 0.178 },
  { y: 0.19, width: 0.208, depth: 0.159 },
  { y: 0.32, width: 0.164, depth: 0.13 },
  { y: 0.43, width: 0.108, depth: 0.097 },
  { y: 0.5, width: 0.087, depth: 0.083 },
];

function jerseyGeometry(stations: readonly JerseyStation[]): THREE.BufferGeometry {
  const sides = 16;
  const positions: number[] = [];
  const indices: number[] = [];
  for (const station of stations) {
    for (let side = 0; side < sides; side++) {
      const angle = side * Math.PI * 2 / sides;
      positions.push(Math.cos(angle) * station.width, station.y,
        Math.sin(angle) * station.depth);
    }
  }
  for (let ring = 0; ring < stations.length - 1; ring++) {
    for (let side = 0; side < sides; side++) {
      const a = ring * sides + side;
      const b = ring * sides + (side + 1) % sides;
      const c = (ring + 1) * sides + side;
      const d = (ring + 1) * sides + (side + 1) % sides;
      indices.push(a, c, b, b, c, d);
    }
  }
  const bottom = positions.length / 3;
  positions.push(0, stations[0]!.y, 0);
  const top = positions.length / 3;
  positions.push(0, stations.at(-1)!.y, 0);
  const lastRing = (stations.length - 1) * sides;
  for (let side = 0; side < sides; side++) {
    indices.push(bottom, side, (side + 1) % sides);
    indices.push(top, lastRing + (side + 1) % sides, lastRing + side);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Raised, curved seven-stroke numerals are part of the jersey mesh's local frame.
function shirtNumberGeometry(number: number): THREE.BufferGeometry {
  const strokes: Readonly<Record<number, string>> = {
    0: 'abcfed', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc',
    5: 'afgcd', 6: 'afgecd', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd',
  };
  const lines: Readonly<Record<string, readonly [number, number, number, number]>> = {
    a: [-0.034, 0.068, 0.034, 0.068],
    b: [0.036, 0.063, 0.036, 0.005],
    c: [0.036, -0.005, 0.036, -0.063],
    d: [-0.034, -0.068, 0.034, -0.068],
    e: [-0.036, -0.063, -0.036, -0.005],
    f: [-0.036, 0.005, -0.036, 0.063],
    g: [-0.034, 0, 0.034, 0],
  };
  const digits = `${number}`;
  const positions: number[] = [];
  const indices: number[] = [];
  const depthAt = (x: number, y: number) => {
    const upperIndex = UPPER_JERSEY_STATIONS.findIndex((station) => station.y >= y);
    const upper = UPPER_JERSEY_STATIONS[upperIndex]!;
    const lower = UPPER_JERSEY_STATIONS[Math.max(0, upperIndex - 1)]!;
    const t = upper.y === lower.y ? 0 : (y - lower.y) / (upper.y - lower.y);
    const width = lower.width + (upper.width - lower.width) * t;
    const depth = lower.depth + (upper.depth - lower.depth) * t;
    return -depth * Math.sqrt(1 - (x / width) ** 2) - 0.012;
  };
  for (const [digitIndex, digit] of [...digits].entries()) {
    const offset = (digitIndex - (digits.length - 1) / 2) * 0.095;
    for (const stroke of strokes[Number(digit)]!) {
      const [x0, y0, x1, y1] = lines[stroke]!;
      const half = 0.006;
      const horizontal = Math.abs(y1 - y0) < 0.001;
      const corners = horizontal
        ? [[x0 - half, y0 - half], [x1 + half, y1 - half],
          [x1 + half, y1 + half], [x0 - half, y0 + half]]
        : [[x0 - half, y0 + half], [x1 + half, y1 + half],
          [x1 + half, y1 - half], [x0 - half, y0 - half]];
      const base = positions.length / 3;
      for (const [x, y] of corners) {
        const localX = (x + offset) * 1.2;
        const localY = y * 2 - 0.11;
        positions.push(localX, localY, depthAt(localX, localY));
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }
  const shape = new THREE.BufferGeometry();
  shape.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  shape.setIndex(indices);
  shape.computeVertexNormals();
  return shape;
}

function limbGeometry(top: number, bottom: number): THREE.BufferGeometry {
  return jerseyGeometry([
    { y: -0.5, width: bottom * 0.65, depth: bottom * 0.65 },
    { y: -0.38, width: bottom * 0.96, depth: bottom * 0.96 },
    { y: -0.25, width: bottom, depth: bottom },
    { y: 0, width: (top + bottom) / 2, depth: (top + bottom) / 2 },
    { y: 0.25, width: top, depth: top },
    { y: 0.38, width: top * 0.96, depth: top * 0.96 },
    { y: 0.5, width: top * 0.65, depth: top * 0.65 },
  ]);
}

/** Original procedural kit geometry. Every call owns its resources. */
export function createPlayerModel(actorId: string): ActorSceneNodes {
  const index = Number(actorId.slice(-3));
  const keeper = index === 4;
  const attacker = index <= 3;
  const shirt = keeper ? '#76b596' : attacker ? '#e6c34f' : '#294b8f';
  const shorts = keeper ? '#183f33' : attacker ? '#2a3b32' : '#e8e8dc';
  const socks = keeper ? '#183f33' : attacker ? '#e6c34f' : '#567ee2';
  const trim = keeper ? '#cce2d1' : attacker ? '#f2d67c' : '#82a1e5';
  const skin = '#c99774';
  const variation = actorVariation(actorId);
  const root = new THREE.Group();
  root.name = `player:${actorId}`;
  const joints = {} as ActorSceneNodes['joints'];
  const segments = {} as ActorSceneNodes['segments'];
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const mesh = (geometry: THREE.BufferGeometry, color: string, roughness = 0.88) => {
    const key = `${color}:${roughness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness }));
    const part = new THREE.Mesh(geometry, materials.get(key)!);
    part.castShadow = true;
    return part;
  };
  for (const name of JOINT_NAMES) {
    const joint = new THREE.Group();
    joint.name = name;
    root.add(joint);
    joints[name] = joint;
  }
  const hips = mesh(new THREE.SphereGeometry(0.15, 16, 12), shorts);
  hips.scale.set(1.13, 0.64, 0.85);
  joints.hip.add(hips);
  const sternum = mesh(new THREE.SphereGeometry(0.16, 16, 12), shirt);
  sternum.scale.set(1.3, 0.72, 1.0);
  joints.spine.add(sternum);
  const head = mesh(new THREE.SphereGeometry(0.108, 16, 12), skin, 0.92);
  head.scale.set(0.84 + (variation % 4) * 0.025, 1.08 + ((variation >>> 3) % 4) * 0.025, 0.9);
  joints.head.add(head);
  const throat = mesh(new THREE.SphereGeometry(0.051, 10, 8), skin, 0.92);
  throat.scale.y = 1.25;
  throat.position.y = -0.11;
  joints.head.add(throat);
  const hair = mesh(new THREE.SphereGeometry(0.11, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.48), '#241c18', 1);
  hair.name = 'hair';
  (hair.material as THREE.MeshStandardMaterial).color.set(
    ['#241c18', '#38271f', '#18191b', '#49352a'][variation % 4]!);
  hair.scale.set(head.scale.x, head.scale.y + ((variation >>> 5) % 3) * 0.035, head.scale.z);
  hair.position.y = 0.025;
  joints.head.add(hair);
  for (const side of ['left', 'right'] as const) {
    const hand = mesh(new THREE.SphereGeometry(0.031, 10, 8), skin);
    hand.scale.set(0.8, 1.15, 0.68);
    joints[`${side}Wrist`].add(hand);
    const shoulder = mesh(new THREE.SphereGeometry(0.087, 12, 10), shirt);
    shoulder.scale.set(1.04, 1.08, 0.94);
    joints[`${side}Shoulder`].add(shoulder);
    for (const joint of ['Knee', 'Elbow'] as const) {
      const cushion = mesh(new THREE.SphereGeometry(joint === 'Knee' ? 0.054 : 0.052, 12, 10), skin);
      cushion.scale.set(0.9, 1.12, 0.82);
      joints[`${side}${joint}`].add(cushion);
    }
  }
  for (const name of SEGMENT_NAMES) {
    const upperBody = name === 'torso' || name === 'neck';
    const radius = name === 'torso' ? [0.19, 0.16] : name === 'neck' ? [0.225, 0.19] :
      name.endsWith('Thigh') ? [0.1, 0.075] : name.endsWith('Shin') ? [0.073, 0.065] :
      name.endsWith('UpperArm') ? [0.079, 0.073] : [0.055, 0.049];
    const color = upperBody || name.endsWith('UpperArm') ? shirt :
      name.endsWith('Shin') ? socks : skin;
    const shape = name === 'torso' ? jerseyGeometry([
      { y: -0.5, width: 0.153, depth: 0.13 },
      { y: -0.38, width: 0.162, depth: 0.136 },
      { y: -0.2, width: 0.174, depth: 0.145 },
      { y: 0, width: 0.181, depth: 0.151 },
      { y: 0.28, width: 0.187, depth: 0.154 },
      { y: 0.5, width: 0.188, depth: 0.155 },
    ]) : name === 'neck' ? jerseyGeometry(UPPER_JERSEY_STATIONS) :
      limbGeometry(radius[0], radius[1]);
    const part = mesh(shape, color);
    part.name = name;
    root.add(part);
    segments[name] = part;
    if (name === 'neck' && SHIRT_NUMBERS[actorId] !== undefined) {
      const number = SHIRT_NUMBERS[actorId];
      const digits = mesh(shirtNumberGeometry(number), keeper ? '#17392f' : '#faf7e8');
      digits.name = `shirtNumber:${number}`;
      (digits.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
      part.add(digits);
    }
    if (name.endsWith('Thigh')) {
      const shortLeg = mesh(jerseyGeometry([
        { y: -0.5, width: 0.085, depth: 0.085 },
        { y: -0.37, width: 0.111, depth: 0.106 },
        { y: -0.15, width: 0.11, depth: 0.105 },
        { y: 0.06, width: 0.105, depth: 0.1 },
        { y: 0.16, width: 0.101, depth: 0.095 },
      ]), shorts);
      shortLeg.name = `${name}Shorts`;
      part.add(shortLeg);
    }
    if (name.endsWith('UpperArm')) {
      const sleeve = mesh(jerseyGeometry([
        { y: -0.5, width: 0.072, depth: 0.072 },
        { y: -0.38, width: 0.09, depth: 0.085 },
        { y: -0.19, width: 0.086, depth: 0.082 },
        { y: -0.13, width: 0.08, depth: 0.077 },
      ]), shirt);
      sleeve.name = `${name.startsWith('left') ? 'left' : 'right'}Sleeve`;
      part.add(sleeve);
      const cuff = mesh(new THREE.CylinderGeometry(0.081, 0.08, 0.045, 12), trim);
      cuff.position.y = -0.13;
      part.add(cuff);
    }
    if (name === 'neck') {
      // The authored spine-to-neck span is the upper shirt, with a small collar at its top.
      const collar = mesh(new THREE.CylinderGeometry(0.09, 0.105, 0.055, 12), trim);
      collar.position.y = 0.45;
      part.add(collar);
    }
  }
  const boot = (side: 'left' | 'right') => {
    const foot = new THREE.Group();
    foot.name = `${side}Boot`;
    const upper = mesh(new THREE.SphereGeometry(0.084, 12, 8), '#171b1b', 0.75);
    upper.scale.set(0.86, 0.56, 1.45);
    upper.position.z = 0.025;
    foot.add(upper);
    const sole = mesh(new THREE.BoxGeometry(0.15, 0.016, 0.23), '#101616', 0.8);
    sole.position.set(0, -0.046, 0.025);
    foot.add(sole);
    root.add(foot);
    return foot;
  };
  return { root, joints, segments, boots: { left: boot('left'), right: boot('right') } };
}

export function disposePlayerModel(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    geometries.add(node.geometry);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) materials.add(material);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}
