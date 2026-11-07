import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { ProfilePage } from '@/features/profile/ProfilePage';
import type { OwnerSessionState } from '@/features/profile/OwnerSessionPanel';
import { listSavedAcademyLessons } from '@/features/profile/saved-academy-service';
import { listAccountSavedAcademyLessons } from '@/features/profile/saved-academy-service';
import { readAccountPrincipal } from '@/lib/auth/account-principal';
import { readApplicationOwner } from '@/lib/auth/application-owner';
import { openApplicationDatabase, validateApplicationRuntime } from '@/lib/db/application-runtime';

export const dynamic = 'force-dynamic';

async function readOwnerSession(): Promise<OwnerSessionState> {
  try {
    validateApplicationRuntime(process.env);
    return await readApplicationOwner(openApplicationDatabase(), await cookies());
  } catch {
    return { status: 'unavailable' };
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return { title: locale === 'es' ? 'Perfil | RefView' : 'Profile | RefView' };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const account = await (async () => {
    try { return await readAccountPrincipal(await headers()); }
    catch { return { kind: 'unavailable' as const }; }
  })();
  const [ownerSession, savedLessons] = await Promise.all([
    readOwnerSession(),
    (async () => {
      try {
        validateApplicationRuntime(process.env);
        if (account.kind === 'unavailable') return { kind: 'unavailable' as const };
        return account.kind === 'account'
          ? await listAccountSavedAcademyLessons(openApplicationDatabase(), account, { locale })
          : await listSavedAcademyLessons(openApplicationDatabase(), await cookies(), { locale });
      } catch {
        return { kind: 'unavailable' as const };
      }
    })(),
  ]);
  return <ProfilePage locale={locale} ownerSession={ownerSession} savedLessons={savedLessons}
    accountState={account.kind === 'account' ? 'active' : account.kind}
    googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      && process.env.BETTER_AUTH_SECRET)} />;
}
