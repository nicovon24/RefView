import { createHash } from "node:crypto";
import { createTimelineFixture, type TimelineFixtureInput } from "@refview/domain";
import { createObservationFixture, type ObservationFixtureInput } from "@refview/simulation";
import { canonicalJsonV2, normalizeCoreSourceV2 } from "./source-core-v2";
import { normalizeRenderingV2 } from "./source-rendering-v2";
import { normalizeObservationSourceV2 } from "./source-observation-v2";
import { normalizeSourceCitationsV2 } from "./source-citations-v2";
import { normalizeDecisionSourceV2 } from "./source-decision-v2";
import { verifyGeometryCorrespondenceV2, type GeometryResolverV2 } from "./geometry-correspondence-v2";
import { projectPublicScenarioV2 } from "./public-projection-v2";

const ROOT_KEYS = ["schemaVersion", "purpose", "ref", "classification", "supportedRoles",
  "lawsEdition", "competitionProfile", "field", "timeline", "decisionGate", "initialRefereePose",
  "rendering", "decisionOptions", "officialSources", "facts", "observation", "geometryBindings",
  "rubric", "preparedDebrief"] as const;
const CORE_KEYS = ["schemaVersion", "purpose", "ref", "classification", "supportedRoles",
  "lawsEdition", "competitionProfile", "field", "timeline", "decisionGate", "initialRefereePose",
  "facts"] as const;

export type CompilerDependenciesV2 = GeometryResolverV2 & Readonly<{
  resolveAssetBytes: (assetId: string, neutralClientPath: string) => Uint8Array | undefined;
}>;

function near(a: Readonly<{ x: number; y: number; z: number }>,
  b: Readonly<{ x: number; y: number; z: number }>): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) <= 0.05;
}

function verifyDecisiveFacts(
  core: ReturnType<typeof normalizeCoreSourceV2>,
  geometry: ReturnType<typeof normalizeObservationSourceV2>,
): void {
  const contactTick = core.facts.contactTick;
  const atContact = (evidenceId: string) => {
    const evidence = geometry.observation.evidence.find((item) => item.evidenceId === evidenceId);
    if (!evidence || evidence.fromTick > contactTick || evidence.toTick < contactTick) {
      throw new Error(`decisive evidence window misses contact: ${evidenceId}`);
    }
    const sample = evidence.samples.find((item) => item.tick === contactTick);
    if (!sample) throw new Error(`decisive evidence sample missing: ${evidenceId}`);
    return sample;
  };
  const bindingFor = (evidenceId: string, anchorId: string) =>
    geometry.geometryBindings.anchors.find((item) =>
      item.evidenceId === evidenceId && item.anchorId === anchorId)?.target;
  const trip = atContact("EV-TRIP-CONTACT");
  const tripRequired = geometry.observation.evidence.find((item) =>
    item.evidenceId === "EV-TRIP-CONTACT")!.requiredAnchorIds;
  const tripPoint = { x: core.facts.contactGround.x, y: 0.34, z: core.facts.contactGround.z };
  const tripAnchor = (actorId: string) => trip.anchors.find((anchor) => {
    const target = bindingFor("EV-TRIP-CONTACT", anchor.anchorId);
    return tripRequired.includes(anchor.anchorId) &&
      target?.kind === "actorAttachment" && target.actorId === actorId;
  });
  const receiverFoot = tripAnchor(core.facts.receiverActorId);
  const offenderFoot = tripAnchor(core.facts.offenderActorId);
  if (!receiverFoot || !offenderFoot || !near(receiverFoot.position, tripPoint) ||
    Math.hypot(receiverFoot.position.x - offenderFoot.position.x,
      receiverFoot.position.y - offenderFoot.position.y,
      receiverFoot.position.z - offenderFoot.position.z) > 0.25) {
    throw new Error("trip contact geometry contradicts canonical fact");
  }
  const inside = atContact("EV-INSIDE-AREA");
  const contactActors = new Set<string>([core.facts.receiverActorId, core.facts.offenderActorId]);
  const ground = inside.anchors.some((anchor) => {
    const target = bindingFor("EV-INSIDE-AREA", anchor.anchorId);
    return target?.kind === "actorAttachment" &&
      contactActors.has(target.actorId) &&
      near(anchor.position, core.facts.contactGround);
  });
  const line = inside.anchors.some((anchor) => {
    const target = bindingFor("EV-INSIDE-AREA", anchor.anchorId);
    return target?.kind === "fieldPoint" &&
      Math.abs(target.xM - core.facts.contactGround.x) <= 0.05 &&
      near(anchor.position, { x: target.xM, y: 0, z: 36 });
  });
  if (!ground || !line) throw new Error("area evidence geometry contradicts canonical fact");
}

