import type { DecisionGate } from "./scenario";

export type Restart = "playOn" | "penaltyKick" | "directFreeKick" | "indirectFreeKick" | "droppedBall";
export type Discipline = "none" | "yellow" | "red";
export type NormalizedDecision = Readonly<{
  decisionTick: number; stopPlay: boolean; restart: Restart; discipline: Discipline;
  offenderActorId: string | null;
}>;
export type TrustedDecisionContext = Readonly<{
  decisionGate: DecisionGate; decidingTick: number; traceStopTick: number;
  canonicalActorIds: readonly string[]; resolveActorHandle(handle: string): string;
}>;

function exact(value: unknown, keys: readonly string[]): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join("|") !== [...keys].sort().join("|"))
    throw new TypeError("invalid decision fields");
}

/** Server caller supplies the pinned gate, recorded deciding/trace ticks, and trusted handle resolver. */
export function normalizeDecision(transport: unknown, context: TrustedDecisionContext): NormalizedDecision {
  exact(transport, ["decisionTick", "stopPlay", "restart", "discipline", "offenderActorHandle"]);
  const { decisionTick, stopPlay, restart, discipline, offenderActorHandle } = transport;
  const gate = context.decisionGate;
  if (!Number.isSafeInteger(decisionTick) || (decisionTick as number) < gate.opensAtTick
    || (decisionTick as number) > gate.closesAtTick || (decisionTick as number) > gate.forcePauseAtTick
    || decisionTick !== context.decidingTick || decisionTick !== context.traceStopTick)
    throw new RangeError("invalid decision tick");
  if (typeof stopPlay !== "boolean" || !["playOn", "penaltyKick", "directFreeKick",
    "indirectFreeKick", "droppedBall"].includes(restart as string)
    || !["none", "yellow", "red"].includes(discipline as string)
    || stopPlay !== (restart !== "playOn")) throw new TypeError("invalid decision semantics");
  if (offenderActorHandle !== null && (typeof offenderActorHandle !== "string"
    || !/^actor-[0-9]{3}$/.test(offenderActorHandle))) throw new TypeError("invalid actor handle");
  if (discipline !== "none" && offenderActorHandle === null)
    throw new TypeError("card requires offender");
  const offenderActorId = offenderActorHandle === null ? null
    : context.resolveActorHandle(offenderActorHandle as string);
  if (offenderActorId !== null && !context.canonicalActorIds.includes(offenderActorId))
    throw new TypeError("offender outside pinned roster");
  return Object.freeze({ decisionTick: decisionTick as number, stopPlay,
    restart: restart as Restart, discipline: discipline as Discipline, offenderActorId });
}
