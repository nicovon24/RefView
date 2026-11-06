# Full-source authoring and publication boundary (proposed v2)

This contract supersedes the narrow `ScenarioInput` hash only for authored-training publication. Existing synthetic rows and tests retain their v1 identity until explicitly migrated. It does not assert that the first incident has passed rendered-evidence review.

## One canonical input

The normal authoring API accepts one `CanonicalScenarioSourceV2` value. It does not accept a caller-selected content hash, public/private projection, bound observation fixture, or publication state. The compiler validates and derives those outputs. Version 2 is limited to the approved clear, main-referee, 60 Hz, at-most-480-tick incident; other roles and classifications require new contracts.

The source has this exact top-level shape. Referenced types are `TimelineFixtureInputV2` from [`canonical-events-v2.md`](canonical-events-v2.md), plus the already versioned `FieldGeometry`, `DecisionGate`, `ObservationFixtureInput` (with its derived identity fields omitted), and `ClearPenaltyMainRefereeRubricV1`. A compiler must still validate their nested keys and cross-references rather than trusting TypeScript types.

```ts
type CanonicalScenarioSourceV2 = Readonly<{
  schemaVersion: 2; purpose: "authoredTraining";
  ref: { scenarioId: "incident-001"; version: number };
  classification: "clear"; supportedRoles: readonly ["mainReferee"];
  lawsEdition: "IFAB-2026-27";
  competitionProfile: {
    profileId: string; version: number;
    settings: {
      matchKind: "fictionalTraining"; format: "senior11v11";
      durationMinutes: 90; fieldLengthM: 105; fieldWidthM: 68;
      goalWidthM: 7.32; goalHeightM: 2.44;
      modifications: readonly []; varEnabled: true;
    };
  };
  field: FieldGeometry;
  timeline: TimelineFixtureInputV2;
  decisionGate: DecisionGate;
  initialRefereePose: { position: { x: number; y: 0; z: number }; lookYaw: number; lookPitch: number };
  rendering: {
    assets: readonly AssetRecord[];
    actorBindings: readonly { actorId: string; rigAssetId: string; clipAssetIds: readonly string[] }[];
    safeCues: readonly { cueId: string; tick: number; ordinal: number; kind: "animationCue" | "audioCue"; assetId: string }[];
  };
  decisionOptions: readonly PublicDecisionOption[];
  officialSources: readonly OfficialSource[];
  facts: {
    passTick: 120; passerActorId: "attack-08"; receiverActorId: "attack-09"; onsideMarginM: number;
    contactTick: 366; offenderActorId: "defence-04";
    contactGround: { x: 13.8; y: 0; z: 36.8 };
    ballInPlay: true; defenderPlayedBall: false; contactIntensity: "careless";
    coveringDefenderActorId: "defence-05"; obviousGoalOpportunity: false;
    separateMisconduct: false; expectedRestart: "penaltyKick"; expectedDiscipline: "none";
  };
  observation: Omit<ObservationFixtureInput,
    "ref" | "scenarioContentHash" | "durationTicks">;
  geometryBindings: {
    anchors: readonly { evidenceId: string; anchorId: string; target:
      | { kind: "actorAttachment"; actorId: string; attachmentName: string }
      | { kind: "ballCenter" }
      | { kind: "fieldPoint"; feature: "nearPenaltyAreaLine"; xM: number } }[];
    occluders: readonly { evidenceId: string; boxId: string; actorId: string;
      geometryPartName: string }[];
  };
  rubric: ClearPenaltyMainRefereeRubricV1;
  preparedDebrief: {
    contentId: string;
    sections: readonly { sectionId: string; es: string; en: string;
      evidenceIds: readonly string[]; sourceIds: readonly string[] }[];
  };
}>;
type AssetRecord = Readonly<{
  assetId: string; kind: "proceduralModule" | "file";
  neutralClientPath: string; sha256: `sha256:${string}`;
  creator: string; origin: string; licenseId: string; licenseEvidence: string;
  attachmentNames: readonly string[]; geometryPartNames: readonly string[];
}>;
type OfficialSource = Readonly<{
  sourceId: string; edition: "IFAB-2026-27"; documentUrl: string;
  lawAndSection: string; inspectedArtifactSha256: `sha256:${string}`;
  provenance: string;
}>;
```

