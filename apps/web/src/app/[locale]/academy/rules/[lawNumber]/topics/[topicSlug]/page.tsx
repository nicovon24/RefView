import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AcademyTopicView } from '@/features/academy/AcademyRulesViews';
import type { AcademyLocale } from '@/features/academy/catalog-ui-v1-data';
import { getLawEntry, getLawTopic } from '@/features/academy/rules-directory-v1';
import '@/features/academy/catalog-ui-v1.css';
import '@/features/academy/law-depth.css';

type Props = { params: Promise<{ locale: string; lawNumber: string; topicSlug: string }> };

async function readRoute(params: Props['params']) {
  const { locale, lawNumber, topicSlug } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const supportedLocale: AcademyLocale = locale;
  const law = getLawEntry(lawNumber);
  if (!law) notFound();
  const topic = getLawTopic(law.number, topicSlug);
  if (!topic) notFound();
  return { locale: supportedLocale, law, topic };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, topic } = await readRoute(params);
  return { title: `${topic.title[locale]} | RefView`, description: topic.scope[locale] };
}

export default async function AcademyTopicPage({ params }: Props) {
  const { locale, law, topic } = await readRoute(params);
  return <AcademyTopicView locale={locale} law={law} topic={topic} />;
}
