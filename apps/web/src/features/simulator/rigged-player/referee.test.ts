import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createRiggedReferee } from './referee';
import type { VerifiedPlayerResources } from './resources';
import { buildRefereeLocomotionPlan, stationaryRefereeMotion } from './pose/referee-locomotion';

function fixture(): VerifiedPlayerResources {
  const bodyScene = new THREE.Group();
  const rootBone = new THREE.Bone(); rootBone.name = 'root';
  const head = new THREE.Bone(); head.name = 'Head'; rootBone.add(head);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 1.2, 0, 0.1, 1.2, 0, 0, 1.3, 0.1,
    0, 0.9, 0, 0.1, 0.9, 0, 0, 0.95, 0.1,
    0, 0.05, 0, 0.1, 0.05, 0, 0, 0.1, 0.1,
    0, 0, 0, 0.1, 1.7, 0, 0.1, 0, 0,
  ], 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(Array(12).fill([0, 0, 1]).flat(), 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array(12).fill([0, 0, 0, 0]).flat(), 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(Array(12).fill([1, 0, 0, 0]).flat(), 4));
  geometry.setIndex([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const sourceTexture = new THREE.Texture();
  const sourceMaterial = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide,
    map: sourceTexture, normalMap: sourceTexture, roughnessMap: sourceTexture,
    metalnessMap: sourceTexture, aoMap: sourceTexture, bumpMap: sourceTexture,
    emissiveMap: sourceTexture, alphaMap: sourceTexture });
  const body = new THREE.SkinnedMesh(geometry, sourceMaterial); body.name = 'SuperHero_Male'; body.add(rootBone);
  body.bind(new THREE.Skeleton([rootBone, head])); bodyScene.add(body);
  bodyScene.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), sourceMaterial));
  bodyScene.children.at(-1)!.name = 'Eyes';
  bodyScene.add(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), sourceMaterial));
  bodyScene.children.at(-1)!.name = 'Eyebrows';
  const hairScene = new THREE.Group();
  hairScene.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.2),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide })));
  const idle = new THREE.AnimationClip('Idle_Loop', 2, [new THREE.VectorKeyframeTrack('root.position', [0, 1, 2], [0, 0, 0, 0.25, 0, 0, 0, 0, 0])]);
  const walk = new THREE.AnimationClip('Walk_Loop', 1, [new THREE.VectorKeyframeTrack('root.position', [0, 0.5, 1], [0, 0, 0, 0.4, 0, 0, 0, 0, 0])]);
  const jog = new THREE.AnimationClip('Jog_Fwd_Loop', 1, [new THREE.VectorKeyframeTrack('root.position', [0, 0.5, 1], [0, 0, 0, 0.8, 0, 0, 0, 0, 0])]);
  return { bodyScene, hairScene, clips: [idle, walk, jog], resourceDigest: 'fixture', dispose: vi.fn() };
}

beforeEach(() => vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => null }) }));