The source contains these declared categories:

- `schemaVersion: 2`, `purpose: "authoredTraining"`, neutral `ref`, classification, role, and `IFAB-2026-27` edition.
- A versioned competition profile with the literal approved settings above. Its hash is derived from the normalized profile identity and settings, not accepted from the caller.
- Field geometry, complete canonical actor/ball timeline, safe cues, decision gate, and authored initial referee ground pose and look. The timeline has seven footballer IDs; the user-controlled referee is separate.
- Rendering dependencies: every procedural geometry definition or external asset byte fingerprint, declared rig attachment and geometry-part names, actor/cue binding, neutral client path, creator/origin, license evidence, and a stable canonical asset ID. Client handles and paths must not reveal the ruling.
- Official sources with stable IDs, exact edition, document URL, law/section locator, inspected artifact fingerprint, and provenance. `/latest/` links are navigation references only, not immutable edition fingerprints.
- Typed canonical facts, private evidence geometry/windows, observation model/rig/calibration versions, camera colliders, private decision/observation rubric, and the actual prepared Spanish and English debrief text with source/evidence references.

Any field needed to render, establish, evaluate, explain, or cite the incident is immutable source content. Publication review identity, reviewer, timestamps, and audit events are separate mutable lifecycle records and never enter the content hash. The source cannot contain bound `scenarioContentHash` fields to avoid self-reference; the compiler inserts its derived hash into downstream C1/C2 and public/private projections.

## Validation, normalization, and derivation

Reject unknown keys, non-plain objects, accessors, symbols, hidden properties, sparse arrays, non-JSON values, unsafe integers where ticks/versions are required, nonfinite numbers, and duplicate IDs. Reject unsupported editions, roles, versions, durations, or geometry. Validate all cross-references among actor roster, timeline events, cues, asset bindings, evidence anchors/occluders, geometry bindings, required evidence, rubric key, official sources, and debrief references. Every `(evidenceId, anchorId)` and `(evidenceId, boxId)` present in any sample has exactly one geometry binding for that evidence; no unused binding is allowed. Actor targets refer to the authored roster; their attachment/part names must be declared by that actor's bound rig asset. Ball and field features resolve from the canonical ball track and field geometry. The first authored fixture must have exactly `durationTicks=480`, complete inclusive ticks `0..480`, gate `360/480/480`, pass tick `120`, contact tick `366` at ground projection `(13.80, 0, 36.80)`, a `>=1.5 m` onside margin, complete seven-player roster, covering `defence-05`, ball in play, no ball touch, careless trip, non-DOGSO, no separate misconduct, and penalty/no-card key. Require a `ballTouch` event at tick `120` with sole participant `attack-08`, `contact` and `offence` events at tick `366` with participants `attack-09`/`defence-04`, and a participant-free `whistleWindow` start marker at tick `372`; reject any `ballTouch` by `defence-04` during the full challenge interval `356..371`. Typed facts, not participant order or event payload, assign passer, offender, receiver, and interpretation. Empty or contradictory event lists fail. These assertions validate canonical facts; renderer correspondence remains a separate visual gate.

Normalize object keys recursively and negative zero to zero. The profile digest payload is `["refview-competition-profile-v1", {profileId, version, settings}]` with normalized settings; no caller hash field participates. The normalized scenario retains the full `competitionProfile` value and **adds** `competitionProfileHash` before hashing, so a profile setting and its derived hash are both covered. Sort declared sets by stable ID: each tick's actor samples by canonical actor ID; timeline samples by tick; events by `(tick, ordinal, eventId)` and each event's `actorIds` by canonical ID under the exact empty-payload v2 event contract; observation evidence by evidence ID and its samples by tick; each sample's anchors/occluders and each evidence's required anchor IDs by ID; geometry binding anchors by `(evidenceId, anchorId)` and occluders by `(evidenceId, boxId)`; rendering assets/actor bindings and each actor's clip IDs by ID; each asset's attachment/geometry-part names by name; safe cues by `(tick, ordinal, cueId)`; decision options by option ID; official sources by source ID; rubric decision evidence IDs and required observation evidence IDs; each debrief section's evidence/source IDs. `competitionProfile.settings.modifications` is the literal empty array. Preserve intentionally ordered `preparedDebrief.sections`; no other v2 array is order-sensitive. Derive `profileHash = SHA256(JSON(profileDigestPayload))`. Derive `contentHash = SHA256(JSON(["refview-scenario-content-v2", normalizedSourceWithDerivedProfileHash]))`, encoded as UTF-8 and lower-case `sha256:<64 hex>`.

