import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { measureEvidenceAtTick, type ViewSample } from '@refview/simulation';
import { compileCanonicalScenarioSourceV2 } from './source-compiler-v2';
import { createIncident001GeometryResolverV2, createIncident001SourceV2 } from './authored-incident-v2';

const files = new Map([['player-rig', 'asset-001.mjs'],
  ['run-clip', 'asset-002.mjs'], ['trip-clip', 'asset-003.mjs'],
  ['challenge-clip', 'asset-004.mjs']]);
const compiled = compileCanonicalScenarioSourceV2(createIncident001SourceV2(), {
  ...createIncident001GeometryResolverV2(),
  resolveAssetBytes: (id, path) => {
    const file = files.get(id);
    return file && path === `/assets/${file}`
      ? readFileSync(new URL(`../assets/${file}`, import.meta.url)) : undefined;
  },
});
const fixture = compiled.privateContext.observationFixture;
function view(x: number, z: number, mode: 'firstPerson' | 'thirdPerson'): ViewSample {
  return { tick: 366, refereePosition: { x, y: 0, z },
    lookYaw: Math.atan2(13.8 - x, 36.8 - z),
    lookPitch: Math.atan2(0.8 - 1.7, Math.hypot(13.8 - x, 36.8 - z)),
    cameraMode: mode, cameraDistanceM: 2, cameraLateralOffsetM: 0,
    viewportAspectRatio: 1100 / 460, verticalFovRad: 50 * Math.PI / 180 };
}

describe('incident authoring calibration candidates', () => {
  it('finds readable and occluded candidate positions for both camera modes', () => {
    for (const mode of ['firstPerson', 'thirdPerson'] as const) {
      const good = measureEvidenceAtTick(fixture, 'EV-TRIP-CONTACT', 366, view(6, 32, mode));
      const poor = measureEvidenceAtTick(fixture, 'EV-TRIP-CONTACT', 366, view(12, 26.5, mode));
      expect(good.classification).toBe('joint');
      expect(poor.classification).toBe('neither');
      const areaGood = measureEvidenceAtTick(fixture, 'EV-INSIDE-AREA', 366,
        view(6, 32, mode));
      expect(areaGood.classification).toBe('joint');
      expect(measureEvidenceAtTick(fixture, 'EV-INSIDE-AREA', 366,
        view(12, 26.5, mode)).classification).toBe('neither');
    }
  });
});
