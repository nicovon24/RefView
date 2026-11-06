import { describe, expect, it } from "vitest";
import { createScenario, deriveScenarioContentHash, type ScenarioInput } from "./scenario";

function baseFixture(): ScenarioInput {
  return {
    schemaVersion: 1, ref: { scenarioId: "incident-001", version: 1 },
    contentHash: `sha256:${"a".repeat(64)}`,
    classification: "clear", lawsEdition: "IFAB-2026-27", competitionProfileId: "training",
    field: { lengthM: 105, widthM: 68, goalWidthM: 7.32, penaltyAreaDepthM: 16.5,
      penaltyAreaExtraWidthEachSideM: 16.5, lineWidthM: 0.12, attackDirection: "positiveZ" },
    decisionGate: { opensAtTick: 1, closesAtTick: 2, forcePauseAtTick: 2 },
    supportedRoles: ["mainReferee"],
    timeline: { ref: { scenarioId: "incident-001", version: 1 }, durationTicks: 2,
      samples: [0, 1, 2].map((tick) => ({ tick,
        actors: [{ actorId: "defence-04", position: { x: 1, y: 0, z: tick }, yawRad: 0,
          clipId: "run-loop", phaseQ: 0 }],
        ball: { position: { x: 0, y: 0, z: tick }, orientation: { qx: 0, qy: 0, qz: 0, qw: 1 } } })),
      events: [{ eventId: "EV-TRIP-CONTACT", tick: 1, ordinal: 0, kind: "offence",
        actorIds: ["defence-04"], payload: { reviewedLocation: "inside" } }] },
    cues: [{ cueId: "cue-001", tick: 1, ordinal: 0, kind: "animationCue", assetId: "run-loop" }],
    assetRegistry: [{ assetId: "run-loop", fingerprint: `sha256:${"1".repeat(64)}`,
      licenseRef: "original-refview" }],
    decisionOptions: [
      { optionId: "opt-001", kind: "stopPlay", value: false },
      { optionId: "opt-002", kind: "stopPlay", value: true },
      { optionId: "opt-003", kind: "restart", value: "playOn" },
      { optionId: "opt-004", kind: "restart", value: "directFreeKick" },
      { optionId: "opt-005", kind: "restart", value: "indirectFreeKick" },
      { optionId: "opt-006", kind: "restart", value: "droppedBall" },
      { optionId: "opt-007", kind: "restart", value: "penaltyKick" },
      { optionId: "opt-008", kind: "discipline", value: "none" },
      { optionId: "opt-009", kind: "discipline", value: "yellow" },
      { optionId: "opt-010", kind: "discipline", value: "red" },
    ],
    privateReview: { facts: { expectedRestart: "penaltyKick" },
      evidence: [{ evidenceId: "EV-TRIP-CONTACT", anchor: "inside" }],
      rubric: { expectedRestart: "penaltyKick" } },
  };
}
const hash = deriveScenarioContentHash(baseFixture());
function fixture(): ScenarioInput {
  const source = baseFixture();
  source.contentHash = hash;
  return source;
}
function reseal(source: ScenarioInput): ScenarioInput {
  source.contentHash = deriveScenarioContentHash(source);
  return source;
}
function walk(value: unknown, visit: (value: string) => void): void {
  if (typeof value === "string") visit(value);
  else if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      visit(key);
      walk(child, visit);
    }
  }
}

