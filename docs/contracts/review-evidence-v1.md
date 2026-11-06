# Local first-incident review evidence v1

This is a candidate evidence format for a future trusted local import. It grants no publication authority by itself. Nicolas's seven rendered-checkpoint answers are recorded in the conversation and `incident-brief.md`, but no trusted attributed bundle has been imported; the current PostgreSQL review table does not enforce this format.

The exact v1 object shapes are:

```ts
type Sha256 = `sha256:${string}`; // validate lowercase prefix plus 64 hex digits
type EvidenceDate =
  | { precision: "date"; value: string }       // ISO YYYY-MM-DD only
  | { precision: "datetime"; value: string }   // ISO instant with UTC offset
  | { precision: "unknown"; value: null };
type ArtifactRecord = {
  artifactId: string; relativePath: string; byteLength: number;
  sha256: Sha256; mediaType: "image/png" | "video/webm" | "application/json" | "text/plain";
};
type TranscriptExcerpt = {
  artifactId: string; startByte: number; endByte: number; verbatim: string;
  speaker: "Nicolas" | "assistant"; conversationRef: string;
  originalWhen: EvidenceDate;
};
type TranscriptExchange = { question: TranscriptExcerpt; reply: TranscriptExcerpt };
type TrustedAttestation = {
  subjectDigest: Sha256; outcome: "pass" | "fail" | "unclear";
  reviewerPrincipal: string; reviewedWhen: EvidenceDate;
  source: { kind: "trustedConversation"; conversationRef: string;
    excerpt: TranscriptExcerpt };
  evidenceArtifactIds: string[];
};
type CheckpointId = "onsidePose" | "carelessChallenge" | "contactInsideArea" |
  "nonDogso" | "noCardAndSpa" | "goodPoorVisibility" | "teachingCredibility";
type CheckpointAnswer = {
  checkpointId: CheckpointId; question: TranscriptExcerpt; answer: TranscriptExcerpt;
  outcome: "approved" | "rejected" | "unclear";
  presentedContentHash: Sha256; presentedRendererFingerprint: Sha256;
  presentedCaptureIds: string[]; verification: TrustedAttestation;
};
type Capture = {
  captureId: string; artifactId: string; tick: number;
  preset: "A" | "B" | "elevatedPass";
  cameraMode: "firstPerson" | "thirdPerson" | "authoringElevated";
  refereePose: { x: number; z: number; yaw: number; pitch: number } | null;
  camera: { position: [number, number, number]; target: [number, number, number];
    verticalFovDeg: number; distanceM: number | null; lateralOffsetM: number | null };
  passReview: boolean; scenarioContentHash: Sha256; rendererFingerprint: Sha256 | null;
  screenshotPixels: { width: 1280; height: 720 };
  canvasCssRect: { x: number; y: number; width: number; height: number };
  drawingBufferPixels: { width: number; height: number };
  dpr: number; viewportCssPixels: { width: 1280; height: 720 };
  locale: "es" | "en"; zoom: number;
  motion: "default" | "reduced"; quality: "default" | "low" | "high";
  browserVersion: string | null; os: string | null;
  webglVendor: string | null; webglRenderer: string | null;
  executionMode: "development" | "production";
  capturedWhen: EvidenceDate;
  provenance: { kind: "contemporaneous" | "reconstructed";
    evidenceArtifactIds: string[] };
};
type CapturePair = { pairId: string; original: Capture; fresh: Capture };
type PairResult = { pairId: string; originalSha256: Sha256; freshSha256: Sha256;
  differingPixels: 0; maximumChannelDelta: 0 };
type Comparison = {
  algorithm: "decoded-rgb-canvas-exact-v1";
  crop: { x: 91; y: 109; width: 1098; height: 459 };
  results: PairResult[]; reportDigest: Sha256; verification: TrustedAttestation;
};
type ReviewedReport = { artifactId: string; reportDigest: Sha256;
  verification: TrustedAttestation };
type MotionEvidence = {
  kind: "runningScene" | "recording";
  route: string | null; artifactId: string | null;
  fromTick: 360; toTick: 386;
  scenarioContentHash: Sha256; rendererFingerprint: Sha256;
  verification: TrustedAttestation;
};
type EvidenceBundleV1 = {
  schemaVersion: 1; purpose: "incident001TrainingReview";
  scenario: { scenarioId: "incident-001"; version: number; contentHash: Sha256 };
  renderer: { fingerprintVersion: 1; fingerprint: Sha256;
    manifest: RendererManifestV1; historicalFingerprint: null;
    bindingMethod: "retrospectiveCaptureComparison" };
  artifacts: ArtifactRecord[]; historicalFeedback: TranscriptExchange;
  briefApproval: TranscriptExchange;
  renderedAnswers: Record<CheckpointId, CheckpointAnswer | null>;
  captures: CapturePair[]; comparison: Comparison; motionEvidence: MotionEvidence;
  calibration: ReviewedReport; sourceAndAssetReview: ReviewedReport;
};
```

