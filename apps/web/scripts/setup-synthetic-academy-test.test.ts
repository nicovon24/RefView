import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { canonicalJsonV2 } from '@refview/content';
import { academyLessonSourceV1 } from '../src/features/academy/lesson-source-v1';
import { prepareSyntheticAcademy, syntheticDecisions, syntheticLessonId,
  syntheticReviewId, syntheticReviewerPrincipal, validateSyntheticReviewerUrl } from './setup-synthetic-academy-test';

const digest = (value: string) => `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`;

test('synthetic Academy source is distinct and its evidence is bound to exact compiled bytes', () => {
  const fixture = prepareSyntheticAcademy();
  assert.equal(fixture.source.lessonId, syntheticLessonId);
  assert.notEqual(fixture.source.lessonId, academyLessonSourceV1.lessonId);
  assert.equal(fixture.source.version, 1);
  assert.deepEqual(fixture.source.practiceRefs, []);
  assert.match(syntheticReviewId, /^synthetic-/);
  assert.equal(syntheticReviewerPrincipal, 'synthetic-assessment-reviewer-test');
  assert.equal(fixture.contentHash, digest(fixture.envelope));
  assert.equal(fixture.evidenceSha256, digest(fixture.evidenceArtifact));
  assert.equal(fixture.envelope, canonicalJsonV2(['refview-academy-lesson-v1', fixture.source]));
  assert.deepEqual(JSON.parse(fixture.evidenceArtifact), {
    kind: 'synthetic-academy-review-test-only', lessonId: syntheticLessonId,
    version: 1, contentHash: fixture.contentHash, decisions: syntheticDecisions,
  });
  assert.deepEqual(prepareSyntheticAcademy(), fixture);
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
