import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { canonicalJsonV2 } from '@refview/content';
import { assessmentDraftsV1 } from '../src/features/assessments/source-v1';
import { prepareSyntheticAssessment, syntheticDecisions, syntheticItemId,
  syntheticReviewId, syntheticReviewerPrincipal, validateSyntheticReviewerUrl } from './setup-synthetic-assessment-test';

const digest = (value: string) => `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

test('synthetic source has a distinct stable identity and exact derived evidence digests', () => {
  const fixture = prepareSyntheticAssessment();
  assert.equal(fixture.source.itemId, syntheticItemId);
  assert.equal(fixture.source.type, 'ruleQuestion');
  assert.equal(fixture.source.version, 1);
  assert.deepEqual(fixture.source.recommendationRefs, []);
  assert.equal(assessmentDraftsV1.some((item) => item.source.itemId === syntheticItemId), false);
  assert.match(syntheticReviewId, /^synthetic-/);
  assert.equal(syntheticReviewerPrincipal, 'synthetic-assessment-reviewer-test');
  assert.equal(fixture.contentHash, digest(fixture.envelope));
  assert.equal(fixture.rubricHash, digest(fixture.rubricEnvelope));
  assert.equal(fixture.evidenceSha256, digest(fixture.evidenceArtifact));
  assert.equal(fixture.envelope, canonicalJsonV2(['refview-assessment-item-v1', fixture.source]));
  assert.equal(fixture.rubricEnvelope,
    canonicalJsonV2(['refview-assessment-rubric-v1', fixture.source.privateRubric]));
  assert.deepEqual(JSON.parse(fixture.evidenceArtifact), {
    kind: 'synthetic-assessment-review-test-only', itemId: syntheticItemId,
    version: 1, contentHash: fixture.contentHash, rubricHash: fixture.rubricHash,
    decisions: syntheticDecisions,
  });
  assert.deepEqual(prepareSyntheticAssessment(), fixture);
});

test('synthetic reviewer URL accepts only isolated loopback reviewer login', () => {
  const valid = 'postgres://refview_reviewer_test:secret@127.0.0.1:55439/refview_test';
  assert.equal(validateSyntheticReviewerUrl(valid, 'refview_test').username, 'refview_reviewer_test');
  assert.throws(() => validateSyntheticReviewerUrl(valid, 'refview'));
  assert.throws(() => validateSyntheticReviewerUrl(undefined, 'refview_test'));
  for (const value of [
    'postgres://refview_reviewer_test:secret@remote.example:55439/refview_test',
    'postgres://refview_reviewer_test:secret@127.0.0.1:5432/refview_test',
    'postgres://refview_reviewer:secret@127.0.0.1:55439/refview_test',
    'postgres://refview_reviewer_test:secret@127.0.0.1:55439/refview',
    `${valid}?host=remote.example`,
  ]) assert.throws(() => validateSyntheticReviewerUrl(value, 'refview_test'));
});