The compiler returns detached, deeply frozen canonical source, profile identity/hash, challenge-safe playable projection, private evaluation/observation context, and a canonical-to-public handle map. It uses the existing reviewed allowlist projection where compatible and extends the v2 playable DTO with exact `actorRigBindings: { actorHandle: actor-###, rigAssetHandle: asset-### }[]` and `assetManifest: { assetHandle: asset-###, neutralClientPath: string, sha256: sha256:<64 hex>, kind: "proceduralModule" | "file" }[]`. Those are allowlisted public rendering data; every actor rig, clip, and cue handle has exactly one manifest entry, and no unused manifest entry is exposed. Neutral paths and handles cannot contain canonical semantic IDs. The client fetches only these checked public assets; a private asset ID or license/internal origin field never enters the DTO. It rejects supplied derived fields. Each public actor/asset handle is stable for the source version. No answer key, semantic event/evidence ID, private rubric, source rationale, prepared debrief, or internal asset name enters the pre-decision playable DTO. Mutating input after compilation must not affect any derived value.

The bound private context contains a C1 `ObservationFixture` validated against the compiled timeline with the derived `ref`, `scenarioContentHash`, and `durationTicks`, and a rubric binding with the same ref/hash. A downstream finalizer consumes these checked identities, never the unbound authoring fragments. The package authoring entrypoint exports only the one-source compiler and the separate stored-source verifier; lower-level projector and normalizer helpers remain internal imports, not alternate publication APIs.

Compilation receives a trusted `resolveAssetBytes(assetId, neutralClientPath)` dependency. For every `AssetRecord`, it reads the actual file bytes or the exact bundled procedural module bytes and compares SHA-256 to the declared digest. Missing bytes, unsupported paths, digest mismatch, duplicate bindings, and unreferenced dependencies fail. The license/origin record is bound into the source hash and independently checked at review; a supplied string is not license approval. The renderer build identity is a fingerprint of the exact code/assets used for captures.

The browser procedural-module ABI uses only public asset handles and manifest paths. A clip module exports a neutral `samplePose(phaseQ)`; the rig module accepts that sampled pose to derive both visible body geometry and named attachment/part samples. The browser resolves `clipHandle` and `rigAssetHandle` through the allowlisted manifest, then passes the clip's pose to the rig. Public module bytes, including comments and export names, contain no canonical actor/asset IDs or ruling labels. The server geometry resolver privately maps canonical clip IDs to the same sampled pose functions. It must not require the browser to translate a public handle back to a private ID. A static serving check compares bytes at each public manifest path with the bytes hashed by the compiler, and the WebGL renderer uses the same rig geometry functions that generated evidence anchors and occluders.

The `geometryBindings` map makes the comparison executable: the asset resolver exposes a deterministic `sampleAttachment(rigAssetId, clipAssetId, phaseQ, attachmentName)` and `sampleGeometryPart(...)` for declared names. Compose each local result with that actor's exact canonical transform at the evidence tick. Ball centre uses the canonical ball track. `fieldPoint` resolves to `(xM, 0, 36.0)` on the near penalty-area line, with `xM` finite and inside `-20.16..20.16`; it identifies one C1 point rather than an entire line. For each evidence sample tick, compare every bound anchor with its derived world position. A bound occluder box must match the sampled named geometry-part AABB on every min/max axis within `0.05 m` and enclose that geometry; arbitrarily enlarged boxes fail. The visual correspondence harness runs at ticks `120`, `360`, `366`, `371`, and `480` plus every tick in required evidence windows. It uses a versioned initial anchor tolerance `<=0.05 m`; if unsuitable, change the source/version and review it before training approval rather than silently widening it. The compiled hash alone cannot prove visibility. Deterministic captures from good and poor positions, both camera modes, and the declared renderer/asset build are required before calibration and training approval.

