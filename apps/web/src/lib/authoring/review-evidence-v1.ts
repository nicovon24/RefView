import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { canonicalJsonV2 } from '../../../../../packages/content/src/source-core-v2';

const CHECKPOINTS = ['onsidePose', 'carelessChallenge', 'contactInsideArea', 'nonDogso', 'noCardAndSpa', 'goodPoorVisibility', 'teachingCredibility'] as const;
const CHECKPOINT_QUESTIONS: Record<(typeof CHECKPOINTS)[number], string> = {
  onsidePose: 'Is the receiver visibly onside at tick `120`, including the animated body pose?',
  carelessChallenge: 'Does the challenge read as an attempt to play the ball and a careless trip, not incidental contact, simulation, recklessness, or excessive force?',
  contactInsideArea: 'Is the contact visibly inside the penalty area from the intended good position?',
  nonDogso: 'Do distance, direction, control likelihood, and actor locations/numbers together exclude DOGSO?',
  noCardAndSpa: 'Does the same action support the expected no-card result under the SPA exception?',
  goodPoorVisibility: 'Is decisive contact genuinely visible from the good position and genuinely restricted from the poor one?',
  teachingCredibility: 'Are the fall, reactions, whistle window, camera, lighting, field markings, and kit contrast credible enough to teach the intended evidence?',
};
const PAIRS = [...['A', 'B'].flatMap(preset => ['firstPerson', 'thirdPerson'].flatMap(mode => [360, 366, 371, 386].map(tick => `${preset}${mode}${tick}`))), 'elevatedPass120'];
const HASH = /^sha256:[0-9a-f]{64}$/;
const sha = (bytes: Uint8Array | string) => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
type Issues = string[];
type RecordValue = Record<string, unknown>;
function object(value: unknown, path: string, keys: readonly string[], issues: Issues): RecordValue | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) {
    issues.push(`${path}: expected plain object`); return;
  }
  const item = value as RecordValue;
  for (const key of Object.keys(item)) if (!keys.includes(key)) issues.push(`${path}: unexpected key ${key}`);
  for (const key of keys) if (!Object.hasOwn(item, key)) issues.push(`${path}: missing key ${key}`);
  return item;
}
function array(value: unknown, path: string, issues: Issues): unknown[] {
  if (!Array.isArray(value)) { issues.push(`${path}: expected array`); return []; }
  if (Object.keys(value).length !== value.length || Object.getPrototypeOf(value) !== Array.prototype) issues.push(`${path}: sparse or exotic array`);
  return value;
}
function equal(actual: unknown, expected: unknown, path: string, issues: Issues): void {
  if (actual !== expected) issues.push(`${path}: expected ${String(expected)}`);
}
function hash(value: unknown, path: string, issues: Issues): void {
  if (typeof value !== 'string' || !HASH.test(value)) issues.push(`${path}: invalid SHA-256`);
}
function text(value: unknown, path: string, issues: Issues): void {
  if (typeof value !== 'string' || !value) issues.push(`${path}: expected nonempty text`);
}
function integer(value: unknown, path: string, issues: Issues, min = 0): void {
  if (!Number.isSafeInteger(value) || (value as number) < min) issues.push(`${path}: invalid safe integer`);
}
function number(value: unknown, path: string, issues: Issues): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) issues.push(`${path}: invalid finite number`);
}
function idSet(value: unknown, path: string, issues: Issues): string[] {
  const items = array(value, path, issues);
  if (items.some((id, index) => typeof id !== 'string' || !id || (index > 0 && String(items[index - 1]) >= id))) issues.push(`${path}: invalid ID set`);
  return items.filter((id): id is string => typeof id === 'string');
}
function mediaFor(artifactId: unknown, path: string, expected: string | readonly string[], media: Map<string, string>, issues: Issues): void {
  const actual = media.get(String(artifactId));
  if (!actual) return;
  const allowed = typeof expected === 'string' ? [expected] : expected;
  if (!allowed.includes(actual)) issues.push(`${path}: ${path.includes('capture') ? 'capture' : path.includes('motionEvidence') ? 'recording' : path.includes('calibration') || path.includes('sourceAndAssetReview') ? 'report' : 'transcript'} artifact must be ${allowed.join(' or ')}`);
}
function dates(value: unknown, path: string, issues: Issues): void {
  const date = object(value, path, ['precision', 'value'], issues);
  if (!date) return;
  if (date.precision === 'unknown') equal(date.value, null, `${path}.value`, issues);
  else if (date.precision === 'date') {
    if (typeof date.value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date.value) || Number.isNaN(Date.parse(`${date.value}T00:00:00Z`))) issues.push(`${path}: invalid date`);
  } else if (date.precision === 'datetime') {
    if (typeof date.value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(date.value) || Number.isNaN(Date.parse(date.value))) issues.push(`${path}: invalid datetime`);
  } else issues.push(`${path}: invalid precision`);
}
function excerpt(value: unknown, path: string, artifacts: Map<string, Buffer>, media: Map<string, string>, issues: Issues): RecordValue | undefined {
  const item = object(value, path, ['artifactId', 'startByte', 'endByte', 'verbatim', 'speaker', 'conversationRef', 'originalWhen'], issues);
  if (!item) return;
  text(item.artifactId, `${path}.artifactId`, issues); integer(item.startByte, `${path}.startByte`, issues); integer(item.endByte, `${path}.endByte`, issues);
  if (item.speaker !== 'Nicolas' && item.speaker !== 'assistant') issues.push(`${path}: invalid speaker`);
  text(item.conversationRef, `${path}.conversationRef`, issues); dates(item.originalWhen, `${path}.originalWhen`, issues);
  const bytes = artifacts.get(String(item.artifactId));
  mediaFor(item.artifactId, path, ['text/plain', 'application/json'], media, issues);
  if (!bytes) issues.push(`${path}: missing transcript artifact`);
  else if (typeof item.startByte === 'number' && typeof item.endByte === 'number' && Number.isSafeInteger(item.startByte) && Number.isSafeInteger(item.endByte)) {
    if (item.startByte >= item.endByte || item.endByte > bytes.length || bytes.subarray(item.startByte, item.endByte).toString('utf8') !== item.verbatim) issues.push(`${path}: excerpt byte mismatch`);
  }
  return item;
}
function exchange(value: unknown, path: string, artifacts: Map<string, Buffer>, media: Map<string, string>, issues: Issues): void {
  const item = object(value, path, ['question', 'reply'], issues);
  if (!item) return;
  excerpt(item.question, `${path}.question`, artifacts, media, issues);
  const reply = excerpt(item.reply, `${path}.reply`, artifacts, media, issues);
  if (reply?.speaker !== 'Nicolas') issues.push(`${path}.reply: Nicolas speaker required`);
}
function attestation(value: unknown, path: string, subject: string | null, artifacts: Map<string, Buffer>, media: Map<string, string>, issues: Issues): void {
  const item = object(value, path, ['subjectDigest', 'outcome', 'reviewerPrincipal', 'reviewedWhen', 'source', 'evidenceArtifactIds'], issues);
  if (!item) return;
  hash(item.subjectDigest, `${path}.subjectDigest`, issues);
  if (subject) equal(item.subjectDigest, subject, `${path}.subjectDigest`, issues);
  equal(item.outcome, 'pass', `${path}.outcome`, issues);
  text(item.reviewerPrincipal, `${path}.reviewerPrincipal`, issues); dates(item.reviewedWhen, `${path}.reviewedWhen`, issues);
  const source = object(item.source, `${path}.source`, ['kind', 'conversationRef', 'excerpt'], issues);
  if (source) {
    equal(source.kind, 'trustedConversation', `${path}.source.kind`, issues);
    text(source.conversationRef, `${path}.source.conversationRef`, issues);
    const sourceExcerpt = excerpt(source.excerpt, `${path}.source.excerpt`, artifacts, media, issues);
    if (sourceExcerpt) { equal(sourceExcerpt.speaker, 'Nicolas', `${path}.source.excerpt.speaker`, issues); equal(sourceExcerpt.conversationRef, source.conversationRef, `${path}.source.excerpt.conversationRef`, issues); }
  }
  const ids = idSet(item.evidenceArtifactIds, `${path}.evidenceArtifactIds`, issues);
  for (const id of ids) if (!artifacts.has(String(id))) issues.push(`${path}: missing evidence artifact ${String(id)}`);
  if (new Set(ids).size !== ids.length) issues.push(`${path}: duplicate evidence artifact`);
}
function digestPreimage(tag: string, value: unknown, issues: Issues, path: string): string | null {
  try { return sha(canonicalJsonV2([tag, value])); } catch { issues.push(`${path}: invalid canonical JSON`); return null; }
}
function jsonShape(value: unknown, path: string, issues: Issues, seen = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { if (!Number.isFinite(value)) issues.push(`${path}: nonfinite number`); return; }
  if (typeof value !== 'object') { issues.push(`${path}: non-JSON value`); return; }
  if (seen.has(value)) { issues.push(`${path}: circular value`); return; }
  seen.add(value);
  if (Array.isArray(value)) {
    if (Object.getPrototypeOf(value) !== Array.prototype || Object.keys(value).length !== value.length) issues.push(`${path}: exotic or sparse array`);
    for (let index = 0; index < value.length; index++) jsonShape(value[index], `${path}.${index}`, issues, seen);
  } else if (Object.getPrototypeOf(value) === Object.prototype) {
    for (const [key, child] of Object.entries(value)) jsonShape(child, `${path}.${key}`, issues, seen);
  } else issues.push(`${path}: exotic object`);
  seen.delete(value);
}
function checkedArtifact(root: string, relativePath: unknown, issues: Issues): Buffer | undefined {
  if (typeof relativePath !== 'string' || !relativePath || relativePath.includes('\\') || relativePath.startsWith('/') || /^[A-Za-z]:/.test(relativePath) || relativePath.split('/').some(part => !part || part === '.' || part === '..')) {
    issues.push('artifacts: unsafe path'); return;
  }
  let path = root;
  try {
    for (const part of relativePath.split('/')) {
      path = join(path, part);
      if (lstatSync(path).isSymbolicLink()) { issues.push(`artifacts: symlink ${relativePath}`); return; }
    }
    if (!lstatSync(path).isFile()) { issues.push(`artifacts: not regular file ${relativePath}`); return; }
    return readFileSync(path);
  } catch { issues.push(`artifacts: unreadable ${relativePath}`); return; }
}

