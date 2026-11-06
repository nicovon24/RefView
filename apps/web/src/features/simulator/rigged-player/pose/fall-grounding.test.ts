import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { GLTFLoader, type GLTF } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { createRiggedPlayer } from '../model';
import { createRiggedPoseSampler } from './sampler';
import type { PlayerVisualFrame } from './frame';

let bodyScene: THREE.Group;
let clips: THREE.AnimationClip[];
function parse(source: string | ArrayBuffer) {
  return new Promise<GLTF>((resolve, reject) => new GLTFLoader().parse(source, '', resolve, reject));
}
beforeAll(async () => {
  vi.stubGlobal('ProgressEvent', class ProgressEvent {});
  const body = JSON.parse(readFileSync(new URL('../../../../../public/assets/player-audition/Superhero_Male_FullBody.gltf', import.meta.url), 'utf8')) as Record<string, unknown>;
  const bytes = readFileSync(new URL('../../../../../public/assets/player-audition/Superhero_Male_FullBody.bin', import.meta.url));
  body.buffers = [{ byteLength: bytes.length, uri: `data:application/octet-stream;base64,${bytes.toString('base64')}` }];
  delete body.images; delete body.textures; delete body.materials;
  for (const mesh of body.meshes as Array<{ primitives: Array<{ material?: number }> }>) {
    for (const primitive of mesh.primitives) delete primitive.material;
  }
  bodyScene = (await parse(JSON.stringify(body))).scene;
  const glb = readFileSync(new URL('../../../../../public/assets/player-audition/UAL1_Standard.glb', import.meta.url));
  clips = (await parse(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength))).animations;
});

function frame(tick: number): PlayerVisualFrame {
  return { tick, actorHandle: 'actor-002', rootPosition: { x: 13.8, y: 0, z: 36.8 }, yawRad: 0.4,
    clipHandle: 'asset-004', phaseQ: tick - 366 };
}

describe('selected-asset fall grounding', () => {
  it('moves the actual rig forward into a low braced rest rather than a seated pose', () => {
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => null }) });
    const player = createRiggedPlayer({ bodyScene, hairScene: new THREE.Group(), color: '#e6c34f', number: 9,
      silhouette: 'athletic', kitStyle: 'solid' });
    const sampler = createRiggedPoseSampler(player, clips);
    const joint = (name: string) => player.bones.get(name)!.getWorldPosition(new THREE.Vector3());
    const measurements = new Map<number, { pelvis: THREE.Vector3; head: THREE.Vector3; torso: THREE.Vector3;
      leftHand: THREE.Vector3; rightHand: THREE.Vector3; leftForearm: THREE.Vector3;
      rightForearm: THREE.Vector3; leftFoot: THREE.Vector3; rightFoot: THREE.Vector3 }>();
    for (const tick of [366, 378, 398, 420, 480]) {
      sampler.applyFrame(frame(tick));
      measurements.set(tick, { pelvis: joint('pelvis'), head: joint('Head'), torso: joint('spine_03'),
        leftHand: joint('hand_l'), rightHand: joint('hand_r'), leftForearm: joint('lowerarm_l'),
        rightForearm: joint('lowerarm_r'), leftFoot: joint('foot_l'), rightFoot: joint('foot_r') });
    }
    const start = measurements.get(366)!; const brace = measurements.get(398)!;
    const rest = measurements.get(420)!; const late = measurements.get(480)!;
    expect(rest.head.z - rest.pelvis.z).toBeGreaterThan(0.35);
    expect(rest.head.y).toBeLessThan(0.35);
    expect(rest.torso.y).toBeLessThan(0.4);
    expect(rest.head.y).toBeLessThan(start.head.y - 0.9);
    expect(brace.leftHand.y).toBeLessThan(0.4);
    expect(rest.leftHand.y).toBeLessThan(0.2);
    expect(rest.rightHand.y).toBeLessThan(0.25);
    expect(rest.leftForearm.y).toBeLessThan(0.4);
    expect(rest.rightForearm.y).toBeLessThan(0.5);
    expect(rest.leftFoot.y).toBeLessThan(0.5);
    expect(rest.rightFoot.y).toBeLessThan(0.5);
    for (const key of Object.keys(rest) as Array<keyof typeof rest>) {
      expect(rest[key].distanceTo(late[key])).toBeLessThan(1e-6);
    }
    sampler.dispose(); player.dispose();
  });

  it('keeps every posed selected-body and boot vertex above the grass tolerance', () => {
    vi.stubGlobal('document', { createElement: () => ({ width: 0, height: 0, getContext: () => null }) });
    const player = createRiggedPlayer({ bodyScene, hairScene: new THREE.Group(), color: '#e6c34f', number: 9,
      silhouette: 'athletic', kitStyle: 'solid' });
    const sampler = createRiggedPoseSampler(player, clips);
    const meshes: THREE.SkinnedMesh[] = [];
    player.root.traverse((object) => { if (object instanceof THREE.SkinnedMesh) meshes.push(object); });
    let minimum = Infinity; let worstTick = -1;
    for (let tick = 366; tick <= 480; tick += 1) {
      sampler.applyFrame(frame(tick));
      player.root.updateMatrixWorld(true);
      for (const mesh of meshes) {
        const positions = mesh.geometry.getAttribute('position');
        const indices = mesh.geometry.getIndex();
        for (let slot = 0; slot < (indices?.count ?? positions.count); slot += 1) {
          const index = indices?.getX(slot) ?? slot;
          const vertex = new THREE.Vector3().fromBufferAttribute(positions, index);
          mesh.applyBoneTransform(index, vertex);
          mesh.localToWorld(vertex);
          if (vertex.y < minimum) { minimum = vertex.y; worstTick = tick; }
        }
      }
    }
    expect(minimum).toBeGreaterThanOrEqual(-0.04);
    expect(worstTick).toBeGreaterThanOrEqual(366);
    expect(worstTick).toBeLessThanOrEqual(480);
    sampler.dispose(); player.dispose();
  });
});
