import { createHash } from 'node:crypto';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { inspectCandidateReviewEvidenceV1 } from './review-evidence-v1';
import { canonicalJsonV2 } from '../../../../../packages/content/src/source-core-v2';

const roots: string[] = [];
const hash = (value: string) => `sha256:${createHash('sha256').update(value).digest('hex')}`;
const questions = {
  onsidePose: 'Is the receiver visibly onside at tick `120`, including the animated body pose?',
  carelessChallenge: 'Does the challenge read as an attempt to play the ball and a careless trip, not incidental contact, simulation, recklessness, or excessive force?',
  contactInsideArea: 'Is the contact visibly inside the penalty area from the intended good position?',
  nonDogso: 'Do distance, direction, control likelihood, and actor locations/numbers together exclude DOGSO?',
  noCardAndSpa: 'Does the same action support the expected no-card result under the SPA exception?',
  goodPoorVisibility: 'Is decisive contact genuinely visible from the good position and genuinely restricted from the poor one?',
  teachingCredibility: 'Are the fall, reactions, whistle window, camera, lighting, field markings, and kit contrast credible enough to teach the intended evidence?',
};
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'review-evidence-'));
  roots.push(root);
  writeFileSync(join(root, 'reply.txt'), 'yes');
  const bundle = {
    schemaVersion: 1, purpose: 'incident001TrainingReview',
    scenario: { scenarioId: 'incident-001', version: 1, contentHash: hash('source') },
    renderer: { fingerprintVersion: 1, fingerprint: hash('renderer'), manifest: {}, historicalFingerprint: null, bindingMethod: 'retrospectiveCaptureComparison' },
    artifacts: [{ artifactId: 'reply', relativePath: 'reply.txt', byteLength: 3, sha256: hash('yes'), mediaType: 'text/plain' }],
    historicalFeedback: {}, briefApproval: {},
    renderedAnswers: Object.fromEntries(['onsidePose', 'carelessChallenge', 'contactInsideArea', 'nonDogso', 'noCardAndSpa', 'goodPoorVisibility', 'teachingCredibility'].map(id => [id, null])),
    captures: [], comparison: {}, motionEvidence: {}, calibration: {}, sourceAndAssetReview: {},
  };
  return { root, bundle };
}
function answeredFixture() {
  const { root, bundle } = fixture();
  const lines: string[] = ['Historic question', 'Historic generic reply', 'Brief question', 'Brief reply'];
  for (const [id, question] of Object.entries(questions)) lines.push(question, `Explicit answer for ${id}`);
  const transcript = lines.join('\n');
  writeFileSync(join(root, 'transcript.txt'), transcript);
  bundle.artifacts.push({ artifactId: 'transcript', relativePath: 'transcript.txt', byteLength: Buffer.byteLength(transcript), sha256: hash(transcript), mediaType: 'text/plain' });
  const when = { precision: 'unknown', value: null };
  function excerpt(index: number, speaker: 'Nicolas' | 'assistant') {
    const verbatim = lines[index];
    const startByte = Buffer.byteLength(lines.slice(0, index).join('\n')) + (index ? 1 : 0);
    return { artifactId: 'transcript', startByte, endByte: startByte + Buffer.byteLength(verbatim), verbatim, speaker, conversationRef: 'conversation-1', originalWhen: when };
  }
  const attestation = (subjectDigest: string, index: number) => ({
    subjectDigest, outcome: 'pass', reviewerPrincipal: 'Nicolas', reviewedWhen: when,
    source: { kind: 'trustedConversation', conversationRef: 'conversation-1', excerpt: excerpt(index, 'Nicolas') },
    evidenceArtifactIds: ['transcript'],
  });
  const candidate = bundle as unknown as Record<string, unknown>;
  candidate.historicalFeedback = { question: excerpt(0, 'assistant'), reply: excerpt(1, 'Nicolas') };
  candidate.briefApproval = { question: excerpt(2, 'assistant'), reply: excerpt(3, 'Nicolas') };
  const answers: Record<string, unknown> = {};
  Object.keys(questions).forEach((id, index) => {
    const answer = {
      checkpointId: id, question: excerpt(index * 2 + 4, 'assistant'), answer: excerpt(index * 2 + 5, 'Nicolas'),
      outcome: 'approved', presentedContentHash: bundle.scenario.contentHash,
      presentedRendererFingerprint: bundle.renderer.fingerprint, presentedCaptureIds: ['capture-1'],
    };
    answers[id] = { ...answer, verification: attestation(hash(canonicalJsonV2(['refview-checkpoint-answer-v1', answer])), index * 2 + 5) };
  });
  candidate.renderedAnswers = answers;
  return { root, candidate, excerpt, attestation };
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
describe('candidate review evidence', () => {
  it('remains diagnostic only and reports missing review evidence', () => {
    const { root, bundle } = fixture();
    const result = inspectCandidateReviewEvidenceV1(bundle, root);
    expect(result.importable).toBe(false);
    expect(result.issues.some(issue => issue.includes('captures'))).toBe(true);
  });
  it('rejects unknown shape and malformed checkpoint map', () => {
    const { root, bundle } = fixture();
    expect(inspectCandidateReviewEvidenceV1({ ...bundle, approval: true }, root).issues).toContain('bundle: unexpected key approval');
    const six = { ...bundle.renderedAnswers };
    delete six.teachingCredibility;
    expect(inspectCandidateReviewEvidenceV1({ ...bundle, renderedAnswers: six }, root).issues).toContain('renderedAnswers: missing key teachingCredibility');
  });
  it('checks exact artifact bytes and path safety', () => {
    const { root, bundle } = fixture();
    bundle.artifacts[0].sha256 = hash('wrong');
    expect(inspectCandidateReviewEvidenceV1(bundle, root).issues.some(issue => issue.includes('digest mismatch'))).toBe(true);
    bundle.artifacts[0].relativePath = '../outside.txt';
    expect(inspectCandidateReviewEvidenceV1(bundle, root).issues.some(issue => issue.includes('unsafe path'))).toBe(true);
  });
  it('requires canonical artifact ordering', () => {
    const { root, bundle } = fixture();
    writeFileSync(join(root, 'a.txt'), 'a');
    bundle.artifacts.unshift({ artifactId: 'z', relativePath: 'a.txt', byteLength: 1, sha256: hash('a'), mediaType: 'text/plain' });
    expect(inspectCandidateReviewEvidenceV1(bundle, root).issues).toContain('artifacts: IDs must be sorted ordinally');
  });
  it('rejects recycled historical approval and a question mapped to the wrong checkpoint', () => {
    const { root, candidate } = answeredFixture();
    const answers = candidate.renderedAnswers as Record<string, Record<string, unknown>>;
    const historical = candidate.historicalFeedback as Record<string, unknown>;
    for (const answer of Object.values(answers)) answer.answer = historical.reply;
    expect(inspectCandidateReviewEvidenceV1(candidate, root).issues).toContain('renderedAnswers.onsidePose: historical generic reply reused');
    const fresh = answeredFixture();
    const freshAnswers = fresh.candidate.renderedAnswers as Record<string, Record<string, unknown>>;
    freshAnswers.onsidePose.question = freshAnswers.nonDogso.question;
    expect(inspectCandidateReviewEvidenceV1(fresh.candidate, fresh.root).issues).toContain('renderedAnswers.onsidePose: wrong checkpoint question');
  });
  it('rejects malformed ID sets and manifest path collisions', () => {
    const { root, candidate } = answeredFixture();
    const answer = (candidate.renderedAnswers as Record<string, Record<string, unknown>>).onsidePose;
    answer.presentedCaptureIds = [7, 'capture-1', 'capture-1'];
    const verification = answer.verification as Record<string, unknown>;
    verification.evidenceArtifactIds = ['transcript', 'transcript', 7];
    const captures = candidate.captures as unknown[];
    captures.push({ pairId: 'AfirstPerson360', original: { provenance: { kind: 'reconstructed', evidenceArtifactIds: ['transcript', 'transcript', 4] } }, fresh: {} });
    const renderer = candidate.renderer as Record<string, unknown>;
    renderer.manifest = { schemaVersion: 1, sourceContentHash: (candidate.scenario as Record<string, unknown>).contentHash, playableProjectionHash: hash('playable'), execution: { nodeVersion: 'v24.0.0', pnpmVersion: '10.33.2', mode: 'development', sessionTestMode: false }, files: [{ path: 'Z.ts', byteLength: 1, sha256: hash('a') }, { path: 'z.ts', byteLength: 1, sha256: hash('a') }] };
    const issues = inspectCandidateReviewEvidenceV1(candidate, root).issues;
    expect(issues).toContain('renderedAnswers.onsidePose.presentedCaptureIds: invalid ID set');
    expect(issues).toContain('renderedAnswers.onsidePose.verification.evidenceArtifactIds: invalid ID set');
    expect(issues).toContain('captures.0.original.provenance.evidenceArtifactIds: invalid ID set');
    expect(issues).toContain('renderer.manifest.files: invalid path set');
  });
  it('requires artifact media types by reference role', () => {
    const { root, candidate } = answeredFixture();
    const artifacts = candidate.artifacts as Array<Record<string, unknown>>;
    const transcript = artifacts.find(item => item.artifactId === 'transcript')!;
    transcript.mediaType = 'image/png';
    const reports = { artifactId: 'transcript', reportDigest: hash('x'), verification: {} };
    candidate.calibration = reports;
    candidate.sourceAndAssetReview = reports;
    candidate.motionEvidence = { kind: 'recording', route: null, artifactId: 'transcript', fromTick: 360, toTick: 386, scenarioContentHash: (candidate.scenario as Record<string, unknown>).contentHash, rendererFingerprint: (candidate.renderer as Record<string, unknown>).fingerprint, verification: {} };
    (candidate.captures as unknown[]).push({ pairId: 'AfirstPerson360', original: { captureId: 'c1', artifactId: 'reply' }, fresh: { captureId: 'c2', artifactId: 'reply' } });
    const issues = inspectCandidateReviewEvidenceV1(candidate, root).issues;
    expect(issues).toContain('historicalFeedback.reply: transcript artifact must be text/plain or application/json');
    expect(issues).toContain('captures.0.original: capture artifact must be image/png');
    expect(issues).toContain('motionEvidence: recording artifact must be video/webm');
    expect(issues).toContain('calibration: report artifact must be application/json');
  });
});