describe("challenge-safe scenario boundary", () => {
  it("serializes only the exact playable allowlist and no private keys or semantic IDs", () => {
    const source = fixture();
    const scenario = createScenario(source, { ref: source.ref, contentHash: hash });
    const dto = JSON.parse(JSON.stringify(scenario.playable("mainReferee"))) as Record<string, unknown>;
    expect(Object.keys(dto).sort()).toEqual(["actors", "ball", "contentHash", "cues", "decisionGate",
      "decisionOptions", "durationTicks", "field", "lawsEdition", "ref", "role", "tickRateHz"].sort());
    const serialized = JSON.stringify(dto);
    for (const forbidden of ["privateReview", "facts", "evidence", "rubric", "expectedRestart",
      "reviewedLocation", "events", "eventId", "EV-TRIP-CONTACT", "offence", "penalty/no-card"])
      walk(dto, (item) => expect(item).not.toContain(forbidden));
    expect(dto.actors).toHaveLength(3);
    expect(JSON.stringify(dto)).not.toContain("defence-04");
    expect(JSON.stringify(dto)).not.toContain("run-loop");
    expect(scenario.timeline.events[0]?.eventId).toBe("EV-TRIP-CONTACT");
    source.timeline.samples[0]!.actors[0]!.position.x = 999;
    source.supportedRoles.push("var");
    expect(JSON.stringify(scenario.playable("mainReferee"))).toBe(serialized);
    expect(() => scenario.playable("var")).toThrow();
    expect(Object.isFrozen(scenario.privateReview)).toBe(true);
  });

  it("rejects mismatched identities, hashes and versions", () => {
    const source = fixture();
    expect(() => createScenario(source, { ref: source.ref, contentHash: `sha256:${"b".repeat(64)}` })).toThrow();
    expect(() => createScenario({ ...source, schemaVersion: 2 as 1 }, { ref: source.ref, contentHash: hash })).toThrow();
    expect(() => createScenario({ ...source, timeline: { ...source.timeline,
      ref: { scenarioId: "synthetic", version: 2 } } }, { ref: source.ref, contentHash: hash })).toThrow();
  });

  it("rejects invalid gates, cue IDs, private identifiers and hidden public fields", () => {
    const source = fixture();
    const expected = { ref: source.ref, contentHash: hash };
    expect(() => createScenario({ ...source, decisionGate: { opensAtTick: 2, closesAtTick: 1,
      forcePauseAtTick: 2 } }, expected)).toThrow();
    expect(() => createScenario({ ...source, decisionGate: { opensAtTick: 1, closesAtTick: 2,
      forcePauseAtTick: 3 } }, expected)).toThrow();
    expect(() => createScenario({ ...source, cues: [{ ...source.cues[0]!, cueId: "EV-TRIP-CONTACT" }] }, expected)).toThrow();
    expect(() => createScenario({ ...source, cues: [{ ...source.cues[0]!, assetId: "EV-TRIP-CONTACT" }] }, expected)).toThrow();
    const semanticClip = fixture();
    semanticClip.timeline.samples[0]!.actors[0]!.clipId = "EV-TRIP-CONTACT";
    expect(() => createScenario(semanticClip, expected)).toThrow();
    expect(() => createScenario({ ...source, decisionOptions: [{ ...source.decisionOptions[0]!,
      expectedRestart: "penaltyKick" } as ScenarioInput["decisionOptions"][number]] }, expected)).toThrow();
    expect(() => createScenario({ ...source, field: { ...source.field,
      answerKey: "penaltyKick" } as ScenarioInput["field"] }, expected)).toThrow();
  });

  it("maps semantic canonical IDs to stable opaque handles and resolves only public submitted handles", () => {
    const expected = { ref: fixture().ref, contentHash: hash };
    const actor = fixture();
    for (const sample of actor.timeline.samples) sample.actors.push({ ...sample.actors[0]!, actorId: "attacker-09" });
    const scenario = createScenario(reseal(actor), { ...expected, contentHash: actor.contentHash });
    const playable = scenario.playable("mainReferee");
    expect(playable.actors[0]!.actors.map((item) => item.actorId)).toEqual(["actor-001", "actor-002"]);
    expect(playable.actors[2]!.actors.map((item) => item.actorId)).toEqual(["actor-001", "actor-002"]);
    expect(playable.actors[0]!.actors.map((item) => item.clipId)).toEqual(["asset-001", "asset-001"]);
    expect(playable.cues[0]!.assetId).toBe("asset-001");
    expect(scenario.resolveActorHandle("actor-002")).toBe("defence-04");
    expect(() => scenario.resolveActorHandle("defence-04")).toThrow();
    expect(() => scenario.resolveActorHandle("actor-999")).toThrow();
    expect(scenario.publicActorHandle("defence-04")).toBe("actor-002");
    expect(() => scenario.publicActorHandle("actor-002")).toThrow();
    expect(JSON.stringify(playable)).not.toMatch(/defence-04|attacker-09|run-loop/);
  });

  it("rejects reserved IDs, incomplete/duplicate/unused asset bindings and roster overflow", () => {
    const expected = { ref: fixture().ref, contentHash: hash };
    const reserved = fixture();
    for (const sample of reserved.timeline.samples) sample.actors[0]!.actorId = "actor-001";
    reserved.timeline.events[0]!.actorIds = ["actor-001"];
    expect(() => createScenario(reserved, expected)).toThrow();
    const missing = fixture();
    missing.assetRegistry = [];
    expect(() => createScenario(missing, expected)).toThrow();
    const duplicate = fixture();
    duplicate.assetRegistry.push({ ...duplicate.assetRegistry[0]! });
    expect(() => createScenario(duplicate, expected)).toThrow();
    const repeatedFingerprint = fixture();
    repeatedFingerprint.assetRegistry.push({ assetId: "other-loop",
      fingerprint: repeatedFingerprint.assetRegistry[0]!.fingerprint, licenseRef: "original-refview" });
    repeatedFingerprint.cues[0] = { ...repeatedFingerprint.cues[0]!, assetId: "other-loop" };
    expect(() => createScenario(repeatedFingerprint, expected)).toThrow();
    const unused = fixture();
    unused.assetRegistry.push({ assetId: "unused", fingerprint: `sha256:${"2".repeat(64)}`,
      licenseRef: "original-refview" });
    expect(() => createScenario(unused, expected)).toThrow();
    const overflow = fixture();
    for (const sample of overflow.timeline.samples)
      for (let index = 2; index <= 1000; index++) sample.actors.push({ ...sample.actors[0]!, actorId: `player-${index}` });
    expect(() => createScenario(overflow, expected)).toThrow();
  });

  it("assigns the same asset handles by Unicode code-unit order across clips and cues", () => {
    const source = fixture();
    source.assetRegistry.unshift({ assetId: "z-sound", fingerprint: `sha256:${"2".repeat(64)}`,
      licenseRef: "original-refview" });
    source.cues.push({ cueId: "cue-002", tick: 2, ordinal: 0, kind: "audioCue", assetId: "z-sound" });
    const scenario = createScenario(reseal(source), { ref: source.ref, contentHash: source.contentHash });
    expect(scenario.playable("mainReferee").actors[0]!.actors[0]!.clipId).toBe("asset-001");
    expect(scenario.playable("mainReferee").cues.map((cue) => cue.assetId))
      .toEqual(["asset-001", "asset-002"]);
    source.assetRegistry[0] = { ...source.assetRegistry[0]!, assetId: "mutated" };
    expect(scenario.assetRegistry[1]!.assetId).toBe("z-sound");
  });

  it("rejects roles without a v1 role-specific decision task", () => {
    const source = fixture();
    source.supportedRoles.push("assistantReferee");
    expect(() => createScenario(source, { ref: source.ref, contentHash: hash })).toThrow();
  });
  it("rejects ruling-revealing scenario identity", () => {
    const revealing = fixture();
    revealing.ref = { scenarioId: "penalty-boundary-trip", version: 1 };
    revealing.timeline.ref = { ...revealing.ref };
    expect(() => createScenario(revealing, { ref: revealing.ref, contentHash: hash })).toThrow();
  });
  it("rejects answer-leading incomplete choices", () => {
    const singleton = fixture();
    singleton.decisionOptions = [{ optionId: "opt-001", kind: "restart", value: "penaltyKick" }];
    expect(() => createScenario(singleton, { ref: singleton.ref, contentHash: hash })).toThrow();
  });
  it("rejects a caller-chosen digest even when trusted metadata repeats it", () => {
    const source = fixture();
    const chosenHash = `sha256:${"f".repeat(64)}` as const;
    source.contentHash = chosenHash;
    expect(() => createScenario(source, { ref: source.ref, contentHash: chosenHash })).toThrow();
  });
  it("derives the same digest after prescribed array reordering and key reordering", () => {
    const source = fixture();
    source.timeline.events.push({ eventId: "EV-PASS", tick: 0, ordinal: 0, kind: "ballTouch",
      actorIds: ["defence-04"], payload: { z: -0, a: { second: 2, first: 1 } } });
    source.cues.push({ cueId: "cue-002", tick: 2, ordinal: 0, kind: "audioCue", assetId: "sound" });
    source.assetRegistry.push({ assetId: "sound", fingerprint: `sha256:${"2".repeat(64)}`,
      licenseRef: "original-refview" });
    const original = deriveScenarioContentHash(source);
    const reordered = structuredClone(source);
    reordered.timeline.samples.reverse();
    reordered.timeline.events.reverse();
    reordered.cues.reverse();
    reordered.assetRegistry.reverse();
    reordered.decisionOptions.reverse();
    reordered.timeline.events[0]!.payload = { a: { first: 1, second: 2 }, z: 0 };
    expect(deriveScenarioContentHash(reordered)).toBe(original);
  });
  it("changes the digest for immutable content but excludes mutable review record identity", () => {
    const source = fixture();
    const original = deriveScenarioContentHash(source);
    const publicationMetadata = { reviewRecordId: "later-review" };
    expect(publicationMetadata.reviewRecordId).toBe("later-review");
    expect(deriveScenarioContentHash(source)).toBe(original);
    const changed = fixture();
    changed.privateReview = { ...changed.privateReview, facts: { expectedRestart: "playOn" } };
    expect(deriveScenarioContentHash(changed)).not.toBe(original);
    expect(() => createScenario(changed, { ref: changed.ref, contentHash: original })).toThrow();
    const movement = fixture();
    movement.timeline.samples[1]!.actors[0]!.position.x = 5;
    expect(deriveScenarioContentHash(movement)).not.toBe(original);
  });
  it("rejects non-JSON and nonfinite nested content", () => {
    const source = fixture();
    source.privateReview = { ...source.privateReview, facts: { expectedRestart: undefined } };
    expect(() => deriveScenarioContentHash(source)).toThrow();
    source.privateReview = { ...source.privateReview, facts: { expectedRestart: Number.NaN } };
    expect(() => deriveScenarioContentHash(source)).toThrow();
  });
  it("matches an independent Web Crypto SHA-256 over the prescribed baseline tuple", async () => {
    const source = baseFixture();
    const content: Record<string, unknown> = Object.fromEntries(
      Object.entries(source).filter(([key]) => key !== "contentHash"));
    content.privateReview = { facts: source.privateReview.facts,
      evidence: source.privateReview.evidence, rubric: source.privateReview.rubric };
    const sortKeys = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(sortKeys);
      if (value && typeof value === "object") return Object.fromEntries(
        Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
          .map(([key, child]) => [key, sortKeys(child)]));
      return value;
    };
    const bytes = new TextEncoder().encode(JSON.stringify(["refview-scenario-content-v1", sortKeys(content)]));
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    const expected = `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    expect(deriveScenarioContentHash(source)).toBe(expected);
  });
  it("rejects sparse, extra-property and accessor arrays before normalization", () => {
    const sparse = fixture();
    Reflect.deleteProperty(sparse.timeline.samples, "1");
    Object.defineProperty(sparse.timeline.samples, "hiddenFact", { value: "private", enumerable: true });
    expect(() => deriveScenarioContentHash(sparse)).toThrow();
    const extra = fixture();
    Object.defineProperty(extra.cues, "secret", { value: 1, enumerable: true });
    expect(() => deriveScenarioContentHash(extra)).toThrow();
    const accessor = fixture();
    Object.defineProperty(accessor.decisionOptions, "0", { get: () => fixture().decisionOptions[0],
      enumerable: true, configurable: true });
    expect(() => deriveScenarioContentHash(accessor)).toThrow();
  });
  it("rejects hidden, symbol and accessor object properties and unknown timeline fields", () => {
    const hidden = fixture();
    Object.defineProperty(hidden.field, "privateAnswer", { value: "penaltyKick" });
    expect(() => deriveScenarioContentHash(hidden)).toThrow();
    const symbol = fixture();
    Object.defineProperty(symbol.privateReview.facts, Symbol("secret"), { value: "penaltyKick" });
    expect(() => deriveScenarioContentHash(symbol)).toThrow();
    const accessor = fixture();
    Object.defineProperty(accessor.timeline.events[0]!.payload, "secret", { get: () => "private",
      enumerable: true });
    expect(() => deriveScenarioContentHash(accessor)).toThrow();
    const extra = fixture();
    Object.defineProperty(extra.timeline, "hiddenFact", { value: "private", enumerable: true });
    expect(() => deriveScenarioContentHash(extra)).toThrow();
    expect(() => createScenario(extra, { ref: extra.ref, contentHash: extra.contentHash })).toThrow();
  });
  it("preserves an own __proto__ fact as immutable private data", () => {
    const source = fixture();
    const facts = Object.create(null) as Record<string, unknown>;
    Object.defineProperty(facts, "__proto__", { value: { answer: "penaltyKick" }, enumerable: true });
    source.privateReview = { ...source.privateReview, facts };
    reseal(source);
    const scenario = createScenario(source, { ref: source.ref, contentHash: source.contentHash });
    expect(Object.hasOwn(scenario.privateReview.facts, "__proto__")).toBe(true);
    expect(scenario.privateReview.facts["__proto__"]).toEqual({ answer: "penaltyKick" });
    expect(Object.isFrozen(scenario.privateReview.facts["__proto__"])).toBe(true);
  });
  it("keeps publication reviewRecordId outside immutable scenario input", () => {
    const source = fixture();
    expect(Object.hasOwn(source.privateReview, "reviewRecordId")).toBe(false);
    expect(Object.hasOwn(createScenario(source, { ref: source.ref, contentHash: source.contentHash })
      .privateReview, "reviewRecordId")).toBe(false);
    const withPublication = fixture();
    Object.defineProperty(withPublication.privateReview, "reviewRecordId", {
      value: "review-outside-content", enumerable: true });
    expect(() => createScenario(withPublication, { ref: withPublication.ref,
      contentHash: withPublication.contentHash })).toThrow();
  });
  it("rejects extra enumerable root content before authoring a digest", () => {
    const source = fixture();
    Object.defineProperty(source, "hiddenAnswer", { value: "penaltyKick", enumerable: true });
    expect(() => deriveScenarioContentHash(source)).toThrow();
  });
});
