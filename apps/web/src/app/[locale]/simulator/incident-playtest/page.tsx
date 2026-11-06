import { notFound } from 'next/navigation';
import { loadIncident001Preview } from '@/features/simulator/incident/load-incident';
import { IncidentPlaytest } from '@/features/simulator/incident/playtest/IncidentPlaytest';

export default async function IncidentPlaytestPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return <IncidentPlaytest locale={locale} playable={loadIncident001Preview()} />;
}
