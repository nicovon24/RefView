export type Pose = Readonly<{ x: number; z: number; yaw: number; pitch: number }>;
export type Movement = Readonly<{ forward: boolean; backward: boolean; left: boolean; right: boolean; sprint: boolean }>;
export type CameraSettings = Readonly<{ mode: 'thirdPerson' | 'firstPerson'; distance: number; lateral: number }>;

export const initialPose: Pose = { x: -18, z: -8, yaw: Math.PI / 2, pitch: -0.35 };
export const fixedStepSeconds = 1 / 60;

export function advancePose(pose: Pose, input: Movement, seconds: number): Pose {
  const forward = Number(input.forward) - Number(input.backward);
  const sideways = Number(input.right) - Number(input.left);
  const length = Math.hypot(forward, sideways);
  if (!length || !Number.isFinite(seconds) || seconds <= 0) return pose;
  const step = (input.sprint ? 7 : 4.2) * Math.min(seconds, 1) / length;
  const x = pose.x + (Math.sin(pose.yaw) * forward + Math.cos(pose.yaw) * sideways) * step;
  const z = pose.z + (Math.cos(pose.yaw) * forward - Math.sin(pose.yaw) * sideways) * step;
  return { ...pose, x: Math.max(-51.5, Math.min(51.5, x)), z: Math.max(-33, Math.min(33, z)) };
}

export function advanceFrame(pose: Pose, input: Movement, remainingSeconds: number, frameSeconds: number): { pose: Pose; remainingSeconds: number } {
  const elapsed = Math.max(0, Math.min(0.1, Number.isFinite(frameSeconds) ? frameSeconds : 0));
  const total = remainingSeconds + elapsed;
  const steps = Math.floor((total + 1e-9) / fixedStepSeconds);
  let next = pose;
  for (let index = 0; index < steps; index += 1) next = advancePose(next, input, fixedStepSeconds);
  return { pose: next, remainingSeconds: Math.max(0, total - steps * fixedStepSeconds) };
}

export function lookPose(pose: Pose, dx: number, dy: number, sensitivity: number, invertY: boolean): Pose {
  const scale = Math.max(0.1, Math.min(3, sensitivity)) * 0.002;
  return {
    ...pose,
    yaw: pose.yaw + dx * scale,
    pitch: Math.max(-1.2, Math.min(1.2, pose.pitch + dy * scale * (invertY ? 1 : -1))),
  };
}

export function cameraPose(pose: Pose, settings: CameraSettings): { position: [number, number, number]; target: [number, number, number] } {
  const eye: [number, number, number] = [pose.x, 1.7, pose.z];
  const forward = [Math.sin(pose.yaw) * Math.cos(pose.pitch), Math.sin(pose.pitch), Math.cos(pose.yaw) * Math.cos(pose.pitch)];
  const target: [number, number, number] = [eye[0] + forward[0] * 10, eye[1] + forward[1] * 10, eye[2] + forward[2] * 10];
  if (settings.mode === 'firstPerson') return { position: eye, target };
  const distance = Math.max(2, Math.min(8, settings.distance));
  const lateral = Math.max(-3, Math.min(3, settings.lateral));
  return {
    position: [eye[0] - Math.sin(pose.yaw) * distance + Math.cos(pose.yaw) * lateral, 2.1, eye[2] - Math.cos(pose.yaw) * distance - Math.sin(pose.yaw) * lateral],
    target,
  };
}