describe('selected-skeleton referee', () => {
  it('targets the skinned body name in the bundled selected model', async () => {
    const json = JSON.parse(await readFile(
      new URL('../../../../public/assets/player-audition/Superhero_Male_FullBody.gltf', import.meta.url), 'utf8')) as {
      nodes: { name?: string; mesh?: number; skin?: number }[];
    };
    expect(json.nodes.filter((node) => node.name === 'SuperHero_Male' &&
      Number.isInteger(node.mesh) && Number.isInteger(node.skin))).toHaveLength(1);
  });

  it('samples the actual bundled locomotion clips at direct, reverse and repeated ticks', async () => {
    const bytes = await readFile(new URL('../../../../public/assets/player-audition/UAL1_Standard.glb', import.meta.url));
    const animation = await new GLTFLoader().parseAsync(
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, '');
    const clips = ['Idle_Loop', 'Walk_Loop', 'Jog_Fwd_Loop'].map((name) =>
      animation.animations.find((clip) => clip.name === name));
    expect(clips.every(Boolean)).toBe(true);
    const referee = createRiggedReferee({ ...fixture(), clips: clips as THREE.AnimationClip[] });
    const plan = buildRefereeLocomotionPlan(Array.from({ length: 138 }, (_, tick) => ({ tick,
      position: { x: 12, y: 0, z: 26.5 + tick * 4 / 60 }, lookYaw: 0.75 })));
    const frame = { tick: 137, position: { x: 12, y: 0, z: 26.5 }, lookYaw: 0.75,
      cameraMode: 'thirdPerson' as const, elevatedReview: false, motion: plan[137]! };
    referee.applyFrame(frame);
    const first = referee.root.getObjectByName('Head')!.quaternion.clone();
    referee.applyFrame({ ...frame, tick: 80, motion: plan[80]! });
    const other = referee.root.getObjectByName('Head')!.quaternion.clone();
    expect(other.angleTo(first)).toBeGreaterThan(1e-5);
    referee.applyFrame(frame);
    expect(referee.root.getObjectByName('Head')!.quaternion.angleTo(first)).toBeLessThan(1e-8);
    referee.applyFrame({ ...frame, motion: stationaryRefereeMotion(137) });
    const idleHead = referee.root.getObjectByName('Head')!.quaternion.clone();
    expect(idleHead.angleTo(first)).toBeGreaterThan(1e-4);
    referee.applyFrame({ ...frame, cameraMode: 'firstPerson' });
    expect(referee.root.visible).toBe(false);
    expect(referee.root.getObjectByName('Head')!.quaternion.angleTo(first)).toBeLessThan(1e-8);
    referee.applyFrame(frame);
    expect(referee.root.getObjectByName('Head')!.quaternion.angleTo(first)).toBeLessThan(1e-8);
    expect(referee.root.position.toArray()).toEqual([12, 0, 26.5]);
    expect(referee.root.rotation.y).toBeCloseTo(0.75);
    referee.dispose();
  });

  it('renders the complete opaque selected referee with a black lit kit and owns its materials', () => {
    const source = fixture();
    const first = createRiggedReferee(source);
    const second = createRiggedReferee(source);
    const visibleKit = (actor: typeof first) => {
      const meshes: THREE.Mesh[] = [];
      actor.root.traverse((object) => { if (object instanceof THREE.Mesh) meshes.push(object); });
      expect(meshes.length).toBeGreaterThanOrEqual(7);
      expect(meshes.every((mesh) => mesh.visible)).toBe(true);
      expect(meshes.map((mesh) => mesh.name)).toEqual(expect.arrayContaining([
        'SuperHero_Male', 'Eyes', 'Eyebrows', 'AuditionShirt', 'AuditionShorts', 'AuditionBoots',
      ]));
      for (const mesh of meshes) {
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          expect(material).toBeInstanceOf(THREE.MeshStandardMaterial);
          expect(material.transparent).toBe(false);
          expect(material.opacity).toBe(1);
          expect(material.depthWrite).toBe(true);
          expect(material.depthTest).toBe(true);
        }
      }
      const body = actor.root.getObjectByName('SuperHero_Male') as THREE.SkinnedMesh;
      expect(body.castShadow).toBe(true);
      expect(body.receiveShadow).toBe(true);
      const hair = meshes.find((mesh) => mesh.name === '');
      expect(hair?.castShadow).toBe(true);
      const material = body.material as THREE.MeshStandardMaterial;
      const shader = { vertexShader: '#include <common>\n#include <begin_vertex>',
        fragmentShader: '#include <common>\n#include <map_fragment>', uniforms: {} };
      material.onBeforeCompile(shader as Parameters<typeof material.onBeforeCompile>[0], {} as THREE.WebGLRenderer);
      expect(shader.fragmentShader).toContain('vec3(0.012, 0.014, 0.016)');
      expect(shader.fragmentShader).not.toContain('vec3(0.035, 0.064, 0.087)');
      return material;
    };
    const firstMaterial = visibleKit(first);
    const secondMaterial = visibleKit(second);
    expect(firstMaterial).not.toBe(secondMaterial);
    expect((first.root.getObjectByName('AuditionShirt') as THREE.Mesh).material).toBe(firstMaterial);
    const sourceBody = source.bodyScene.getObjectByName('SuperHero_Male') as THREE.SkinnedMesh;
    expect((sourceBody.material as THREE.Material).transparent).toBe(false);
    expect((sourceBody.material as THREE.MeshStandardMaterial).map).not.toBeNull();
    expect(source.bodyScene.getObjectByName('Eyes')!.visible).toBe(true);
    expect(source.bodyScene.getObjectByName('Eyebrows')!.visible).toBe(true);
    const firstDisposed = vi.fn();
    const secondDisposed = vi.fn();
    firstMaterial.addEventListener('dispose', firstDisposed);
    secondMaterial.addEventListener('dispose', secondDisposed);
    first.dispose(); second.dispose();
    expect(firstDisposed).toHaveBeenCalledTimes(1);
    expect(secondDisposed).toHaveBeenCalledTimes(1);
    expect(source.dispose).not.toHaveBeenCalled();
  });

  it('uses absolute Idle time, restores imported root drift, and hides first/elevated views', () => {
    const referee = createRiggedReferee(fixture());
    const frame = { tick: 60, position: { x: 6, y: 0, z: 32 }, lookYaw: 1.1,
      cameraMode: 'thirdPerson' as const, elevatedReview: false, motion: stationaryRefereeMotion(60) };
    referee.applyFrame(frame);
    const rootBone = referee.root.getObjectByName('root')!;
    const first = rootBone.position.clone();
    expect(referee.root.position.toArray()).toEqual([6, 0, 32]);
    expect(referee.root.rotation.y).toBeCloseTo(1.1);
    expect(rootBone.position.toArray()).toEqual([0, 0, 0]);
    referee.applyFrame({ ...frame, tick: 120, cameraMode: 'firstPerson', motion: stationaryRefereeMotion(120) });
    expect(referee.root.visible).toBe(false);
    referee.applyFrame({ ...frame, elevatedReview: true });
    expect(referee.root.visible).toBe(false);
    referee.applyFrame(frame);
    expect(rootBone.position).toEqual(first);
    expect(referee.root.visible).toBe(true);
    referee.dispose(); referee.dispose();
    expect(() => referee.applyFrame(frame)).toThrow(/disposed/);
  });

  it('keeps canonical root authority while turning only the animated visual child', () => {
    const referee = createRiggedReferee(fixture());
    const motion = buildRefereeLocomotionPlan(Array.from({ length: 31 }, (_, tick) => ({ tick,
      position: { x: tick * 4 / 60, y: 0, z: 0 }, lookYaw: 0 })))[30]!;
    referee.applyFrame({ tick: 30, position: { x: 3, y: 0, z: 4 }, lookYaw: 0.4,
      cameraMode: 'thirdPerson', elevatedReview: false, motion });
    const visual = referee.root.getObjectByName('referee:visual')!;
    expect(referee.root.position.toArray()).toEqual([3, 0, 4]);
    expect(referee.root.rotation.y).toBeCloseTo(0.4);
    expect(referee.root.scale.toArray()).toEqual([1, 1, 1]);
    expect(visual.position.toArray()).toEqual([0, 0, 0]);
    expect(visual.rotation.y).toBeCloseTo(motion.bodyYawOffsetRad);
    expect(referee.root.getObjectByName('root')!.position.toArray()).toEqual([0, 0, 0]);
    referee.applyFrame({ tick: 30, position: { x: 3, y: 0, z: 4 }, lookYaw: 0.4,
      cameraMode: 'thirdPerson', elevatedReview: false, motion });
    expect(visual.rotation.y).toBeCloseTo(motion.bodyYawOffsetRad);
    expect(() => referee.applyFrame({ tick: 30, position: { x: 3, y: 0, z: 4 }, lookYaw: 0.4,
      cameraMode: 'thirdPerson', elevatedReview: false, motion: stationaryRefereeMotion(29) })).toThrow();
    referee.dispose();
  });
});