Every listed shape has exactly the listed keys. Arrays declared as sets have unique IDs and canonical ordinal sorting. `CapturePair.pairId` is one of `A|B` + `firstPerson|thirdPerson` + `360|366|371|386`, or `elevatedPass120`; every required value appears exactly once. An original capture has `rendererFingerprint: null` because none was recorded then; its fresh counterpart carries the reconstructed fingerprint. `elevatedPass120` uses `authoringElevated` and `passReview: true`; all other pairs have `passReview: false`. Original and fresh pair members must match tick/preset/mode/pose/camera/viewport/canvas/DPR/locale/zoom/motion/quality except fields explicitly marked reconstructed. Unknown historical browser, WebGL, or time values remain `null`/`unknown`, never guessed. Every checkpoint answer must have `answer.speaker === "Nicolas"`, and the trusted-source attestation must verify that attribution. `historicalFeedback.reply` and `briefApproval.reply` have the same speaker requirement.

Digest preimages are noncircular. A checkpoint subject digest is SHA-256 of canonical JSON `["refview-checkpoint-answer-v1", checkpoint answer without verification]`. `Comparison.reportDigest` is SHA-256 of canonical JSON `["refview-capture-comparison-v1", {algorithm, crop, results}]`; its verification subject digest must equal that report digest. A reviewed report digest is the exact SHA-256 of its artifact bytes, and its verification subject digest must equal that value. Motion evidence subject digest is SHA-256 of canonical JSON `["refview-motion-evidence-v1", motion evidence without verification]`. Every `TrustedAttestation` must have `outcome: "pass"`, a subject digest equal to the applicable preimage, and a source excerpt verified against a trusted conversation record that identifies the reviewer and makes their approval explicit. Matching bytes in a locally authored text file or a self-declared `reviewerPrincipal` is insufficient. The importer's separate locally derived principal proves only who performed import. A trusted conversation export or equivalent independently verifiable source is not yet available in the repository, so no attestation is currently importable.

Motion evidence uses either `kind: "runningScene"`, the reviewed local route, and `artifactId: null`, or `kind: "recording"`, a `video/webm` artifact ID, and `route: null`. The trusted attestation must explicitly say the reviewer inspected normal-speed motion across ticks 360–386 and bind the source/fingerprint. Neither a paused frame nor a file path alone is proof of motion review.

## Strict bundle

`EvidenceBundleV1` has exactly `schemaVersion: 1`, `purpose: "incident001TrainingReview"`, `scenario`, `renderer`, `artifacts`, `historicalFeedback`, `briefApproval`, `renderedAnswers`, `captures`, `comparison`, `motionEvidence`, `calibration`, and `sourceAndAssetReview`. Unknown keys, duplicate JSON keys, non-JSON values, sparse arrays, unsafe integer fields, nonfinite numbers, path traversal, symlinks, duplicate artifact IDs, and case-colliding paths fail. Every referenced local file must be inside the fixed bundle directory and must match its declared exact byte length and SHA-256. Each artifact record has exactly `{ artifactId, relativePath, byteLength, sha256, mediaType }`.

`scenario` has exactly `{scenarioId: "incident-001", version, contentHash}`. `renderer` has exactly `{fingerprintVersion: 1, fingerprint, manifest, historicalFingerprint: null, bindingMethod: "retrospectiveCaptureComparison"}`. The renderer manifest follows [`renderer-fingerprint-v1.md`](renderer-fingerprint-v1.md); no digest is represented as if it existed at the time of Nicolas's reply.

