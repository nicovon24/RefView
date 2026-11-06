import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { compileCanonicalScenarioSourceV2 } from '@refview/content';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from '../../../../../../packages/content/src/authored-incident-v2';
import { applyAuthoringPlayerFrame, createPlayerModel, disposePlayerModel } from './player-model';
import { applyPlayerPose, createExactSceneRenderer, JOINT_NAMES, SEGMENT_NAMES } from './playtest/exact-scene';
import { createPublicPlayback } from './playtest/public-playback';
import { stationaryRefereeMotion } from '../rigged-player/pose/referee-locomotion';

const point = (x: number, y: number, z: number) => ({ x, y, z });
const geometry = {
  joints: Object.fromEntries(JOINT_NAMES.map((name) => [name, point(name === 'leftAnkle' ? 0.3 : 0, name === 'head' ? 1.7 : 0.8, 0)])) as Record<(typeof JOINT_NAMES)[number], ReturnType<typeof point>>,
  segments: Object.fromEntries(SEGMENT_NAMES.map((name) => [name, { start: point(0, 0.8, 0), end: point(0, 1.3, 0) }])) as Record<(typeof SEGMENT_NAMES)[number], { start: ReturnType<typeof point>; end: ReturnType<typeof point> }>,
};

describe('shared incident player model', () => {
  it('attaches explicit public shirt numbers outside the upper back surface', () => {
    const expected = [8, 9, 10, 1, 2, 4, 5];
    for (const [index, number] of expected.entries()) {
      const model = createPlayerModel(`actor-00${index + 1}`);
      const back = model.segments.neck.getObjectByName(`shirtNumber:${number}`);
      expect(back).toBeInstanceOf(THREE.Mesh);
      expect(back!.parent).toBe(model.segments.neck);
      const shirt = (model.segments.neck as THREE.Mesh).geometry;
      const vertices = shirt.getAttribute('position') as THREE.BufferAttribute;
      const rings = new Map<number, { width: number; depth: number }>();
      for (let vertex = 0; vertex < vertices.count - 2; vertex++) {
        const y = vertices.getY(vertex);
        const ring = rings.get(y) ?? { width: 0, depth: 0 };
        ring.width = Math.max(ring.width, Math.abs(vertices.getX(vertex)));
        ring.depth = Math.max(ring.depth, Math.abs(vertices.getZ(vertex)));
        rings.set(y, ring);
      }
      const stations = [...rings].sort(([a], [b]) => a - b);
      const digitVertices = (back as THREE.Mesh).geometry.getAttribute('position') as THREE.BufferAttribute;
      expect(digitVertices.count).toBeGreaterThan(0);
      for (let vertex = 0; vertex < digitVertices.count; vertex++) {
        const x = digitVertices.getX(vertex);
        const y = digitVertices.getY(vertex);
        const lower = stations.findLast(([stationY]) => stationY <= y)!;
        const upper = stations.find(([stationY]) => stationY >= y)!;
        const t = upper[0] === lower[0] ? 0 : (y - lower[0]) / (upper[0] - lower[0]);
        const width = lower[1].width + (upper[1].width - lower[1].width) * t;
        const depth = lower[1].depth + (upper[1].depth - lower[1].depth) * t;
        const jerseyBack = -depth * Math.sqrt(1 - (x / width) ** 2);
        expect(digitVertices.getZ(vertex)).toBeLessThan(jerseyBack - 0.005);
      }
      disposePlayerModel(model.root);
    }
  });

  it('rounds limb ends and keeps boots and hands proportionate', () => {
    const model = createPlayerModel('actor-001');
    const thigh = (model.segments.leftThigh as THREE.Mesh).geometry;
    const positions = thigh.getAttribute('position') as THREE.BufferAttribute;
    const radiusAt = (y: number) => {
      const radii: number[] = [];
      for (let index = 0; index < positions.count; index++) {
        if (Math.abs(positions.getY(index) - y) < 1e-5)
          radii.push(Math.hypot(positions.getX(index), positions.getZ(index)));
      }
      return Math.max(...radii);
    };
    expect(radiusAt(-0.5)).toBeLessThan(radiusAt(-0.25));
    expect(radiusAt(0.5)).toBeLessThan(radiusAt(0.25));
    const hand = model.joints.leftWrist.children[0] as THREE.Mesh;
    const head = model.joints.head.children[0] as THREE.Mesh;
    expect((hand.geometry as THREE.SphereGeometry).parameters.radius).toBeLessThan(
      (head.geometry as THREE.SphereGeometry).parameters.radius / 3);
    expect(model.boots.left.children.length).toBeGreaterThan(0);
    const shorts = (model.segments.leftThigh as THREE.Mesh).children[0] as THREE.Mesh;
    expect(shorts).toBeInstanceOf(THREE.Mesh);
    shorts.geometry.computeBoundingBox();
    expect(shorts.geometry.boundingBox!.min.y).toBe(-0.5);
    expect(shorts.geometry.boundingBox!.max.y).toBeLessThan(0.25);
    const knee = model.joints.leftKnee.children[0] as THREE.Mesh;
    expect((knee.geometry as THREE.SphereGeometry).parameters.radius).toBeLessThan(0.06);
    disposePlayerModel(model.root);
  });
  it('constructs distinct team kits and a complete authored articulation contract', () => {
    const attacker = createPlayerModel('actor-001');
    const defender = createPlayerModel('actor-005');
    const keeper = createPlayerModel('actor-004');
    for (const model of [attacker, defender, keeper]) {
      expect(Object.keys(model.joints)).toEqual([...JOINT_NAMES]);
      expect(Object.keys(model.segments)).toEqual([...SEGMENT_NAMES]);
      expect(model.boots.left.parent).toBe(model.root);
      expect(model.boots.right.parent).toBe(model.root);
    }
    const shirt = (model: typeof attacker) => (model.segments.torso as THREE.Mesh).material as THREE.MeshStandardMaterial;
    expect(new Set([attacker, defender, keeper].map((model) => shirt(model).color.getHexString())).size).toBe(3);
    for (const model of [attacker, defender, keeper]) disposePlayerModel(model.root);
  });

  it('rounds the shoulders into the collar and narrows the jersey at the waist', () => {
    const model = createPlayerModel('actor-001');
    const upper = (model.segments.neck as THREE.Mesh).geometry;
    const lower = (model.segments.torso as THREE.Mesh).geometry;
    const widthAt = (geometry: THREE.BufferGeometry, y: number) => {
      const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
      const widths: number[] = [];
      for (let index = 0; index < positions.count; index++) {
        if (Math.abs(positions.getY(index) - y) < 1e-5) widths.push(Math.abs(positions.getX(index)));
      }
      return Math.max(...widths);
    };
    expect(widthAt(upper, 0.03)).toBeGreaterThan(widthAt(upper, 0.5) * 2);
    expect(widthAt(lower, -0.5)).toBeLessThan(widthAt(lower, 0.5));
    const normals = upper.getAttribute('normal') as THREE.BufferAttribute;
    for (let index = 0; index < normals.count; index++) {
      expect([normals.getX(index), normals.getY(index), normals.getZ(index)].every(Number.isFinite)).toBe(true);
    }
    disposePlayerModel(model.root);
  });

  it('places the same actor at the same exact pose when reconstructed in either view', () => {
    const authoring = createPlayerModel('actor-003');
    const playtest = createPlayerModel('actor-003');
    for (const model of [authoring, playtest]) applyPlayerPose(model, point(12, 0, 31), 0.45, geometry);
    authoring.root.updateMatrixWorld(true);
    playtest.root.updateMatrixWorld(true);
    const collect = (root: THREE.Object3D) => {
      const values: number[] = [];
      root.traverse((node) => { if (node instanceof THREE.Mesh) values.push(...node.matrixWorld.elements); });
      return values;
    };
    expect(collect(authoring.root)).toEqual(collect(playtest.root));
    expect(authoring.boots.left.position.toArray()).toEqual([0.3, 0.8, 0]);
    disposePlayerModel(authoring.root);
    disposePlayerModel(playtest.root);
  });

  it('matches authoring and exact playtest models at public canonical contact tick 366', async () => {
    const source = createIncident001SourceV2();
    const playable = compileCanonicalScenarioSourceV2(source, {
      ...createIncident001GeometryResolverV2(),
      resolveAssetBytes: (_id, path) => readFileSync(new URL(
        `../../../../../../packages/content/assets/${path.split('/').at(-1)}`, import.meta.url)),
    }).playable;
    const tick = 366;
    const canonicalActors = playable.actors[tick]!.actors;
    const contactActor = canonicalActors.find((actor) => actor.phaseQ === 0)!;
    expect(contactActor).toBeDefined();
    const modules = new Map<string, unknown>();
    for (const asset of playable.assetManifest) {
      modules.set(asset.assetHandle, await import(new URL(
        `../../../../../../packages/content/assets/${asset.neutralClientPath.split('/').at(-1)}`,
        import.meta.url).href));
    }
    const bindings = new Map(playable.actorRigBindings.map((binding) =>
      [binding.actorHandle, binding.rigAssetHandle]));
    const rig = modules.get(bindings.get(contactActor.actorHandle)!) as {
      samplePlayerGeometry: (pose: unknown) => Parameters<typeof applyPlayerPose>[3];
    };
    const clip = modules.get(contactActor.clipHandle) as { samplePose: (phaseQ: number) => unknown };
    const authoring = createPlayerModel(contactActor.actorHandle);
    applyAuthoringPlayerFrame(authoring, contactActor, rig, clip);
    const scene = new THREE.Scene();
    const actors = new Map(canonicalActors.map((actor) => {
      const model = createPlayerModel(actor.actorHandle);
      scene.add(model.root);
      return [actor.actorHandle, model] as const;
    }));
    const ball = new THREE.Group();
    const referee = new THREE.Group();
    scene.add(ball, referee);
    const camera = new THREE.PerspectiveCamera();
    const render = vi.fn();
    const gl = { domElement: { getBoundingClientRect: () => ({ width: 800, height: 400 }) },
      getContext: () => ({ isContextLost: () => false }), render };
    const world = createPublicPlayback(playable).fixture.snapshot(tick);
    createExactSceneRenderer({ scene, camera, gl, actors, ball, referee, rigBindings: bindings,
      modules })({ tick, world, refereeMotion: stationaryRefereeMotion(tick), view: { tick, refereePosition: point(6, 0, 32),
      lookYaw: 1, lookPitch: 0, cameraMode: 'thirdPerson', cameraDistanceM: 2,
      cameraLateralOffsetM: 0, viewportAspectRatio: 2, verticalFovRad: 1 } });
    expect(render).toHaveBeenCalledOnce();
    const playtest = actors.get(contactActor.actorHandle)!;
    const signature = (root: THREE.Object3D) => {
      root.updateMatrixWorld(true);
      const parts: unknown[] = [];
      root.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        const material = node.material as THREE.MeshStandardMaterial;
        parts.push({ name: node.name, matrix: node.matrixWorld.toArray(),
          vertices: node.geometry.getAttribute('position').count, color: material.color.getHexString() });
      });
      return parts;
    };
    expect(signature(authoring.root)).toEqual(signature(playtest.root));
    expect(playtest.boots.left.position.toArray()).toEqual(Object.values(
      rig.samplePlayerGeometry(clip.samplePose(contactActor.phaseQ)).joints.leftAnkle));
    disposePlayerModel(authoring.root);
    for (const model of actors.values()) disposePlayerModel(model.root);
  });

  it('owns and disposes each mounted model resource once', () => {
    const first = createPlayerModel('actor-001');
    const second = createPlayerModel('actor-001');
    const mesh = first.segments.torso as THREE.Mesh;
    const otherMesh = second.segments.torso as THREE.Mesh;
    expect(mesh.geometry).not.toBe(otherMesh.geometry);
    expect(mesh.material).not.toBe(otherMesh.material);
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    first.root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material) ? node.material : [node.material])
        materials.add(material);
    });
    expect(materials.size).toBeLessThan(12);
    const geometryDisposals = [...geometries].map((geometry) => vi.spyOn(geometry, 'dispose'));
    const materialDisposals = [...materials].map((material) => vi.spyOn(material, 'dispose'));
    disposePlayerModel(first.root);
    for (const dispose of [...geometryDisposals, ...materialDisposals])
      expect(dispose).toHaveBeenCalledOnce();
    disposePlayerModel(second.root);
  });

  it('bridges shirt sleeves and exposed elbows while keeping shorts on both thighs', () => {
    for (let index = 1; index <= 7; index++) {
      const model = createPlayerModel(`actor-00${index}`);
      for (const side of ['left', 'right'] as const) {
        expect(model.segments[`${side}UpperArm`].getObjectByName(`${side}Sleeve`)).toBeInstanceOf(THREE.Mesh);
        expect(model.joints[`${side}Elbow`].children.some((child) =>
          (child as THREE.Mesh).material instanceof THREE.MeshStandardMaterial &&
          ((child as THREE.Mesh).material as THREE.MeshStandardMaterial).color.getHexString() === 'c99774')).toBe(true);
        expect(model.segments[`${side}Thigh`].getObjectByName(`${side}ThighShorts`)).toBeInstanceOf(THREE.Mesh);
      }
      disposePlayerModel(model.root);
    }
  });

  it('gives public actor handles stable, modest head and hair variation', () => {
    const signature = (id: string) => {
      const model = createPlayerModel(id);
      const head = model.joints.head.children[0]!;
      const hair = model.joints.head.getObjectByName('hair') as THREE.Mesh;
      const result = [head.scale.toArray(), hair.scale.toArray(),
        (hair.material as THREE.MeshStandardMaterial).color.getHexString()];
      disposePlayerModel(model.root);
      return result;
    };
    expect(signature('actor-001')).toEqual(signature('actor-001'));
    expect(new Set(Array.from({ length: 7 }, (_, index) => JSON.stringify(signature(`actor-00${index + 1}`)))).size)
      .toBeGreaterThan(3);
  });
});
