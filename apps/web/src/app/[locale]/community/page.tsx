import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site/SiteHeader';
import { communityCopy } from '@/features/community/copy';
import { readSharedSocialFeed } from '@/features/community/social-shared-service';
import { SharedCommunityFeed } from '@/features/community/SharedCommunityFeed';
import '@/features/community/community.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return { title: locale === 'es' ? 'Comunidad | RefView' : 'Community | RefView', description: communityCopy[locale].intro };
}

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const t = communityCopy[locale];
  const sharedFeed = await readSharedSocialFeed();
  return <div className="rv-community">
    <a className="rv-community__skip" href="#community-title">{t.skip}</a>
    <SiteHeader locale={locale} active="community" />
    <main className="rv-community__content">
      <header className="rv-community__hero">
        <div><h1 id="community-title" tabIndex={-1}>{t.title}</h1><p className="rv-community__intro">{t.intro}</p></div>
        <aside className="rv-community__disclosure"><strong>{t.privateSpace}</strong><p>{t.privateSpaceNote}</p><p><Link href={`/${locale}/community/my`}>{t.privateSpace}</Link></p></aside>
      </header>
      <SharedCommunityFeed locale={locale} feed={sharedFeed} />
    </main>
  </div>;
}