For `incident-001`, both `EV-TRIP-CONTACT` and `EV-INSIDE-AREA` evidence windows must include fact `contactTick=366`. At that tick, `EV-TRIP-CONTACT` must require an actor-attachment anchor from the receiver or offender within `0.05 m` of the authored contact point `(13.80, 0.34, 36.80)`. `EV-INSIDE-AREA` must require an actor-attachment ground anchor within `0.05 m` of `facts.contactGround` and a required near-penalty-area `fieldPoint` anchor with `xM` within `0.05 m` of the contact x-coordinate. The line point resolves to z=36.0; the ground contact remains z=36.8. Both anchors must occur in the same tick-366 sample. These checks tie the named evidence to the typed fact and the boundary; the separate renderer captures still decide whether the moving challenge reads as careless and whether the user can see it.

## PostgreSQL admission and publication

The isolated-test migration adds `ScenarioVersion.sourceSchemaVersion` (existing rows backfilled to `1`), nullable `canonicalSource` (required when source schema is `2`), and a preliminary review-record table. It never relabels a v1 partial hash as v2. The current `createDraft` operation compiles the one source on the server, verifies that the exact immutable profile identity/hash/settings is stored, and atomically creates canonical source, derived public/private caches, and a `draft` publication. Authored source reads recompile the stored canonical source with the same asset resolver and compare derived profile hash, content hash, and public/private caches. Current reviewed reads accept a caller-provided build hash for synthetic PostgreSQL tests; this is not running-build authority and must be replaced before any real catalog/start route. Stored v1 synthetic rows are distinguishable and cannot enter the authored-training path. Existing v1 create/review/start functions are restricted to a test-only helper that checks the actual connected PostgreSQL database name ends in `_test`; normal application entrypoints reject v1. `purpose` or `NODE_ENV` alone grants no publication privilege.

The stored v2 `canonicalSource` is the compiler's normalized source **including** the derived `competitionProfileHash`. A separate server-side stored-source verifier accepts that exact stored shape, removes only the derived profile hash for recompilation through the normal one-source compiler, then compares the whole normalized stored source and profile hash to the newly derived result. A mismatch fails closed. The normal authoring API continues to reject any caller-supplied derived field. Stored public/private caches and row content hashes are then compared by the read repository; accepting the stored source alone is not sufficient.

The preliminary immutable review record stores source identity, free-form JSON approval/capture objects, a caller-provided renderer hash, and boolean source/calibration claims. Its `(scenarioId, version, contentHash)` binding has a foreign key to the immutable source row. `ScenarioPublication.reviewRecordId` has a foreign key to that immutable record, and the current database transition guard rejects missing shallow fields and direct review-history rewrites. Synthetic tests exercise this path; the JSON and booleans are not trusted evidence of Nicolas's approval. A later migration must store the exact reviewed bundle digest, seven attested answers, calibration report digest, importer principal/time, and immutable running-build identity, with total-boolean database guards and a separate import role. The normal authoring caller cannot submit reviewer principal or approval timestamps as untrusted JSON. Nicolas's seven rendered answers are recorded in the conversation and `incident-brief.md`, but trusted attribution/import, full calibration, and running-build authority are not implemented; the actual incident remains draft. Nicolas's 2026-11-03 brief approval is historical brief evidence, not a fabricated server action or rendered publication. A nonempty arbitrary review ID never authorizes a real `draft -> reviewed` transition.

The target production transition, under a publication row lock, must verify the exact imported review record and every required training gate before writing state/revision/audit event in one transaction. The current isolated-test `draft -> reviewed` transition checks shallow JSON/boolean fields and a caller-provided renderer hash; synthetic reviewed rows are no production publication credential. The implemented `reviewed -> retired` path preserves the original review record ID and reviewed timestamp, records the retirement actor/reason/time, and writes the matching audit event atomically. Database constraints/triggers must reject direct mutation of immutable source/projections, review records, or review history. Existing pinned attempts may finish after retirement; new production attempts require a verified currently reviewed source. A failed cache check, review binding, audit insertion, or concurrent revision leaves publication state unchanged.