`renderedAnswers` has exactly these seven keys, corresponding in order to the questions in `incident-brief.md`: `onsidePose`, `carelessChallenge`, `contactInsideArea`, `nonDogso`, `noCardAndSpa`, `goodPoorVisibility`, and `teachingCredibility`. A candidate may use `null` for unanswered checkpoints. Import requires seven non-null answers, each with its matching `checkpointId`, exact question and answer transcript excerpts, `outcome: "approved"`, the presented source hash, renderer fingerprint, and capture IDs. `rejected` or `unclear` blocks import. The existing general positive reply is preserved in `historicalFeedback`; it cannot be copied into seven answer records. A shared later transcript message may support multiple records only if it explicitly answers each named checkpoint.

Each transcript excerpt records the artifact ID, exact UTF-8 byte interval and verbatim bytes, speaker, conversation reference, and original date/time at its actual known precision. Date-only evidence remains date-only. An importer checks excerpts against the artifact bytes and provenance. `historicalFeedback` and `briefApproval` each hold the question and reply excerpts separately; neither invents an authenticated account action or a new server approval time.

The bundle digest is SHA-256 over UTF-8 canonical JSON of `["refview-review-evidence-v1", bundle]`; it excludes the digest itself and server-generated import metadata. Canonical JSON sorts object keys ordinally, preserves transcript text and explicitly ordered sequences, normalizes negative zero, and rejects exotic values. Declared set arrays are sorted by stable ID before serialization.

## Captures and calibration

Exactly 17 original/fresh pairs are required: A and B, first and third person, each at ticks 360, 366, 371, and 386; plus elevated pass at tick 120. Each record carries artifact IDs, preset/tick, exact camera/referee configuration, source/fingerprint, screenshot and canvas dimensions, DPR, viewport, locale, zoom, motion/quality settings, browser/OS/WebGL identity, execution mode, and whether each metadata field was contemporaneous or reconstructed with its evidence. No reconstructed value may be passed off as contemporaneous.

The v1 comparison decodes each PNG to RGB and compares every pixel in `(91, 109, 1098, 459)` at a 1280x720 CSS viewport without scale, masks, blur, or tolerance. The fractional canvas rectangle is `(91, 109.1875, 1098, 458)`; the integer crop must cover its full envelope. Each original and each fresh PNG must independently match its recorded byte digest. Paired PNG bytes may differ outside the crop or in encoding. Inside the crop, the required maximum differing pixels and channel delta are both zero. Missing pairs, mismatched metadata, changed artifact bytes, incomplete canvas coverage, or a single different crop pixel fail. The 17 currently preserved pairs match at pixel level, pending formal evidence-bundle verification.

The calibration report records the source hash, renderer fingerprint, implementation/version identities, all 92 C1 results across both evidence windows and four A/B camera combinations, 12 valid C2 traces across 30/60/144 nominal fps, trace digests, exact bands/receipts/qualifying spans, and camera-only/replay/inactive/interrupted/correct-guess negative cases. Its digest covers the full report. An independent technical review must bind that exact digest and explicitly assess the three-receipt/four-tick `supported` heuristic against the rendered sequence. A passing numeric model alone does not approve human perception.

`sourceAndAssetReview` binds the same source/fingerprint and records independent source, license, and served-asset checks. The old scoped reply and 17 stills do not establish normal-speed challenge intensity; the seven-checkpoint review must include the running scene or a documented normal-speed recording.

## Import boundary

Only a trusted local CLI may eventually convert a complete bundle into a review record. It must derive importer identity locally, record import time at execution, verify all file bytes and source/build/capture/calibration identities, and atomically bind the review and publication audit under the PostgreSQL row lock. Normal authoring JSON never supplies reviewer identity, timestamps, approval flags, or a build digest. The web application database role must not be able to insert manual-review records. A synthetic test record remains synthetic even on a test database and is never accepted by normal catalog/start reads.

The current persistence schema and test helper do not provide this boundary; they remain synthetic-only evidence. Publication stays `draft` until the exact bundle validator, isolated-PostgreSQL guard, running-build binding, independent review, and all seven explicit checkpoint answers are present.
