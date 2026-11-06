import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AcademyCatalogView } from '@/features/academy/AcademyViews';
import { academyCopy } from '@/features/academy/catalog-ui-v1-copy';
import { readAcademyCatalog } from '@/features/academy/catalog-ui-v1-data';
import '@/features/academy/catalog-ui-v1.css';

type Props = { params: Promise<{ locale: string }> };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return { title: `${academyCopy[locale].title} | RefView`, description: academyCopy[locale].intro };
}

export default async function AcademyPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const result = await readAcademyCatalog(locale);
  return <AcademyCatalogView locale={locale} lessons={result.kind === 'ready' ? result.lessons : []} outcome={result.kind} />;
}
