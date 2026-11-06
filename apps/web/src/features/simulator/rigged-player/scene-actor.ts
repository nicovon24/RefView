import { createRiggedPlayer } from './model';
import { createRiggedPoseSampler } from './pose/sampler';
import type { PlayerVisualFrame } from './pose/frame';
import type { LocomotionSample } from './pose/locomotion';
import type { VerifiedPlayerResources } from './resources';

const ROSTER: Readonly<Record<string, Readonly<{ color: string; number: number }>>> = {
  'actor-001': { color: '#e6c34f', number: 8 },
  'actor-002': { color: '#e6c34f', number: 9 },
  'actor-003': { color: '#e6c34f', number: 10 },
  'actor-004': { color: '#76b596', number: 1 },
  'actor-005': { color: '#294b8f', number: 2 },
  'actor-006': { color: '#294b8f', number: 4 },
  'actor-007': { color: '#294b8f', number: 5 },
};

export type PublicActorFrame = Readonly<{
  actorHandle: string;
  position: Readonly<{ x: number; y: number; z: number }>;
  yawRad: number;
  clipHandle: string;
  phaseQ: number;
}>;

export function playerVisualFrame(tick: number, actor: PublicActorFrame): PlayerVisualFrame {
  return { tick, actorHandle: actor.actorHandle, rootPosition: actor.position,
    yawRad: actor.yawRad, clipHandle: actor.clipHandle, phaseQ: actor.phaseQ };
}

export function createRiggedSceneActor(actorHandle: string, resources: VerifiedPlayerResources,
  actorPlan?: readonly LocomotionSample[]) {
  const kit = ROSTER[actorHandle];
  if (!kit) throw new Error(`Unknown player actor: ${actorHandle}`);
  const player = createRiggedPlayer({ bodyScene: resources.bodyScene, hairScene: resources.hairScene,
    color: kit.color, number: kit.number, silhouette: 'athletic', kitStyle: 'solid' });
  let sampler: ReturnType<typeof createRiggedPoseSampler>;
  try {
    sampler = createRiggedPoseSampler(player, resources.clips, actorPlan);
  } catch (error) {
    player.dispose();
    throw error;
  }
  let disposed = false;
  const root = player.root;
  root.name = `player:${actorHandle}`;
  return {
    kind: 'rigged' as const,
    root,
    applyFrame(frame: PlayerVisualFrame) {
      if (disposed) throw new Error('Rigged scene actor is disposed');
      if (frame.actorHandle !== actorHandle) throw new Error(`Wrong player frame: ${frame.actorHandle}`);
      return sampler.applyFrame(frame);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      sampler.dispose();
      player.dispose();
    },
  };
}
