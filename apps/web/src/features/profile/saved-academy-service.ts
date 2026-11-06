import 'server-only';
import { z } from 'zod';
import type { PrismaClient } from '../../generated/prisma/client';
import { applicationOwnerTokenHash, resolveExclusiveApplicationOwner, withApplicationOwner,
  type ApplicationOwnerCookieStore, type ApplicationOwnerTransaction } from '../../lib/auth/application-owner';
import { projectCatalogLesson, type AcademyLocale, type CatalogLesson } from '../academy/catalog-ui-v1-data';
import { loadPublishedAcademyLessonV1, verifyPublishedAcademyLessonV1 } from '../academy/published-reader-v1';

const identity = z.strictObject({ lessonId: z.string().min(1).max(128)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), version: z.number().int().positive().safe() });
const listInput = z.strictObject({ locale: z.enum(['es', 'en']), limit: z.number().int().min(1).max(100).optional() });
type SavedLesson = Readonly<{ lessonId: string; version: number; savedAt: string;
  state: 'available' | 'retired' | 'unavailable'; lesson?: CatalogLesson }>;
type SavedList = Readonly<{ kind: 'ready'; lessons: SavedLesson[] } | { kind: 'missing' } | { kind: 'unavailable' }>;
type SavedRow = { lessonId: string; version: number; contentHash: string; savedAt: Date };

const unavailable = () => new Error('saved Academy lesson unavailable');
const ownerUnavailable = () => new Error('saved Academy owner unavailable');

/** The SQL function owns the final publication lock and hash check. No owner ID enters SQL. */
export async function saveAcademyLesson(database: PrismaClient,
  cookies: ApplicationOwnerCookieStore, input: unknown): Promise<{ kind: 'saved' }> {
  const ref = identity.parse(input);
  const tokenHash = applicationOwnerTokenHash(cookies);
  if (!tokenHash) throw ownerUnavailable();
  return database.$transaction(async (tx) => {
    if (!await resolveExclusiveApplicationOwner(tx, cookies)) throw ownerUnavailable();
    const compiled = await loadPublishedAcademyLessonV1(tx, ref);
    if (!compiled) throw unavailable();
    await tx.$queryRaw`SELECT public.application_save_academy(
      ${tokenHash}, ${ref.lessonId}, ${ref.version}, ${compiled.contentHash})::text`;
    return { kind: 'saved' } as const;
  });
}

/** Publication eligibility is intentionally absent: an old save remains removable. */
export async function unsaveAcademyLesson(database: PrismaClient,
  cookies: ApplicationOwnerCookieStore, input: unknown): Promise<{ kind: 'unsaved' }> {
  const ref = identity.parse(input);
  const tokenHash = applicationOwnerTokenHash(cookies);
  if (!tokenHash) throw ownerUnavailable();
  return database.$transaction(async (tx) => {
    if (!await resolveExclusiveApplicationOwner(tx, cookies)) throw ownerUnavailable();
    await tx.$queryRaw`SELECT public.application_unsave_academy(
      ${tokenHash}, ${ref.lessonId}, ${ref.version})::text`;
    return { kind: 'unsaved' } as const;
  });
}

async function projectSaved(tx: ApplicationOwnerTransaction, row: SavedRow,
  locale: AcademyLocale): Promise<SavedLesson> {
  const base = { lessonId: row.lessonId, version: row.version,
    savedAt: row.savedAt.toISOString() };
  const ref = { lessonId: row.lessonId, version: row.version };
  const publication = await tx.academyPublication.findUnique({
    where: { lessonId_lessonVersion: { lessonId: row.lessonId, lessonVersion: row.version } },
    include: { source: true, review: { include: { revocations: true, principal: true } }, events: true },
  });
  if (!publication || publication.contentHash !== row.contentHash) return { ...base, state: 'unavailable' };
  if (publication.state === 'reviewed') {
    try {
      const compiled = verifyPublishedAcademyLessonV1(publication, ref);
      return compiled ? { ...base, state: 'available',
        lesson: projectCatalogLesson(compiled.source, locale) } : { ...base, state: 'unavailable' };
    } catch { return { ...base, state: 'unavailable' }; }
  }
  if (publication.state !== 'retired' || publication.revision !== 2
    || !publication.reviewId || !publication.reviewedAt || !publication.retiredAt
    || publication.retiredAt.getTime() < publication.reviewedAt.getTime()) {
    return { ...base, state: 'unavailable' };
  }
  const reviewedEvent = publication.events.some((event) => event.priorState === 'draft'
    && event.nextState === 'reviewed' && event.priorRevision === 0 && event.nextRevision === 1
    && event.contentHash === row.contentHash && event.reviewId === publication.reviewId);
  const retiredEvent = publication.events.some((event) => event.priorState === 'reviewed'
    && event.nextState === 'retired' && event.priorRevision === 1 && event.nextRevision === 2
    && event.contentHash === row.contentHash && event.reviewId === publication.reviewId
    && event.occurredAt.getTime() >= publication.reviewedAt!.getTime());
  if (!reviewedEvent || !retiredEvent) return { ...base, state: 'unavailable' };
  try {
    const compiled = verifyPublishedAcademyLessonV1({ ...publication,
      state: 'reviewed', revision: 1, retiredAt: null }, ref);
    return compiled?.contentHash === row.contentHash
      ? { ...base, state: 'retired' } : { ...base, state: 'unavailable' };
  } catch { return { ...base, state: 'unavailable' }; }
}

/** An uncached owner read through the narrow SQL function. Returned fields are safe client props. */
export async function listSavedAcademyLessons(database: PrismaClient,
  cookies: ApplicationOwnerCookieStore, input: unknown): Promise<SavedList> {
  const request = listInput.parse(input);
  const tokenHash = applicationOwnerTokenHash(cookies);
  if (!tokenHash) return { kind: 'missing' };
  try {
    return await withApplicationOwner(database, cookies, async (tx) => {
      const rows = await tx.$queryRaw<SavedRow[]>`
        SELECT lesson_id AS "lessonId", lesson_version AS version,
          content_hash AS "contentHash", saved_at AS "savedAt"
        FROM public.application_list_saved_academy(${tokenHash}, ${request.limit ?? 50})`;
      const lessons: SavedLesson[] = [];
      for (const row of rows) lessons.push(await projectSaved(tx, row, request.locale));
      return { kind: 'ready', lessons } as const;
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'application owner unavailable') return { kind: 'missing' };
    return { kind: 'unavailable' };
  }
}
