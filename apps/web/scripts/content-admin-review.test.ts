import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { prepareDraft } from './content-admin-draft';
import { parseReviewCommand, validateReceipt, confirmationText, digestEvidence,
  assertActionState } from './content-admin-review';

const academy = prepareDraft('academy', 'careless-trip-in-penalty-area');
const evidence = Buffer.from('exact reviewed artifact\n', 'utf8');
const evidenceSha256 = `sha256:${createHash('sha256').update(evidence).digest('hex')}`;
const decisions = { footballInterpretationApproved: true, sourcesAndProvenanceApproved: true,
  spanishEnglishEquivalenceApproved: true };

test('commands accept only built-in candidates and exact arguments', () => {
  assert.equal(parseReviewCommand(['verify', 'academy', academy.id]).action, 'verify');
  assert.equal(parseReviewCommand(['admit', 'academy', academy.id, 'receipt.json', 'evidence.md']).action, 'admit');
  assert.equal(parseReviewCommand(['publish', 'academy', academy.id, 'review-id', 'evidence.md', 'reason']).action, 'publish');
  assert.equal(parseReviewCommand(['retire', 'academy', academy.id, 'review-id', 'reason']).action, 'retire');
  assert.equal(parseReviewCommand(['withdraw', 'academy', academy.id, 'review-id', 'reason']).action, 'withdraw');
  assert.throws(() => parseReviewCommand(['admit', 'academy', 'invented', 'receipt.json', 'evidence.md']));
  assert.throws(() => parseReviewCommand(['publish', 'academy', academy.id, 'review-id', 'evidence.md']));
  assert.throws(() => parseReviewCommand(['retire', 'academy', academy.id, 'review-id', '']));
  assert.throws(() => parseReviewCommand(['retire', 'academy', academy.id, 'review-id', 'evidence.md', 'reason']));
  assert.throws(() => parseReviewCommand(['withdraw', 'academy', academy.id, 'review-id', 'evidence.md', 'reason']));
  assert.throws(() => parseReviewCommand(['withdraw', 'academy', academy.id, 'review-id', 'reason', '--actor=nicolas']));
  assert.throws(() => parseReviewCommand(['admit', 'academy', academy.id, 'receipt.json', 'evidence.md', '--actor=nicolas']));
});

test('receipt binds exact source, artifact digest and only required true decisions', () => {
  const receipt = { kind: academy.kind, id: academy.id, version: academy.version,
    contentHash: academy.contentHash, evidenceSha256, decisions };
  assert.deepEqual(validateReceipt(receipt, academy, evidenceSha256).decisions, decisions);
  assert.equal(digestEvidence(evidence), evidenceSha256);
  assert.throws(() => validateReceipt({ ...receipt, actor: 'nicolas' }, academy, evidenceSha256));
  assert.throws(() => validateReceipt({ ...receipt, evidenceSha256: 'sha256:' + '0'.repeat(64) }, academy, evidenceSha256));
  assert.throws(() => validateReceipt({ ...receipt, decisions: { ...decisions, spanishEnglishEquivalenceApproved: false } }, academy, evidenceSha256));
  assert.throws(() => validateReceipt({ ...receipt, decisions: { ...decisions, reviewerApproved: true } }, academy, evidenceSha256));
  assert.throws(() => validateReceipt({ ...receipt, version: 2 }, academy, evidenceSha256));
});

test('Assessment receipt requires exact rubric and all six affirmative decisions', () => {
  const draft = prepareDraft('assessment', 'challenge-severity-rule');
  if (draft.kind !== 'assessment') throw new Error('Expected assessment');
  const receipt = { kind: draft.kind, id: draft.id, version: draft.version,
    contentHash: draft.contentHash, rubricHash: draft.rubricHash, evidenceSha256,
    decisions: { ...decisions, acceptedAlternativesApproved: true, correctionApproved: true, rubricMeaningApproved: true } };
  validateReceipt(receipt, draft, evidenceSha256);
  assert.throws(() => validateReceipt({ ...receipt, rubricHash: 'sha256:' + '0'.repeat(64) }, draft, evidenceSha256));
  assert.throws(() => validateReceipt({ ...receipt, decisions }, draft, evidenceSha256));
});

test('confirmation binds action, identity and evidence digest', () => {
  assert.equal(confirmationText('ADMIT', academy, evidenceSha256),
    `ADMIT academy ${academy.id} v${academy.version} ${academy.contentHash} ${evidenceSha256}`);
  assert.equal(confirmationText('RETIRE', academy, evidenceSha256),
    `RETIRE academy ${academy.id} v${academy.version} ${academy.contentHash} ${evidenceSha256}`);
  assert.equal(confirmationText('WITHDRAW', academy, evidenceSha256),
    `WITHDRAW academy ${academy.id} v${academy.version} ${academy.contentHash} ${evidenceSha256}`);
});

test('publication actions require exact expected state and bound review for retirement', () => {
  const draft = { state: 'draft', revision: 0, review_id: null, content_hash: academy.contentHash };
  const reviewed = { state: 'reviewed', revision: 1, review_id: 'bound', content_hash: academy.contentHash };
  assert.doesNotThrow(() => assertActionState('publish', draft, 'bound'));
  assert.doesNotThrow(() => assertActionState('retire', reviewed, 'bound'));
  assert.doesNotThrow(() => assertActionState('withdraw', draft, 'unbound'));
  assert.doesNotThrow(() => assertActionState('withdraw', reviewed, 'unbound'));
  assert.throws(() => assertActionState('publish', reviewed, 'bound'));
  assert.throws(() => assertActionState('retire', draft, 'bound'));
  assert.throws(() => assertActionState('retire', reviewed, 'unbound'));
  assert.throws(() => assertActionState('retire', { ...reviewed, revision: 2 }, 'bound'));
});
