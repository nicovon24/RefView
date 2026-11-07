import 'server-only';
import { cookies, headers } from 'next/headers';
import { readAccountPrincipal } from '@/lib/auth/account-principal';
import { openApplicationDatabase } from '@/lib/db/application-runtime';
import { loadPublishedAssessmentV1 } from './published-reader-v1';
import { loadPinnedAssessmentV1 } from './pinned-reader-v1';
import { projectAssessmentCatalogItemV1 } from './public-dto-v1';
import { restoreAccountAssessmentV1, restoreAssessmentV1 } from './owner-service-v1';

export type AssessmentLocale = 'es' | 'en';
export type CatalogItem = ReturnType<typeof projectAssessmentCatalogItemV1>;
export type RestoredAttempt = Awaited<ReturnType<typeof restoreAssessmentV1>>;
type LevelCounts = Record<'beginner' | 'intermediate' | 'advanced', number>;

export async function readAssessmentCatalog(locale: AssessmentLocale): Promise<
  { kind: 'ready'; items: CatalogItem[]; levelCounts: LevelCounts } | { kind: 'unavailable' }
> {
  try {
    const database = openApplicationDatabase();
    const candidates = await database.assessmentPublication.findMany({
      where: { state: 'reviewed' }, select: { itemId: true, itemVersion: true },
      orderBy: [{ itemId: 'asc' }, { itemVersion: 'desc' }],
    });
    const verified = await Promise.all(candidates.map((candidate) =>
      loadPublishedAssessmentV1(database, { itemId: candidate.itemId, version: candidate.itemVersion })));
    const latest = new Map<string, CatalogItem>();
    for (const item of verified) {
      if (item && !latest.has(item.source.itemId)) {
        latest.set(item.source.itemId, projectAssessmentCatalogItemV1(item, locale));
      }
    }
    const items = [...latest.values()];
    const levelCounts: LevelCounts = { beginner: 0, intermediate: 0, advanced: 0 };
    for (const item of items) levelCounts[item.level] += 1;
    return { kind: 'ready', items, levelCounts };
  } catch (error) {
    console.error('Assessment catalog read failed', error);
    return { kind: 'unavailable' };
  }
}

export async function readAssessmentAttempt(attemptId: string, locale: AssessmentLocale): Promise<
  { kind: 'ready'; value: RestoredAttempt; optionLabels: Record<string, string> }
    | { kind: 'missing' } | { kind: 'unavailable' }
> {
  try {
    const database = openApplicationDatabase();
    const principal = await readAccountPrincipal(await headers());
    const value = principal.kind === 'account'
      ? await restoreAccountAssessmentV1(database, principal, { attemptId, locale })
      : await restoreAssessmentV1(database, await cookies(), { attemptId, locale });
    const optionLabels: Record<string, string> = {};
    if (value.state === 'finalized' && value.result.submittedAnswer.kind === 'ruleQuestion') {
      const compiled = await loadPinnedAssessmentV1(database,
        { itemId: value.result.itemId, version: value.result.version });
      if (!compiled || compiled.source.inputSpec.kind !== 'ruleQuestion') {
        throw new Error('Assessment option labels unavailable');
      }
      for (const option of compiled.source.inputSpec.options) {
        optionLabels[option.optionId] = option.label[locale];
      }
    }
    return { kind: 'ready', value, optionLabels };
  } catch (error) {
    if (error instanceof Error && (error.message === 'assessment unavailable'
      || error.message === 'application owner unavailable')) return { kind: 'missing' };
    console.error('Assessment attempt read failed', error);
    return { kind: 'unavailable' };
  }
}
