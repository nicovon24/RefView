import 'dotenv/config';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, expect, test } from 'vitest';
import { PrismaClient } from '../../generated/prisma/client';
import { openTestDatabase } from '../../lib/db/connection';
import { syntheticLessonId } from '../../../scripts/setup-synthetic-academy-test';
import { listSavedAcademyLessons, saveAcademyLesson, unsaveAcademyLesson } from './saved-academy-service';

const database = openTestDatabase();
const appUrl = process.env.TEST_CONTENT_APP_URL;
if (!appUrl || !['postgres:', 'postgresql:'].includes(new URL(appUrl).protocol)
  || new URL(appUrl).hostname !== '127.0.0.1' || new URL(appUrl).port !== '55439'
  || new URL(appUrl).username !== 'refview_app_test'
  || decodeURIComponent(new URL(appUrl).pathname.slice(1)) !== 'refview_test'
  || new URL(appUrl).search || new URL(appUrl).hash) {
  throw new Error('TEST_CONTENT_APP_URL must target restricted refview_test');
}
const app = new PrismaClient({ adapter: new PrismaPg({ connectionString: appUrl }) });
afterAll(async () => { await app.$disconnect(); await database.$disconnect(); });
const ref = { lessonId: syntheticLessonId, version: 1 };
const hash = (token: string) => `sha256:${createHash('sha256').update(token).digest('hex')}`;

async function owner() {
  const token = randomBytes(32).toString('hex');
  const id = randomUUID();
  await database.anonymousSession.create({ data: { id, tokenHash: hash(token),
    expiresAt: new Date(Date.now() + 3600_000) } });
  return { id, cookie: { get: (name: string) => name === 'refview_session' ? { value: token } : undefined,
    set: () => { throw new Error('save service must not set cookies'); } },
  cleanup: async () => { await database.anonymousSession.deleteMany({ where: { id } }); } };
}

test('restricted service saves an exact published lesson once and projects a private owner list', async () => {
  const first = await owner(); const second = await owner();
  try {
    expect(await listSavedAcademyLessons(app, first.cookie, { locale: 'es' })).toEqual({ kind: 'ready', lessons: [] });
    expect(await saveAcademyLesson(app, first.cookie, ref)).toEqual({ kind: 'saved' });
    const initial = await listSavedAcademyLessons(app, first.cookie, { locale: 'es' });
    expect(initial).toMatchObject({ kind: 'ready', lessons: [{ ...ref, state: 'available', lesson: {
      lessonId: ref.lessonId, version: ref.version } }] });
    expect(JSON.stringify(initial)).not.toMatch(/ownerId|tokenHash|contentHash|privateRubric|reviewerPrincipal/);
    expect(await saveAcademyLesson(app, first.cookie, ref)).toEqual({ kind: 'saved' });
    expect(await listSavedAcademyLessons(app, first.cookie, { locale: 'en' })).toMatchObject({
      kind: 'ready', lessons: [{ ...ref, state: 'available' }] });
    const repeated = await listSavedAcademyLessons(app, first.cookie, { locale: 'es' });
    expect(repeated).toEqual(initial);
    expect(await listSavedAcademyLessons(app, second.cookie, { locale: 'es' })).toEqual({ kind: 'ready', lessons: [] });
    expect(await unsaveAcademyLesson(app, second.cookie, ref)).toEqual({ kind: 'unsaved' });
    expect(await listSavedAcademyLessons(app, first.cookie, { locale: 'es' })).toEqual(initial);
    expect(await unsaveAcademyLesson(app, first.cookie, ref)).toEqual({ kind: 'unsaved' });
    expect(await unsaveAcademyLesson(app, first.cookie, ref)).toEqual({ kind: 'unsaved' });
    expect(await listSavedAcademyLessons(app, first.cookie, { locale: 'es' })).toEqual({ kind: 'ready', lessons: [] });
  } finally { await first.cleanup(); await second.cleanup(); }
});