## Local reviewed-incident import after the rendered response

Nicolas replied positively to an explicit question about the running first-incident A/B contact, elevated pass, fall, and football interpretation, while requesting later interface, full-screen, and character improvements. He then answered all seven rendered checkpoints, with exact wording preserved in `incident-brief.md`. These are conversation evidence, not a signed source hash, authenticated account action, trusted evidence import, or final MVP acceptance. A future local `verifiedManualConversationImport` may bind those historical responses to one exact source and renderer version only after trusted attribution and separate technical verification. The publication transition for the actual incident remains closed. The candidate evidence and attribution rules are defined in [`review-evidence-v1.md`](review-evidence-v1.md). The normal authoring API accepts no caller-supplied approval flags, principal, or timestamps.

The retrospective rendering-input identity follows [`renderer-fingerprint-v1.md`](renderer-fingerprint-v1.md). It hashes exact source/config/asset bytes and the compiled projection, then compares new deterministic captures against preserved reviewer captures. It does not establish which code a mutable development server loaded and cannot authorize catalog/start. A separate immutable emitted-build identity and verification of currently served asset bytes must be implemented and independently reviewed before any reviewed catalog/start operation. The browser cannot supply that identity as authority.

Before import, preserve and verify each PNG's own byte hash and capture metadata for the exact 17 pairs in `review-evidence-v1.md`. Paired PNG encoding may differ; all decoded RGB pixels in the full canvas crop must match. Record tick, referee pose, camera settings, viewport/canvas size, and named browser environment with reconstructed fields labeled honestly. A missing or changed artifact byte fails the fixed bundle. Verify local procedural asset provenance/license and the authored IFAB reference digest separately; strings in the source are not automatic license approval. Do not redistribute the local IFAB PDF.

`observationCalibrationApproved` requires a separate reviewed technical record tied to the same source/fingerprint. It covers every tick in both required evidence windows, A/B in both camera modes, eligible live receipt chains at representative render cadences, and resulting C2 bands. The current three-receipt/four-tick `supported` threshold must be explicitly examined against the rendered sequence and its limits stated. Camera-only and replay receipts remain excluded, and a correct guess does not create observation credit. These are prototype evidence-availability heuristics, not proof of human perception.

The future local import command accepts only a fixed content-addressed bundle verified against files, trusted conversation attribution, the current derived source, retrospective rendering input, and a separately established immutable running-build identity. In one PostgreSQL transaction it locks the draft publication, checks expected revision and stored-source/cache identity, validates all evidence and calibration gates, inserts the immutable review record with server-controlled import metadata, transitions to reviewed, and writes the matching audit event. Exact retry may return the same result; changed bundle is a conflict. Database guards must reject a synthetic review as production authority and preserve the reviewed record on retirement. The present schema and repositories still accept synthetic test records and do not implement this import authority. Application DB migration and draft creation are forward-only; never reset or overwrite a conflicting source. Independent authority review and real PostgreSQL rollback tests are required before training publication.

## Proof obligations

Pure assertion-level RED/GREEN tests must show that changing profile settings/version, official source edition/fingerprint, initial pose, camera collider, evidence geometry, rubric, debrief text, or asset definition/license changes the full hash or fails validation. Reordering declared sets preserves it; changing ordered debrief text changes it. Unknown fields, supplied hash/projections, missing asset bytes/definition bindings, private leaks, and cross-reference mismatch fail.

Real isolated-PostgreSQL tests must show source/profile/cache correspondence, immutable draft storage, wrong-hash/version review rejection, missing rendered approval rejection, audit rollback, retirement history preservation, new-attempt retirement exclusion, and continued owner-bound completion of pinned attempts. Existing synthetic v1 tests continue passing without being relabelled as training authority. Browser/WebGL proof and Nicolas's rendered approval remain separate acceptance conditions.


