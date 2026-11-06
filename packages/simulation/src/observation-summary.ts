import { measureEvidenceAtTick } from "./observation-geometry";
import { validateObservationTraceV1, type ObservationTraceV1, type TrustedTraceContextV1 } from "./observation-trace";

export type ObservationBand = "none" | "weak" | "supported";
export type EvidenceObservationSummary = Readonly<{
  evidenceId: string; sampledTicks: number; jointTicks: number; cameraOnlyTicks: number;
  eyeOnlyTicks: number; neitherTicks: number; eligibleJointTicks: readonly number[];
  strongestChainReceipts: number; strongestChainSpanTicks: number; band: ObservationBand;
}>;
export type ObservationSummaryV1 = Readonly<{
  status: "scored" | "insufficientEvidence"; score: 0 | 40 | 100 | null;
  eligibleLiveTicks: number; evidence: readonly EvidenceObservationSummary[];
}>;
export type TrustedObservationScoringContextV1 = TrustedTraceContextV1 & Readonly<{
  rubric: Readonly<{
    scenarioRef: Readonly<{ scenarioId: string; version: number }>;
    scenarioContentHash: string;
    observationRubricVersion: 1;
    requiredEvidenceIds: readonly string[];
  }>;
}>;

function bandFor(receipts: number, span: number): ObservationBand {
  if (receipts >= 3 && span >= 4) return "supported";
  if (receipts >= 2 && span >= 1) return "weak";
  return "none";
}

export function summarizeObservationTraceV1(
  trace: ObservationTraceV1,
  context: TrustedObservationScoringContextV1,
): ObservationSummaryV1 {
  validateObservationTraceV1(trace, context);
  const { rubric } = context;
  if (!rubric || rubric.scenarioRef.scenarioId !== trace.scenarioRef.scenarioId
    || rubric.scenarioRef.version !== trace.scenarioRef.version
    || rubric.scenarioContentHash !== trace.scenarioContentHash
    || rubric.observationRubricVersion !== trace.observationRubricVersion) {
    throw new Error("observation rubric identity mismatch");
  }
  const { requiredEvidenceIds } = rubric;
  if (requiredEvidenceIds.length === 0) throw new Error("observation rubric requires evidence");
  const distinct = new Set(requiredEvidenceIds);
  if (distinct.size !== requiredEvidenceIds.length || [...distinct].some((id) => !context.fixture.evidence.some((entry) => entry.evidenceId === id))) {
    throw new Error("invalid required evidence IDs");
  }
  // C2-A has already rejected inactive, stale, and out-of-segment live receipts.
  const eligible = new Set(trace.renderReceipts.filter((receipt) => receipt.source === "live")
    .map((receipt) => `${receipt.epoch}:${receipt.tick}`));
  const evidence = requiredEvidenceIds.map((evidenceId): EvidenceObservationSummary => {
    const definition = context.fixture.evidence.find((entry) => entry.evidenceId === evidenceId)!;
    const counts = { jointTicks: 0, cameraOnlyTicks: 0, eyeOnlyTicks: 0, neitherTicks: 0 };
    const eligibleJointTicks: number[] = [];
    let strongestChainReceipts = 0;
    let strongestChainSpanTicks = 0;
    let bestBand: ObservationBand = "none";
    let runEpoch = -1;
    let previousJointTick = -2;
    let chainFirst = -1;
    let chainLast = -1;
    let chainReceipts = 0;
    const finishChain = () => {
      if (chainReceipts === 0) return;
      const span = chainLast - chainFirst;
      const band = bandFor(chainReceipts, span);
      const rank = { none: 0, weak: 1, supported: 2 };
      if (rank[band] > rank[bestBand] || (rank[band] === rank[bestBand]
        && (chainReceipts > strongestChainReceipts || (chainReceipts === strongestChainReceipts && span > strongestChainSpanTicks)))) {
        bestBand = band;
        strongestChainReceipts = chainReceipts;
        strongestChainSpanTicks = span;
      }
      chainFirst = -1; chainLast = -1; chainReceipts = 0;
    };
    const lastTick = Math.min(definition.toTick, trace.stopTick);
    for (let tick = definition.fromTick; tick <= lastTick; tick++) {
      const record = trace.views[tick]!;
      const measurement = measureEvidenceAtTick(context.fixture, evidenceId, tick, record.view);
      const key = `${measurement.classification}Ticks` as keyof typeof counts;
      counts[key]++;
      if (measurement.classification !== "joint") { finishChain(); previousJointTick = -2; continue; }
      if (record.epoch !== runEpoch || tick !== previousJointTick + 1) finishChain();
      runEpoch = record.epoch;
      previousJointTick = tick;
      if (!eligible.has(`${record.epoch}:${tick}`)) continue;
      eligibleJointTicks.push(tick);
      if (chainReceipts > 0 && tick - chainLast > 2) finishChain();
      if (chainReceipts === 0) chainFirst = tick;
      chainLast = tick;
      chainReceipts++;
    }
    finishChain();
    return Object.freeze({ evidenceId, sampledTicks: Math.max(0, lastTick - definition.fromTick + 1), ...counts,
      eligibleJointTicks: Object.freeze(eligibleJointTicks), strongestChainReceipts, strongestChainSpanTicks, band: bestBand });
  });
  const eligibleLiveTicks = eligible.size;
  const status = eligibleLiveTicks === 0 ? "insufficientEvidence" : "scored";
  const scores = { none: 0, weak: 40, supported: 100 } as const;
  const score = status === "scored" ? Math.min(...evidence.map((entry) => scores[entry.band])) as 0 | 40 | 100 : null;
  return Object.freeze({ status, score, eligibleLiveTicks, evidence: Object.freeze(evidence) });
}
