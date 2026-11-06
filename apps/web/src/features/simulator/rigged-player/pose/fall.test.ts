import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { applyAuthoredFall, sampleFall } from './fall';

describe('authored one-shot fall curve', () => {
  it('starts at contact, progresses through three distinct stages, and freezes after landing', () => {
    expect(sampleFall(366).drop).toBe(0);
    expect(sampleFall(366).forward).toBe(0);
    expect(sampleFall(380)).toMatchObject({ drop: 0.03, rightThigh: 0,
      rightKnee: 1.10, rightFoot: -1.10 });
    expect(sampleFall(398).drop).toBeGreaterThan(sampleFall(380).drop);
    expect(sampleFall(420).drop).toBeGreaterThan(sampleFall(398).drop);
    expect(sampleFall(420).drop).toBe(0.46);
    for (const tick of [421, 450, 480]) {
      expect({ ...sampleFall(tick), tick: 420 }).toEqual(sampleFall(420));
    }
  });

  it('interpolates the composed pelvis orientation as one quaternion', () => {
    const pelvis = new THREE.Bone();
    pelvis.name = 'pelvis';
    const rotations = new Map([['pelvis', pelvis]]);
    applyAuthoredFall(rotations, 389);
    const xAxis = new THREE.Vector3(1, 0, 0);
    const zAxis = new THREE.Vector3(0, 0, 1);
    const endpoint = (forward: number, roll: number) => new THREE.Quaternion()
      .setFromAxisAngle(xAxis, forward).multiply(new THREE.Quaternion().setFromAxisAngle(zAxis, roll));
    const expected = endpoint(0.32, -0.06).slerp(endpoint(0.95, -0.08), 0.5);
    expect(pelvis.quaternion.angleTo(expected)).toBeLessThan(1e-6);
  });

  it('has bounded increments and finite values at every canonical tick', () => {
    let prior = sampleFall(366);
    for (let tick = 367; tick <= 480; tick += 1) {
      const current = sampleFall(tick);
      for (const field of ['drop', 'forward', 'roll', 'spine', 'leftArm', 'rightArm', 'leftElbow', 'rightElbow',
        'leftThigh', 'rightThigh', 'leftKnee', 'rightKnee', 'leftFoot', 'rightFoot'] as const) {
        expect(Number.isFinite(current[field])).toBe(true);
        expect(Math.abs(current[field] - prior[field])).toBeLessThan(0.12);
      }
      prior = current;
    }
  });
});