/** Diagnostic candidate inspection only. Trusted conversation and running-build proofs require a separate importer. */
export function inspectCandidateReviewEvidenceV1(candidate: unknown, bundleRoot: string): { importable: false; issues: string[]; bundleDigest: string | null } {
  const issues: Issues = [];
  jsonShape(candidate, 'bundle', issues);
  if (!isAbsolute(bundleRoot)) issues.push('bundleRoot: absolute path required');
  const root = resolve(bundleRoot);
  const bundle = object(candidate, 'bundle', ['schemaVersion', 'purpose', 'scenario', 'renderer', 'artifacts', 'historicalFeedback', 'briefApproval', 'renderedAnswers', 'captures', 'comparison', 'motionEvidence', 'calibration', 'sourceAndAssetReview'], issues);
  if (!bundle) return { importable: false, issues, bundleDigest: null };
  equal(bundle.schemaVersion, 1, 'schemaVersion', issues); equal(bundle.purpose, 'incident001TrainingReview', 'purpose', issues);
  const scenario = object(bundle.scenario, 'scenario', ['scenarioId', 'version', 'contentHash'], issues);
  if (scenario) { equal(scenario.scenarioId, 'incident-001', 'scenario.scenarioId', issues); integer(scenario.version, 'scenario.version', issues, 1); hash(scenario.contentHash, 'scenario.contentHash', issues); }
  const renderer = object(bundle.renderer, 'renderer', ['fingerprintVersion', 'fingerprint', 'manifest', 'historicalFingerprint', 'bindingMethod'], issues);
  if (renderer) {
    equal(renderer.fingerprintVersion, 1, 'renderer.fingerprintVersion', issues); hash(renderer.fingerprint, 'renderer.fingerprint', issues);
    equal(renderer.historicalFingerprint, null, 'renderer.historicalFingerprint', issues); equal(renderer.bindingMethod, 'retrospectiveCaptureComparison', 'renderer.bindingMethod', issues);
    const manifest = object(renderer.manifest, 'renderer.manifest', ['schemaVersion', 'sourceContentHash', 'playableProjectionHash', 'execution', 'files'], issues);
    if (manifest) {
      equal(manifest.schemaVersion, 1, 'renderer.manifest.schemaVersion', issues); hash(manifest.sourceContentHash, 'renderer.manifest.sourceContentHash', issues); hash(manifest.playableProjectionHash, 'renderer.manifest.playableProjectionHash', issues);
      equal(manifest.sourceContentHash, scenario?.contentHash, 'renderer.manifest.sourceContentHash', issues);
      const execution = object(manifest.execution, 'renderer.manifest.execution', ['nodeVersion', 'pnpmVersion', 'mode', 'sessionTestMode'], issues);
      if (execution) { text(execution.nodeVersion, 'renderer.manifest.execution.nodeVersion', issues); text(execution.pnpmVersion, 'renderer.manifest.execution.pnpmVersion', issues); equal(execution.mode, 'development', 'renderer.manifest.execution.mode', issues); equal(execution.sessionTestMode, false, 'renderer.manifest.execution.sessionTestMode', issues); }
      const files = array(manifest.files, 'renderer.manifest.files', issues);
      let previousPath = ''; const foldedPaths = new Set<string>();
      for (const [index, file] of files.entries()) {
        const entry = object(file, `renderer.manifest.files.${index}`, ['path', 'byteLength', 'sha256'], issues);
        if (entry) {
          text(entry.path, 'manifest file path', issues); integer(entry.byteLength, 'manifest file byteLength', issues); hash(entry.sha256, 'manifest file sha256', issues);
          const path = entry.path;
          if (typeof path !== 'string' || path.includes('\\') || path.startsWith('/') || /^[A-Za-z]:/.test(path) || path.split('/').some(segment => !segment || segment === '.' || segment === '..') || (index > 0 && previousPath >= path) || foldedPaths.has(path.toLowerCase())) issues.push('renderer.manifest.files: invalid path set');
          if (typeof path === 'string') { previousPath = path; foldedPaths.add(path.toLowerCase()); }
        }
      }
      const expected = digestPreimage('refview-renderer-input-v1', manifest, issues, 'renderer.manifest');
      if (expected) equal(renderer.fingerprint, expected, 'renderer.fingerprint', issues);
    }
  }
  const artifacts = new Map<string, Buffer>(); const media = new Map<string, string>(); const ids = new Set<string>(); const paths = new Set<string>();
  const artifactOrder = array(bundle.artifacts, 'artifacts', []).map(value => String((value as RecordValue)?.artifactId));
  if (artifactOrder.some((id, index) => index > 0 && artifactOrder[index - 1] >= id)) issues.push('artifacts: IDs must be sorted ordinally');
  for (const [index, value] of array(bundle.artifacts, 'artifacts', issues).entries()) {
    const item = object(value, `artifacts.${index}`, ['artifactId', 'relativePath', 'byteLength', 'sha256', 'mediaType'], issues);
    if (!item) continue;
    text(item.artifactId, 'artifactId', issues); integer(item.byteLength, 'artifact byteLength', issues); hash(item.sha256, 'artifact sha256', issues);
    if (!['image/png', 'video/webm', 'application/json', 'text/plain'].includes(String(item.mediaType))) issues.push('artifacts: invalid media type');
    if (ids.has(String(item.artifactId))) issues.push(`artifacts: duplicate ID ${String(item.artifactId)}`); ids.add(String(item.artifactId));
    const folded = String(item.relativePath).toLowerCase(); if (paths.has(folded)) issues.push(`artifacts: case-colliding path ${folded}`); paths.add(folded);
    media.set(String(item.artifactId), String(item.mediaType));
    const bytes = checkedArtifact(root, item.relativePath, issues);
    if (bytes) { if (bytes.length !== item.byteLength) issues.push(`artifacts: byte length mismatch ${String(item.artifactId)}`); if (sha(bytes) !== item.sha256) issues.push(`artifacts: digest mismatch ${String(item.artifactId)}`); artifacts.set(String(item.artifactId), bytes); }
  }
  exchange(bundle.historicalFeedback, 'historicalFeedback', artifacts, media, issues); exchange(bundle.briefApproval, 'briefApproval', artifacts, media, issues);
  const answers = object(bundle.renderedAnswers, 'renderedAnswers', CHECKPOINTS, issues);
  if (answers) for (const checkpoint of CHECKPOINTS) {
    const value = answers[checkpoint]; if (value === null) { issues.push(`renderedAnswers.${checkpoint}: unanswered`); continue; }
    const item = object(value, `renderedAnswers.${checkpoint}`, ['checkpointId', 'question', 'answer', 'outcome', 'presentedContentHash', 'presentedRendererFingerprint', 'presentedCaptureIds', 'verification'], issues);
    if (!item) continue;
    equal(item.checkpointId, checkpoint, `renderedAnswers.${checkpoint}.checkpointId`, issues);
    const question = excerpt(item.question, `renderedAnswers.${checkpoint}.question`, artifacts, media, issues);
    if (question?.verbatim !== CHECKPOINT_QUESTIONS[checkpoint]) issues.push(`renderedAnswers.${checkpoint}: wrong checkpoint question`);
    const answer = excerpt(item.answer, `renderedAnswers.${checkpoint}.answer`, artifacts, media, issues);
    if (answer?.speaker !== 'Nicolas') issues.push(`renderedAnswers.${checkpoint}.answer: Nicolas speaker required`);
    const historicalReply = (bundle.historicalFeedback as RecordValue | undefined)?.reply as RecordValue | undefined;
    if (answer && historicalReply && (answer.verbatim === historicalReply.verbatim || (answer.artifactId === historicalReply.artifactId && answer.startByte === historicalReply.startByte && answer.endByte === historicalReply.endByte))) issues.push(`renderedAnswers.${checkpoint}: historical generic reply reused`);
    equal(item.outcome, 'approved', `renderedAnswers.${checkpoint}.outcome`, issues);
    equal(item.presentedContentHash, scenario?.contentHash, `renderedAnswers.${checkpoint}.presentedContentHash`, issues);
    equal(item.presentedRendererFingerprint, renderer?.fingerprint, `renderedAnswers.${checkpoint}.presentedRendererFingerprint`, issues);
    const presentedIds = idSet(item.presentedCaptureIds, `renderedAnswers.${checkpoint}.presentedCaptureIds`, issues);
    if (!presentedIds.length) issues.push(`renderedAnswers.${checkpoint}: no presented captures`);
    const { verification: _verification, ...preimage } = item;
    void _verification;
    attestation(item.verification, `renderedAnswers.${checkpoint}.verification`, digestPreimage('refview-checkpoint-answer-v1', preimage, issues, checkpoint), artifacts, media, issues);
  }
  const captures = array(bundle.captures, 'captures', issues);
  const pairOrder = captures.map(value => String((value as RecordValue)?.pairId));
  if (pairOrder.some((id, index) => index > 0 && pairOrder[index - 1] >= id)) issues.push('captures: pair IDs must be sorted ordinally');
  const seenPairs = new Set<string>(); const captureIds = new Set<string>();
  for (const [index, value] of captures.entries()) {
    const pair = object(value, `captures.${index}`, ['pairId', 'original', 'fresh'], issues); if (!pair) continue;
    if (!PAIRS.includes(String(pair.pairId))) issues.push(`captures: invalid pair ${String(pair.pairId)}`);
    if (seenPairs.has(String(pair.pairId))) issues.push(`captures: duplicate pair ${String(pair.pairId)}`); seenPairs.add(String(pair.pairId));
    for (const side of ['original', 'fresh'] as const) {
      const path = `captures.${index}.${side}`;
      const c = object(pair[side], path, ['captureId', 'artifactId', 'tick', 'preset', 'cameraMode', 'refereePose', 'camera', 'passReview', 'scenarioContentHash', 'rendererFingerprint', 'screenshotPixels', 'canvasCssRect', 'drawingBufferPixels', 'dpr', 'viewportCssPixels', 'locale', 'zoom', 'motion', 'quality', 'browserVersion', 'os', 'webglVendor', 'webglRenderer', 'executionMode', 'capturedWhen', 'provenance'], issues);
      if (!c) continue;
      text(c.captureId, `${path}.captureId`, issues); if (captureIds.has(String(c.captureId))) issues.push(`captures: duplicate capture ID ${String(c.captureId)}`); captureIds.add(String(c.captureId));
      if (!artifacts.has(String(c.artifactId))) issues.push(`${path}: missing artifact`);
      mediaFor(c.artifactId, path, 'image/png', media, issues);
      const tick = pair.pairId === 'elevatedPass120' ? 120 : Number(String(pair.pairId).match(/(360|366|371|386)$/)?.[0]);
      equal(c.tick, tick, `${path}.tick`, issues); equal(c.preset, pair.pairId === 'elevatedPass120' ? 'elevatedPass' : String(pair.pairId)[0], `${path}.preset`, issues);
      equal(c.cameraMode, pair.pairId === 'elevatedPass120' ? 'authoringElevated' : String(pair.pairId).slice(1).replace(/\d+$/, ''), `${path}.cameraMode`, issues);
      equal(c.passReview, pair.pairId === 'elevatedPass120', `${path}.passReview`, issues);
      equal(c.scenarioContentHash, scenario?.contentHash, `${path}.scenarioContentHash`, issues);
      equal(c.rendererFingerprint, side === 'original' ? null : renderer?.fingerprint, `${path}.rendererFingerprint`, issues);
      const pixels = object(c.screenshotPixels, `${path}.screenshotPixels`, ['width', 'height'], issues); if (pixels) { equal(pixels.width, 1280, `${path}.screenshotPixels.width`, issues); equal(pixels.height, 720, `${path}.screenshotPixels.height`, issues); }
      const viewport = object(c.viewportCssPixels, `${path}.viewportCssPixels`, ['width', 'height'], issues); if (viewport) { equal(viewport.width, 1280, `${path}.viewportCssPixels.width`, issues); equal(viewport.height, 720, `${path}.viewportCssPixels.height`, issues); }
      for (const field of ['dpr', 'zoom'] as const) number(c[field], `${path}.${field}`, issues);
      if (!['es', 'en'].includes(String(c.locale))) issues.push(`${path}: invalid locale`);
      if (!['default', 'reduced'].includes(String(c.motion))) issues.push(`${path}: invalid motion`);
      if (!['default', 'low', 'high'].includes(String(c.quality))) issues.push(`${path}: invalid quality`);
      if (!['development', 'production'].includes(String(c.executionMode))) issues.push(`${path}: invalid execution mode`);
      dates(c.capturedWhen, `${path}.capturedWhen`, issues);
      const provenance = object(c.provenance, `${path}.provenance`, ['kind', 'evidenceArtifactIds'], issues);
      if (provenance) { if (!['contemporaneous', 'reconstructed'].includes(String(provenance.kind))) issues.push(`${path}: invalid provenance`); for (const id of idSet(provenance.evidenceArtifactIds, `${path}.provenance.evidenceArtifactIds`, issues)) if (!artifacts.has(id)) issues.push(`${path}: missing provenance artifact`); }
      const pose = c.refereePose === null ? null : object(c.refereePose, `${path}.refereePose`, ['x', 'z', 'yaw', 'pitch'], issues);
      if (pose) for (const field of ['x', 'z', 'yaw', 'pitch']) number(pose[field], `${path}.refereePose.${field}`, issues);
      const camera = object(c.camera, `${path}.camera`, ['position', 'target', 'verticalFovDeg', 'distanceM', 'lateralOffsetM'], issues);
      if (camera) { for (const field of ['position', 'target']) { const vector = array(camera[field], `${path}.camera.${field}`, issues); if (vector.length !== 3) issues.push(`${path}.camera.${field}: expected three components`); for (const component of vector) number(component, `${path}.camera.${field}`, issues); } number(camera.verticalFovDeg, `${path}.camera.verticalFovDeg`, issues); for (const field of ['distanceM', 'lateralOffsetM']) if (camera[field] !== null) number(camera[field], `${path}.camera.${field}`, issues); }
      for (const rectField of ['canvasCssRect', 'drawingBufferPixels']) {
        const keys = rectField === 'canvasCssRect' ? ['x', 'y', 'width', 'height'] : ['width', 'height'];
        const rect = object(c[rectField], `${path}.${rectField}`, keys, issues); if (rect) for (const key of keys) number(rect[key], `${path}.${rectField}.${key}`, issues);
      }
    }
  }
  for (const pairId of PAIRS) if (!seenPairs.has(pairId)) issues.push(`captures: missing pair ${pairId}`);
  for (const value of captures) {
    const pair = value as RecordValue;
    const original = pair?.original as RecordValue | undefined;
    const fresh = pair?.fresh as RecordValue | undefined;
    if (!original || !fresh) continue;
    for (const field of ['tick', 'preset', 'cameraMode', 'refereePose', 'camera', 'screenshotPixels', 'canvasCssRect', 'drawingBufferPixels', 'dpr', 'viewportCssPixels', 'locale', 'zoom', 'motion', 'quality', 'passReview', 'scenarioContentHash']) {
      if (JSON.stringify(original[field]) !== JSON.stringify(fresh[field])) issues.push(`captures.${String(pair.pairId)}: ${field} mismatch`);
    }
    const rect = original.canvasCssRect as RecordValue | undefined;
    if (rect && (typeof rect.x !== 'number' || typeof rect.y !== 'number' || typeof rect.width !== 'number' || typeof rect.height !== 'number' || rect.x > 91 || rect.y > 109 || rect.x + rect.width < 1189 || rect.y + rect.height < 568)) issues.push(`captures.${String(pair.pairId)}: incomplete crop coverage`);
  }
  if (answers) for (const checkpoint of CHECKPOINTS) {
    const answer = answers[checkpoint] as RecordValue | null;
    if (answer) for (const id of idSet(answer.presentedCaptureIds, `renderedAnswers.${checkpoint}.presentedCaptureIds`, [])) if (!captureIds.has(id)) issues.push(`renderedAnswers.${checkpoint}: missing capture ${id}`);
  }
  const comparison = object(bundle.comparison, 'comparison', ['algorithm', 'crop', 'results', 'reportDigest', 'verification'], issues);
  if (comparison) {
    equal(comparison.algorithm, 'decoded-rgb-canvas-exact-v1', 'comparison.algorithm', issues);
    const crop = object(comparison.crop, 'comparison.crop', ['x', 'y', 'width', 'height'], issues);
    if (crop) for (const [key, expected] of Object.entries({ x: 91, y: 109, width: 1098, height: 459 })) equal(crop[key], expected, `comparison.crop.${key}`, issues);
    const results = array(comparison.results, 'comparison.results', issues); const seen = new Set<string>();
    const resultOrder = results.map(value => String((value as RecordValue)?.pairId));
    if (resultOrder.some((id, index) => index > 0 && resultOrder[index - 1] >= id)) issues.push('comparison: pair IDs must be sorted ordinally');
    for (const [index, value] of results.entries()) {
      const result = object(value, `comparison.results.${index}`, ['pairId', 'originalSha256', 'freshSha256', 'differingPixels', 'maximumChannelDelta'], issues); if (!result) continue;
      if (!PAIRS.includes(String(result.pairId))) issues.push(`comparison: invalid pair ${String(result.pairId)}`);
      if (seen.has(String(result.pairId))) issues.push(`comparison: duplicate pair ${String(result.pairId)}`); seen.add(String(result.pairId));
      const pair = captures.find(item => (item as RecordValue)?.pairId === result.pairId) as RecordValue | undefined;
      for (const side of ['original', 'fresh'] as const) {
        const capture = pair?.[side] as RecordValue | undefined;
        const artifact = array(bundle.artifacts, 'artifacts', []).find(item => (item as RecordValue)?.artifactId === capture?.artifactId) as RecordValue | undefined;
        equal(result[`${side}Sha256`], artifact?.sha256, `comparison.results.${index}.${side}Sha256`, issues);
      }
      equal(result.differingPixels, 0, `comparison.results.${index}.differingPixels`, issues); equal(result.maximumChannelDelta, 0, `comparison.results.${index}.maximumChannelDelta`, issues);
    }
    for (const id of PAIRS) if (!seen.has(id)) issues.push(`comparison: missing pair ${id}`);
    const preimage = digestPreimage('refview-capture-comparison-v1', { algorithm: comparison.algorithm, crop: comparison.crop, results: comparison.results }, issues, 'comparison');
    if (preimage) equal(comparison.reportDigest, preimage, 'comparison.reportDigest', issues);
    attestation(comparison.verification, 'comparison.verification', preimage, artifacts, media, issues);
  }
  for (const field of ['calibration', 'sourceAndAssetReview']) {
    const report = object(bundle[field], field, ['artifactId', 'reportDigest', 'verification'], issues); if (!report) continue;
    const bytes = artifacts.get(String(report.artifactId)); if (!bytes) issues.push(`${field}: missing artifact`);
    mediaFor(report.artifactId, field, 'application/json', media, issues);
    const digest = bytes ? sha(bytes) : null; if (digest) equal(report.reportDigest, digest, `${field}.reportDigest`, issues);
    attestation(report.verification, `${field}.verification`, digest, artifacts, media, issues);
  }
  const motion = object(bundle.motionEvidence, 'motionEvidence', ['kind', 'route', 'artifactId', 'fromTick', 'toTick', 'scenarioContentHash', 'rendererFingerprint', 'verification'], issues);
  if (motion) {
    if (motion.kind === 'runningScene') { text(motion.route, 'motionEvidence.route', issues); equal(motion.artifactId, null, 'motionEvidence.artifactId', issues); }
    else if (motion.kind === 'recording') { equal(motion.route, null, 'motionEvidence.route', issues); if (!artifacts.has(String(motion.artifactId))) issues.push('motionEvidence: missing recording artifact'); mediaFor(motion.artifactId, 'motionEvidence', 'video/webm', media, issues); }
    else issues.push('motionEvidence: invalid kind');
    equal(motion.fromTick, 360, 'motionEvidence.fromTick', issues); equal(motion.toTick, 386, 'motionEvidence.toTick', issues);
    equal(motion.scenarioContentHash, scenario?.contentHash, 'motionEvidence.scenarioContentHash', issues); equal(motion.rendererFingerprint, renderer?.fingerprint, 'motionEvidence.rendererFingerprint', issues);
    const { verification: _verification, ...preimage } = motion;
    void _verification;
    attestation(motion.verification, 'motionEvidence.verification', digestPreimage('refview-motion-evidence-v1', preimage, issues, 'motionEvidence'), artifacts, media, issues);
  }
  const bundleDigest = digestPreimage('refview-review-evidence-v1', candidate, issues, 'bundle');
  issues.push('authority: trusted conversation and immutable running-build verification unavailable');
  issues.push('comparison: decoded PNG crop equality requires independent verifier');
  return { importable: false, issues, bundleDigest };
}
