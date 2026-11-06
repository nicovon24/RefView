import { describe, expect, it } from 'vitest';
import { advanceFrame, advancePose, cameraPose, initialPose, lookPose, type Movement } from './controls';

const idle: Movement = { forward: false, backward: false, left: false, right: false, sprint: false };

describe('fixed tick controls preview geometry', () => {
  it('moves forward and sprints at a bounded faster speed', () => {
    const walking = advancePose(initialPose, { ...idle, forward: true }, 1 / 60);
    const sprinting = advancePose(initialPose, { ...idle, forward: true, sprint: true }, 1 / 60);
    expect(walking.x).toBeGreaterThan(initialPose.x);
    expect(sprinting.x - initialPose.x).toBeGreaterThan(walking.x - initialPose.x);
  });

  it('normalizes diagonals and clamps to pitch bounds', () => {
    const straight = advancePose(initialPose, { ...idle, forward: true }, 1);
    const diagonal = advancePose(initialPose, { ...idle, forward: true, right: true }, 1);
    expect(Math.hypot(diagonal.x - initialPose.x, diagonal.z - initialPose.z)).toBeCloseTo(straight.x - initialPose.x);
    const edge = advancePose({ ...initialPose, x: 51, z: 33 }, { ...idle, forward: true, right: true, sprint: true }, 10);
    expect(edge.x).toBeLessThanOrEqual(51.5);
    expect(edge.z).toBeLessThanOrEqual(33);
  });

  it('turns view independently, clamps pitch, and supports invert Y', () => {
    const normal = lookPose(initialPose, 100, -1000, 1, false);
    const inverted = lookPose(initialPose, 100, -1000, 1, true);
    expect(normal.yaw).toBeGreaterThan(0);
    expect(normal.pitch).toBe(1.2);
    expect(inverted.pitch).toBe(-1.2);
    expect(normal.x).toBe(initialPose.x);
  });

  it('places third person behind the eye and first person at the eye', () => {
    const third = cameraPose(initialPose, { mode: 'thirdPerson', distance: 5, lateral: 1 });
    const first = cameraPose(initialPose, { mode: 'firstPerson', distance: 5, lateral: 1 });
    expect(third.position[0]).toBeCloseTo(-23);
    expect(third.position[1]).toBe(2.1);
    expect(third.position[2]).toBeCloseTo(-9);
    expect(first.position).toEqual([-18, 1.7, -8]);
    expect(third.target[0]).toBeGreaterThan(first.position[0]);
  });

  it('advances the same 60 fixed ticks at 30, 60, and 144 display frames per second', () => {
    const samples = [30, 60, 144].map((fps) => {
      let state = { pose: initialPose, remainingSeconds: 0 };
      for (let frame = 0; frame < fps; frame += 1) state = advanceFrame(state.pose, { ...idle, forward: true }, state.remainingSeconds, 1 / fps);
      return state.pose;
    });
    expect(samples[0].x).toBeCloseTo(samples[1].x, 8);
    expect(samples[1].x).toBeCloseTo(samples[2].x, 8);
    expect(samples[0].x - initialPose.x).toBeCloseTo(4.2, 8);
  });
});
