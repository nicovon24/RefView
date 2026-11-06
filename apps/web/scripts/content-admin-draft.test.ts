import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { canonicalJsonV2 } from '@refview/content';
import { prepareDraft, verifyStoredDraft, parseDraftCommand, validateReviewerUrl } from './content-admin-draft';

const digest = (value: string) => `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

test('prepares exact Academy fixture envelope and hash', () => {
  const draft = prepareDraft('academy', 'careless-trip-in-penalty-area');
  assert.equal(draft.kind, 'academy');
  assert.equal(draft.contentHash, digest(draft.envelope));
  assert.equal(draft.envelope, canonicalJsonV2(['refview-academy-lesson-v1', draft.source]));
  assert.equal(draft.version, 1);
});

test('prepares every exact Assessment fixture with bound rubric', () => {
  for (const id of ['careless-trip-penalty-restart', 'challenge-severity-rule', 'reckless-challenge-not-dogso']) {
    const draft = prepareDraft('assessment', id);
    assert.equal(draft.kind, 'assessment');
    assert.equal(draft.contentHash, digest(draft.envelope));
    assert.equal(draft.rubricHash, digest(draft.rubricEnvelope));
    assert.equal(draft.envelope, canonicalJsonV2(['refview-assessment-item-v1', draft.source]));
    assert.equal(draft.rubricEnvelope, canonicalJsonV2(['refview-assessment-rubric-v1', draft.source.privateRubric]));
  }
});

test('rejects arbitrary IDs, versions, actions and extra arguments', () => {
  assert.throws(() => prepareDraft('academy', 'some-other-lesson'));
  assert.throws(() => parseDraftCommand(['publish', 'academy', 'careless-trip-in-penalty-area']));
  assert.throws(() => parseDraftCommand(['import', 'academy', 'careless-trip-in-penalty-area', '--actor', 'nicolas']));
  assert.throws(() => parseDraftCommand(['import', 'assessment', 'challenge-severity-rule', '2']));
});

test('recompiles stored source and compares exact envelopes and hashes', () => {
  const draft = prepareDraft('assessment', 'challenge-severity-rule');
  assert.equal(draft.kind, 'assessment');
  verifyStoredDraft(draft, { sourceJson: draft.source, canonicalEnvelope: draft.envelope,
    contentHash: draft.contentHash, rubricEnvelope: draft.rubricEnvelope,
    rubricHash: draft.rubricHash, rubricVersion: 1, sourceSchemaVersion: 1 });
  assert.throws(() => verifyStoredDraft(draft, { sourceJson: draft.source,
    canonicalEnvelope: draft.envelope + ' ', contentHash: draft.contentHash,
    rubricEnvelope: draft.rubricEnvelope, rubricHash: draft.rubricHash,
    rubricVersion: 1, sourceSchemaVersion: 1 }));
  assert.throws(() => verifyStoredDraft(draft, { sourceJson: { ...draft.source, version: 2 },
    canonicalEnvelope: draft.envelope, contentHash: draft.contentHash,
    rubricEnvelope: draft.rubricEnvelope, rubricHash: draft.rubricHash,
    rubricVersion: 1, sourceSchemaVersion: 1 }));
});

test('requires distinct reviewer and application URLs', () => {
  assert.throws(() => validateReviewerUrl(undefined, undefined, 'refview_test'));
  assert.throws(() => validateReviewerUrl('postgres://u:p@localhost:55439/refview', 'postgres://u:p@localhost:55439/refview', 'refview'));
  assert.throws(() => validateReviewerUrl('postgres://refview_reviewer_test:p@remote.example:55439/refview_test', undefined, 'refview_test'));
  assert.throws(() => validateReviewerUrl('postgres://refview_reviewer_test:p@localhost:55439/refview_test?host=remote.example', undefined, 'refview_test'));
  assert.throws(() => validateReviewerUrl('postgres://refview_reviewer:p@localhost:55439/refview_test', undefined, 'refview_test'));
  assert.throws(() => validateReviewerUrl('postgres://refview_reviewer_test:p@localhost:55439/refview', undefined, 'refview_test'));
  assert.equal(validateReviewerUrl('postgres://refview_reviewer_test:p@localhost:55439/refview_test',
    'postgres://refview_app_test:p@localhost:55439/refview_test', 'refview_test').username, 'refview_reviewer_test');
});

test('recompiles exact stored Academy bytes', () => {
  const draft = prepareDraft('academy', 'careless-trip-in-penalty-area');
  verifyStoredDraft(draft, { sourceJson: draft.source, canonicalEnvelope: draft.envelope,
    contentHash: draft.contentHash, sourceSchemaVersion: 1 });
  assert.throws(() => verifyStoredDraft(draft, { sourceJson: { ...draft.source, version: 2 },
    canonicalEnvelope: draft.envelope, contentHash: draft.contentHash, sourceSchemaVersion: 1 }));
});
