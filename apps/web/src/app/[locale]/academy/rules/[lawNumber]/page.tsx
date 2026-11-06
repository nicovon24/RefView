import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AcademyLawView } from '@/features/academy/AcademyRulesViews';
import { getLawEntry } from '@/features/academy/rules-directory-v1';
import '@/features/academy/catalog-ui-v1.css';
import '@/features/academy/law-depth.css';

type Props = { params: Promise<{ locale: string; lawNumber: string }> };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, lawNumber } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const law = getLawEntry(lawNumber);
  if (!law) notFound();
  return { title: `${locale === 'es' ? 'Regla' : 'Law'} ${law.number}: ${law.title[locale]} | RefView`,
    description: law.overview[locale] };
}

export default async function AcademyLawPage({ params }: Props) {
  const { locale, lawNumber } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const law = getLawEntry(lawNumber);
  if (!law) notFound();
  return <AcademyLawView locale={locale} law={law} />;
}
