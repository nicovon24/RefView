import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { projectPublicLesson } from '@/features/academy/catalog-ui-v1-data';
import { academyLessonSourceV1 } from '@/features/academy/lesson-source-v1';
import { AcademyLessonView } from '@/features/academy/AcademyViews';
import '@/features/academy/catalog-ui-v1.css';

type Props = { params: Promise<{ locale: string }> };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return { title: `${academyLessonSourceV1.localized[locale].title} | RefView`, robots: { index: false, follow: false } };
}

export default async function AcademyInterfacePreview({ params }: Props) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const lesson = projectPublicLesson(academyLessonSourceV1, locale);
  return <AcademyLessonView locale={locale} lesson={{ ...lesson, practice: [] }} mode="preview" />;
}
