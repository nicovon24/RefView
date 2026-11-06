import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site/SiteHeader';
import { communityCopy } from '@/features/community/copy';
import { PostPreview } from '@/features/community/PostPreview';
import { socialPreview } from '@/features/community/social-preview';
import '@/features/community/community.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return { title: locale === 'es' ? 'Comunidad ficticia | RefView' : 'Fictional Community | RefView', description: communityCopy[locale].intro };
}

export default async function CommunityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const t = communityCopy[locale];
  return <div className="rv-community">
    <a className="rv-community__skip" href="#community-title">{t.skip}</a>
    <SiteHeader locale={locale} active="community" />
    <main className="rv-community__content">
      <header className="rv-community__hero">
        <div><h1 id="community-title" tabIndex={-1}>{t.title}</h1><p className="rv-community__intro">{t.intro}</p></div>
        <aside className="rv-community__disclosure"><strong>{t.preview}</strong><p>{t.previewNote}</p><p>{t.readOnly}</p></aside>
      </header>
      <section className="rv-community__feed" aria-labelledby="feed-title">
        <div className="rv-community__feed-heading"><h2 id="feed-title">{t.feed}</h2><p>{t.feedNote}</p></div>
        <div className="rv-community__feed-layout">
          <div className="rv-community__post-list">{socialPreview.filter((post) => !post.legacy).map((post) => <PostPreview key={post.matchId} preview={post} locale={locale} />)}</div>
          <aside className="rv-community__feed-aside">
            <h2>{t.match}</h2><p>{t.previewNote}</p>
            <div className="rv-community__aside-rule"><strong>{t.post}</strong><span>{t.agree} / {t.disagree} / {t.comments}</span></div>
            <div className="rv-community__aside-rule"><strong>{t.attachment}</strong><span>{t.image} · {t.file} · {t.external}</span></div>
          </aside>
        </div>
      </section>
    </main>
  </div>;
}
