import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createRiggedSceneActor, playerVisualFrame } from './scene-actor';
import type { VerifiedPlayerResources } from './resources';

const mocks = vi.hoisted(() => ({ createPlayer: vi.fn(), createSampler: vi.fn() }));
vi.mock('./model', () => ({ createRiggedPlayer: mocks.createPlayer }));
vi.mock('./pose/sampler', () => ({ createRiggedPoseSampler: mocks.createSampler }));

function resources(): VerifiedPlayerResources {
  return { bodyScene: new THREE.Group(), hairScene: new THREE.Group(), clips: [], resourceDigest: 'test', dispose: vi.fn() };
}

describe('shared rigged scene actor', () => {
  it('uses the selected audition kit and forwards the same absolute public frame', () => {
    const root = new THREE.Group();
    const disposePlayer = vi.fn();
    const disposeSampler = vi.fn();
    const applyFrame = vi.fn();
    mocks.createPlayer.mockReturnValue({ root, bones: new Map(), dispose: disposePlayer });
    mocks.createSampler.mockReturnValue({ applyFrame, dispose: disposeSampler });
    const source = resources();
    const plan = [{ phaseCycles: 0, idleWeight: 1, walkWeight: 0, jogWeight: 0, legacyBaseWeight: 0 }];
    const actor = createRiggedSceneActor('actor-002', source, plan);
    expect(mocks.createSampler).toHaveBeenCalledWith(expect.objectContaining({ root }), source.clips, plan);
    expect(mocks.createPlayer).toHaveBeenCalledWith({ bodyScene: source.bodyScene, hairScene: source.hairScene,
      color: '#e6c34f', number: 9, silhouette: 'athletic', kitStyle: 'solid' });
    const frame = playerVisualFrame(366, { actorHandle: 'actor-002', position: { x: 13.8, y: 0, z: 36.8 },
      yawRad: 1, clipHandle: 'asset-004', phaseQ: 1 });
    actor.applyFrame(frame);
    expect(applyFrame).toHaveBeenCalledWith(frame);
    expect(frame.rootPosition).toEqual({ x: 13.8, y: 0, z: 36.8 });
    actor.dispose(); actor.dispose();
    expect(disposeSampler).toHaveBeenCalledOnce();
    expect(disposePlayer).toHaveBeenCalledOnce();
    expect(source.dispose).not.toHaveBeenCalled();
  });
});