test('missing, expired and malformed owners do not bootstrap or save', async () => {
  const missing = { get: () => undefined, set: () => { throw new Error('unexpected cookie write'); } };
  expect(await listSavedAcademyLessons(app, missing, { locale: 'es' })).toEqual({ kind: 'missing' });
  await expect(saveAcademyLesson(app, missing, ref)).rejects.toThrow(/owner unavailable/);
  await expect(unsaveAcademyLesson(app, missing, ref)).rejects.toThrow(/owner unavailable/);
  const malformed = { ...missing, get: () => ({ value: 'not-a-token' }) };
  expect(await listSavedAcademyLessons(app, malformed, { locale: 'es' })).toEqual({ kind: 'missing' });
  const current = await owner();
  try {
    await database.anonymousSession.update({ where: { id: current.id }, data: {
      createdAt: new Date('1800-01-01T00:00:00Z'), expiresAt: new Date('1800-01-02T00:00:00Z') } });
    expect(await listSavedAcademyLessons(app, current.cookie, { locale: 'es' })).toEqual({ kind: 'missing' });
    await expect(saveAcademyLesson(app, current.cookie, ref)).rejects.toThrow(/owner unavailable/);
  } finally { await current.cleanup(); }
});

test('bounded input and unpublished source fail before a save', async () => {
  const current = await owner();
  try {
    for (const input of [{ ...ref, version: 0 }, { ...ref, extra: true },
      { ...ref, lessonId: 'x'.repeat(129) }]) {
      await expect(saveAcademyLesson(app, current.cookie, input)).rejects.toThrow();
    }
    await expect(saveAcademyLesson(app, current.cookie,
      { lessonId: 'law-12-penalty-area-contact', version: 1 })).rejects.toThrow(/unavailable/);
    await expect(saveAcademyLesson(app, current.cookie,
      { lessonId: syntheticLessonId, version: 999 })).rejects.toThrow(/unavailable/);
    expect(await listSavedAcademyLessons(app, current.cookie, { locale: 'es' })).toEqual({ kind: 'ready', lessons: [] });
    await expect(listSavedAcademyLessons(app, current.cookie, { locale: 'es', limit: 101 })).rejects.toThrow();
  } finally { await current.cleanup(); }
});

test('database failure returns unavailable rather than a ready empty list', async () => {
  const current = await owner();
  try {
    const broken = new Proxy(app, { get(target, property, receiver) {
      if (property === '$transaction') return async () => { throw new Error('database offline'); };
      return Reflect.get(target, property, receiver);
    } });
    expect(await listSavedAcademyLessons(broken, current.cookie, { locale: 'es' }))
      .toEqual({ kind: 'unavailable' });
  } finally { await current.cleanup(); }
});

test('retired saves require the complete transition record and remain removable', async () => {
  const current = await owner();
  const eventId = randomUUID();
  const restoreFixture = () => database.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL session_replication_role = 'replica'`;
    await tx.$executeRaw`DELETE FROM public."AcademyPublicationEvent"
      WHERE "lessonId"=${ref.lessonId} AND "lessonVersion"=${ref.version}
        AND "reason"='Synthetic saved service retirement test'`;
    await tx.$executeRaw`UPDATE public."AcademyPublication"
      SET "state"='reviewed'::public."PublicationState", "revision"=1, "retiredAt"=NULL
      WHERE "lessonId"=${ref.lessonId} AND "lessonVersion"=${ref.version}`;
  });
  try {
    await restoreFixture();
    await saveAcademyLesson(app, current.cookie, ref);
    await database.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL session_replication_role = 'replica'`;
      await tx.$executeRaw`UPDATE public."AcademyPublication"
        SET "state"='retired'::public."PublicationState", "revision"=2,
          "retiredAt"=clock_timestamp()
        WHERE "lessonId"=${ref.lessonId} AND "lessonVersion"=${ref.version}`;
    });
    expect(await listSavedAcademyLessons(app, current.cookie, { locale: 'es' }))
      .toMatchObject({ kind: 'ready', lessons: [{ ...ref, state: 'unavailable' }] });
    await database.$executeRaw`INSERT INTO public."AcademyPublicationEvent"
      ("eventId", "lessonId", "lessonVersion", "contentHash", "reviewId",
        "priorState", "nextState", "priorRevision", "nextRevision", "actor", "reason")
      SELECT ${eventId}, "lessonId", "lessonVersion", "contentHash", "reviewId",
        'reviewed'::public."PublicationState", 'retired'::public."PublicationState",
        1, 2, 'synthetic-assessment-reviewer-test', 'Synthetic saved service retirement test'
      FROM public."AcademyPublication"
      WHERE "lessonId"=${ref.lessonId} AND "lessonVersion"=${ref.version}`;
    expect(await listSavedAcademyLessons(app, current.cookie, { locale: 'es' }))
      .toMatchObject({ kind: 'ready', lessons: [{ ...ref, state: 'retired' }] });
    expect(await unsaveAcademyLesson(app, current.cookie, ref)).toEqual({ kind: 'unsaved' });
  } finally {
    await restoreFixture();
    await current.cleanup();
  }
});
