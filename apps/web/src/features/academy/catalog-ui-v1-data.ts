import 'server-only';
import { openApplicationDatabase } from '@/lib/db/application-runtime';
import { loadPublishedAcademyLessonV1 } from './published-reader-v1';
import { loadPublishedAssessmentV1 } from '@/features/assessments/published-reader-v1';
import { readAssessmentCatalog } from '@/features/assessments/route-ui-v1-data';
import type { AcademyLessonSourceV1 } from './lesson-source-v1';

export type AcademyLocale = 'es' | 'en';
export type CatalogLesson = Readonly<{
  lessonId: string;
  version: number;
  lawsEdition: string;
  topicId: string;
  level: string;
  title: string;
  lead: string;
}>;
export type PublicLesson = CatalogLesson & Readonly<{
  plainExplanation: string;
  technicalExplanation: string;
  example: Readonly<{ facts: string; evidence: string; interpretation: string; ruleApplication: string }>;
  sources: ReadonlyArray<Readonly<{ sourceId: string; displayLabel: string; documentUrl: string; printedPage: number; publisher: string }>>;
  followUps: ReadonlyArray<Readonly<{ followUpId: string; question: string; answer: string; sourceLabels: readonly string[] }>>;
  practice: ReadonlyArray<Readonly<{ itemId: string; version: number; title: string }>>;
}>;

export function projectCatalogLesson(source: AcademyLessonSourceV1, locale: AcademyLocale): CatalogLesson {
  return {
    lessonId: source.lessonId, version: source.version, lawsEdition: source.lawsEdition,
    topicId: source.topicId, level: source.level,
    title: source.localized[locale].title, lead: source.localized[locale].lead,
  };
}

export function projectPublicLesson(source: AcademyLessonSourceV1, locale: AcademyLocale): PublicLesson {
  const sourceLabels = new Map(source.officialSources.filter((item) => item.language === locale)
    .map((item) => [item.sourceId, item.displayLabel]));
  return {
    ...projectCatalogLesson(source, locale),
    plainExplanation: source.localized[locale].plainExplanation,
    technicalExplanation: source.localized[locale].technicalExplanation,
    example: {
      facts: source.example.facts[locale], evidence: source.example.evidence[locale],
      interpretation: source.example.interpretation[locale], ruleApplication: source.example.ruleApplication[locale],
    },
    sources: source.officialSources.filter((item) => item.language === locale).map((item) => ({
      sourceId: item.sourceId, displayLabel: item.displayLabel, documentUrl: item.documentUrl,
      printedPage: item.printedPage, publisher: item.publisher,
    })),
    followUps: source.preparedFollowUps.map((item) => ({
      followUpId: item.followUpId, question: item.question[locale], answer: item.answer[locale],
      sourceLabels: item.sourceIds[locale].map((id) => sourceLabels.get(id)!),
    })),
    practice: [],
  };
}

export async function readAcademyCatalog(locale: AcademyLocale): Promise<{ kind: 'ready'; lessons: CatalogLesson[] } | { kind: 'unavailable' }> {
  try {
    const database = openApplicationDatabase();
    const candidates = await database.academyPublication.findMany({
      where: { state: 'reviewed' }, select: { lessonId: true, lessonVersion: true },
      orderBy: [{ lessonId: 'asc' }, { lessonVersion: 'desc' }],
    });
    const verified = await Promise.all(candidates.map((candidate) =>
      loadPublishedAcademyLessonV1(database, { lessonId: candidate.lessonId, version: candidate.lessonVersion })));
    const latest = new Map<string, CatalogLesson>();
    for (const item of verified) {
      if (item && !latest.has(item.source.lessonId)) latest.set(item.source.lessonId, projectCatalogLesson(item.source, locale));
    }
    return { kind: 'ready', lessons: [...latest.values()] };
  } catch (error) {
    console.error('Academy catalog read failed', error);
    return { kind: 'unavailable' };
  }
}

export async function readAcademyLesson(lessonId: string, version: number, locale: AcademyLocale): Promise<
  { kind: 'ready'; lesson: PublicLesson } | { kind: 'missing' } | { kind: 'unavailable' }
> {
  try {
    const database = openApplicationDatabase();
    const compiled = await loadPublishedAcademyLessonV1(database, { lessonId, version });
    if (!compiled) return { kind: 'missing' };
    const lesson = projectPublicLesson(compiled.source, locale);
    const practice: Array<{ itemId: string; version: number; title: string }> = [];
    const assessmentCatalog = await readAssessmentCatalog(locale);
    for (const ref of compiled.source.practiceRefs) {
      if (ref.kind !== 'assessment' || ref.topicId !== compiled.source.topicId
        || ref.lawsEdition !== compiled.source.lawsEdition
        || assessmentCatalog.kind !== 'ready'
        || !assessmentCatalog.items.some((item) => item.itemId === ref.targetId
          && item.version === ref.targetVersion && item.topicId === ref.topicId
          && item.lawsEdition === ref.lawsEdition)) continue;
      try {
        const target = await loadPublishedAssessmentV1(database,
          { itemId: ref.targetId, version: ref.targetVersion });
        if (target && target.source.topicId === ref.topicId
          && target.source.lawsEdition === ref.lawsEdition) {
          practice.push({ itemId: target.source.itemId, version: target.source.version,
            title: target.source.localized[locale].title });
        }
      } catch (error) {
        console.error('Academy practice availability read failed', error);
      }
    }
    return { kind: 'ready', lesson: { ...lesson, practice } };
  } catch (error) {
    console.error('Academy lesson read failed', error);
    return { kind: 'unavailable' };
  }
}
