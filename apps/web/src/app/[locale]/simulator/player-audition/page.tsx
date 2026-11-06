import { notFound } from 'next/navigation';
import { PlayerAudition } from '@/features/simulator/player-audition/PlayerAudition';

export default async function PlayerAuditionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return <PlayerAudition locale={locale} />;
}
