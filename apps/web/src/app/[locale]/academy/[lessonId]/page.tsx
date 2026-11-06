import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { SiteHeader } from '@/components/site/SiteHeader';
import { academyCopy } from '@/features/academy/catalog-ui-v1-copy';
import { readAcademyCatalog, readAcademyLesson } from '@/features/academy/catalog-ui-v1-data';
import { AcademyLessonView } from '@/features/academy/AcademyViews';
import { AcademyBackLink } from '@/features/academy/AcademyBackLink';
import { AcademySaveControl } from '@/features/academy/AcademySaveControl';
import { listSavedAcademyLessons } from '@/features/profile/saved-academy-service';
import { openApplicationDatabase } from '@/lib/db/application-runtime';
import '@/features/academy/catalog-ui-v1.css';

type Props = { params: Promise<{ locale: string; lessonId: string }>; searchParams: Promise<{ version?: string }> };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return { title: `${academyCopy[locale].browse} | RefView`, robots: { index: false } };
}

export default async function AcademyLessonPage({ params, searchParams }: Props) {
  const { locale, lessonId } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lessonId)) notFound();
  const { version: rawVersion } = await searchParams;
  let version: number | undefined;
  if (rawVersion !== undefined) {
    if (!/^[1-9][0-9]*$/.test(rawVersion)) notFound();
    version = Number(rawVersion);
    if (!Number.isSafeInteger(version)) notFound();
  } else {
    const catalog = await readAcademyCatalog(locale);
    if (catalog.kind === 'unavailable') return <AcademyState locale={locale} kind="unavailable" />;
    version = catalog.lessons.find((lesson) => lesson.lessonId === lessonId)?.version;
  }
  const result = version === undefined ? { kind: 'missing' as const } : await readAcademyLesson(lessonId, version, locale);
  if (result.kind !== 'ready') return <AcademyState locale={locale} kind={result.kind} />;
  const lesson = result.lesson;
  const saved = await readSavedLessons(locale);
  const saveState = saved.kind === 'ready'
    ? saved.lessons.some((item) => item.lessonId === lessonId && item.version === lesson.version) ? 'saved' : 'unsaved'
    : saved.kind;
  return <AcademyLessonView locale={locale} lesson={lesson} mode="published" saveControl={
    <AcademySaveControl key={`${lessonId}:${lesson.version}:${saveState}`} locale={locale} lessonId={lessonId} version={lesson.version} initialState={saveState} />
  } />;
}

async function readSavedLessons(locale: 'es' | 'en') {
  try {
    return await listSavedAcademyLessons(openApplicationDatabase(), await cookies(), { locale, limit: 100 });
  } catch {
    return { kind: 'unavailable' as const };
  }
}

function AcademyState({ locale, kind }: { locale: 'es' | 'en'; kind: 'missing' | 'unavailable' }) {
  const t = academyCopy[locale];
  return <div className="rv-academy"><a className="rv-academy__skip" href="#lesson-title">{t.skip}</a>
    <SiteHeader locale={locale} active="academy" languagePath="/academy" />
    <main className="rv-academy__main"><AcademyBackLink href={`/${locale}/academy`} label={t.back} />
      <div className="rv-academy__state" role="status"><h1 id="lesson-title" tabIndex={-1}>{kind === 'missing' ? t.missingTitle : t.unavailableTitle}</h1><p>{kind === 'missing' ? t.missing : t.unavailable}</p></div>
    </main></div>;
}
