import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { SessionPreview } from '@/features/simulator/session-preview/SessionPreview';
import { readAnonymousSession } from '@/lib/auth/anonymous-session';
import { openSessionTestDatabase, validateSessionTestRuntime } from '@/lib/db/session-runtime';

export const dynamic = 'force-dynamic';

export default async function SessionPreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  try { validateSessionTestRuntime(process.env); }
  catch { notFound(); }
  const status = await readAnonymousSession(openSessionTestDatabase(), await cookies());
  return <SessionPreview locale={locale} initialStatus={status.status} />;
}
