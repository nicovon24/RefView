import { notFound } from 'next/navigation';
import { ControlsPreview } from '@/features/simulator/controls/ControlsPreview';

export default async function ControlsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return <ControlsPreview locale={locale} />;
}