/** This compiler derives every immutable identity from one strict authoring source. */
export function compileCanonicalScenarioSourceV2(input: unknown, dependencies: CompilerDependenciesV2) {
  const detached: unknown = JSON.parse(canonicalJsonV2(input));
  if (detached === null || typeof detached !== "object" || Array.isArray(detached)) {
    throw new TypeError("canonical source must be an object");
  }
  const root = detached as Record<string, unknown>;
  const actual = Object.keys(root);
  if (actual.length !== ROOT_KEYS.length || actual.some((key) => !ROOT_KEYS.includes(key as typeof ROOT_KEYS[number]))) {
    throw new TypeError("canonical source has invalid fields");
  }
  const coreInput = Object.fromEntries(CORE_KEYS.map((key) => [key, root[key]]));
  const core = normalizeCoreSourceV2(coreInput);
  const actorIds = core.timeline.samples[0]!.actors.map((actor) => actor.actorId);
  const timelineClipRefs = core.timeline.samples.flatMap((sample) =>
    sample.actors.map((actor) => ({ actorId: actor.actorId, clipId: actor.clipId })));
  const rendering = normalizeRenderingV2(root.rendering, {
    actorIds, timelineClipRefs,
    resolveAssetBytes: (assetId, path) => {
      const bytes = dependencies.resolveAssetBytes(assetId, path);
      if (!(bytes instanceof Uint8Array)) throw new TypeError(`missing asset bytes for ${assetId}`);
      return bytes;
    },
  });
  const assetsById = new Map(rendering.assets.map((asset) => [asset.assetId, asset]));
  const rigNames = new Map(rendering.actorBindings.map((binding) => {
    const rig = assetsById.get(binding.rigAssetId);
    if (!rig) throw new Error("missing actor rig asset");
    return [binding.actorId, { attachments: rig.attachmentNames, parts: rig.geometryPartNames }] as const;
  }));
  const geometry = normalizeObservationSourceV2(root.observation, root.geometryBindings, rigNames);
  const evidenceIds = geometry.observation.evidence.map((item) => item.evidenceId);
  const citations = normalizeSourceCitationsV2(root.officialSources, root.preparedDebrief, evidenceIds);
  const decision = normalizeDecisionSourceV2(root.decisionOptions, root.rubric, evidenceIds,
    actorIds, citations.preparedDebrief.contentId);
  if (decision.rubric.decision.expected.offenderActorId !== core.facts.offenderActorId) {
    throw new Error("rubric offender contradicts canonical facts");
  }
  verifyDecisiveFacts(core, geometry);
  const correspondence = verifyGeometryCorrespondenceV2(core, rendering, geometry, dependencies);
  const canonicalSource = Object.freeze({ ...core, rendering, decisionOptions: decision.decisionOptions,
    officialSources: citations.officialSources, observation: geometry.observation,
    geometryBindings: geometry.geometryBindings, rubric: decision.rubric,
    preparedDebrief: citations.preparedDebrief });
  const contentHash = `sha256:${createHash("sha256")
    .update(canonicalJsonV2(["refview-scenario-content-v2", canonicalSource]), "utf8")
    .digest("hex")}` as const;
  const projection = projectPublicScenarioV2(core, rendering, decision, contentHash);
  const timelineInput = JSON.parse(canonicalJsonV2(core.timeline)) as TimelineFixtureInput;
  const timeline = createTimelineFixture(timelineInput);
  const observationInput = JSON.parse(canonicalJsonV2({
    ref: core.ref, scenarioContentHash: contentHash, durationTicks: core.timeline.durationTicks,
    ...geometry.observation,
  })) as ObservationFixtureInput;
  const observationFixture = createObservationFixture(observationInput, timeline, contentHash);
  const boundRubric = Object.freeze({ ref: core.ref, scenarioContentHash: contentHash,
    rubric: decision.rubric });
  const privateContext = Object.freeze({ ref: core.ref, contentHash, facts: core.facts,
    observationFixture, geometryBindings: geometry.geometryBindings, boundRubric,
    preparedDebrief: citations.preparedDebrief,
    officialSources: citations.officialSources });
  return Object.freeze({ canonicalSource, profileIdentity: core.competitionProfile,
    profileHash: core.competitionProfileHash, contentHash,
    playable: projection.playable, privateContext,
    canonicalToPublicActorHandles: projection.canonicalToPublicActorHandles,
    canonicalToPublicAssetHandles: projection.canonicalToPublicAssetHandles,
    requiredCaptureTicks: correspondence.requiredCaptureTicks });
}

/** Server-side read path for the stored canonical form; authoring still rejects derived fields. */
export function recompileStoredCanonicalSourceV2(
  storedInput: unknown, dependencies: CompilerDependenciesV2,
): ReturnType<typeof compileCanonicalScenarioSourceV2> {
  const detached: unknown = JSON.parse(canonicalJsonV2(storedInput));
  if (detached === null || typeof detached !== "object" || Array.isArray(detached)) {
    throw new TypeError("stored canonical source must be an object");
  }
  const stored = detached as Record<string, unknown>;
  const keys = Object.keys(stored);
  if (keys.length !== ROOT_KEYS.length + 1 ||
    !keys.includes("competitionProfileHash") ||
    keys.some((key) => key !== "competitionProfileHash" && !ROOT_KEYS.includes(key as typeof ROOT_KEYS[number]))) {
    throw new TypeError("stored canonical source has invalid fields");
  }
  const { competitionProfileHash, ...authoringSource } = stored;
  const compiled = compileCanonicalScenarioSourceV2(authoringSource, dependencies);
  if (competitionProfileHash !== compiled.profileHash ||
    canonicalJsonV2(stored) !== canonicalJsonV2(compiled.canonicalSource)) {
    throw new Error("stored canonical source mismatch");
  }
  return compiled;
}
