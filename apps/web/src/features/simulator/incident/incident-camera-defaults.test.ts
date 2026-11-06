import { describe, expect, it } from 'vitest';
import { cameraPose } from '../controls/controls';
import { incidentThirdPersonCameraDefaults } from './incident-camera-defaults';

describe('incident third-person camera defaults', () => {
  it('frames the referee from 4.5 m back and 1.5 m to the side within control bounds', () => {
    expect(incidentThirdPersonCameraDefaults).toEqual({ distance: 4.5, lateral: -1.5 });
    const camera = cameraPose({ x: 6, z: 32, yaw: 0, pitch: 0 },
      { mode: 'thirdPerson', ...incidentThirdPersonCameraDefaults });
    expect(camera.position).toEqual([4.5, 2.1, 27.5]);
    expect(camera.target).toEqual([6, 1.7, 42]);
  });
});
