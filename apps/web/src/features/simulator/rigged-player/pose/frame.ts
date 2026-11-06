export type PlayerVisualFrame = Readonly<{
  tick: number;
  actorHandle: string;
  rootPosition: Readonly<{ x: number; y: number; z: number }>;
  yawRad: number;
  clipHandle: string;
  phaseQ: number;
}>;

export const PUBLIC_MOTION = Object.freeze({ run: 'asset-003', fall: 'asset-004', challenge: 'asset-001' });
