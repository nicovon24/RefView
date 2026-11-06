import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createIncident001SourceV2 } from './authored-incident-v2';
// @ts-expect-error Original public JavaScript clip has no TypeScript declaration.
import { samplePose as runPose } from '../assets/asset-002.mjs';
// @ts-expect-error Original public JavaScript clip has no TypeScript declaration.
import { samplePose as fallPose } from '../assets/asset-003.mjs';
// @ts-expect-error Original public JavaScript clip has no TypeScript declaration.
import { samplePose as challengePose } from '../assets/asset-004.mjs';

const digest = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

describe('protected incident motion', () => {
  it('keeps reviewed contact evidence and incident suffix, facts and events fixed', () => {
    const source = createIncident001SourceV2();
    expect(Object.fromEntries(source.observation.evidence.map((item) =>
      [item.evidenceId, digest(item.samples)]))).toEqual({
      'EV-PASS-SNAPSHOT': '23daa7313f902b413418801292da09e77c318ad59e30c3eba5c5fc00d025a052',
      'EV-NO-BALL-TOUCH': 'eb2033e8d35e3325a010c2f9d74e1833ea7875c8785fb87ac5e2842d12c9c38a',
      'EV-TRIP-CONTACT': '73649168538e448434ebcc133b1ca5295e2c1009e0e27c1ed31430f71fd5d704',
      'EV-INSIDE-AREA': '4221edfe5e6e1ab89552e26192e12aa4efd6664059a642be710104ad4c95fc8b',
      'EV-NON-DOGSO': '21cad9c8cab454f0e371f6665db6b23ffc51d7027307d93dfe62f968a19affe7',
    });
    expect(digest(source.facts)).toBe('f36429d0c154b11873ae886cd300bc9c23d4e7d30bfa3a102e5c32ba43ceb9df');
    expect(digest(source.timeline.samples.slice(330)))
      .toBe('4fdfd2379eaef6dddac26e931c8f5c8b7adf73de60b769c41262dc8ce26b277e');
    expect(digest(source.timeline.events)).toBe('4e5035fa8656b937aa40d2b95b296b7feef423edc57ce11ac6799cdafb54cc24');
  });

  it('gives the run a clearer swing while matching arm pose at the two authored clip handoffs', () => {
    const running = runPose(60);
    expect(running.rightFootLiftM).toBeGreaterThan(0.11);
    expect(Math.abs(running.leftArmPitchRad)).toBeGreaterThan(0.25);
    expect(Math.abs(runPose(355).leftArmPitchRad - challengePose(0).leftArmPitchRad)).toBeLessThan(0.03);
    expect(Math.abs(runPose(365).leftArmPitchRad - fallPose(0).leftArmPitchRad)).toBeLessThan(0.03);
    expect(runPose(60)).toEqual(runPose(60));
  });

  it('adds a visible challenge brace and fall follow-through without altering the protected boots', () => {
    expect(Math.abs(challengePose(10).leftArmPitchRad)).toBeGreaterThan(0.45);
    expect(challengePose(17).torsoPitchRad).toBeGreaterThan(0.05);
    expect(fallPose(20).handBraceLiftM).toBeGreaterThan(0.25);
    expect(fallPose(20)).toEqual(fallPose(30));
  });
});
