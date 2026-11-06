import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site/SiteHeader';
import { communityCopy } from '@/features/community/copy';
import { PostPreview } from '@/features/community/PostPreview';
import { findSocialPreview, socialPreview } from '@/features/community/social-preview';
import '@/features/community/community.css';

export function generateStaticParams() {
  return ['es', 'en'].flatMap((locale) => socialPreview.map(({ matchId }) => ({ locale, matchId })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; matchId: string }> }): Promise<Metadata> {
  const { locale, matchId } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const post = findSocialPreview(matchId);
  if (!post) notFound();
  return { title: `${post.title[locale]} | RefView`, description: `${communityCopy[locale].fictional}. ${post.opinion[locale]}` };
}

export default async function CommunityPostPage({ params }: { params: Promise<{ locale: string; matchId: string }> }) {
  const { locale, matchId } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const post = findSocialPreview(matchId);
  if (!post) notFound();
  const t = communityCopy[locale];
  return <div className="rv-community">
    <a className="rv-community__skip" href="#post-title">{t.skip}</a>
    <SiteHeader locale={locale} active="community" languagePath={`/community/${matchId}`} />
    <main className="rv-community__content rv-community__content--detail">
      <Link className="rv-community__back" href={`/${locale}/community`}>{t.back}</Link>
      <h1 id="post-title" className="rv-community__detail-title" tabIndex={-1}>{t.post}</h1>
      <div className="rv-community__detail-layout">
        <div>
          <p className="rv-community__detail-disclosure"><strong>{t.preview}.</strong> {t.previewNote}</p>
          <PostPreview preview={post} locale={locale} detail />
          <section className="rv-community__replies" aria-labelledby="replies-title">
            <h2 id="replies-title">{t.replies} <span>{post.comments.length}</span></h2>
            {post.comments.length ? <ol>{post.comments.map((comment, index) => <li key={`${comment.author}-${index}`} className={comment.replyTo ? 'rv-community__reply rv-community__reply--nested' : 'rv-community__reply'}>
              <div className="rv-community__avatar" aria-hidden="true">{comment.author.slice(0, 1)}</div>
              <div><p className="rv-community__reply-author"><strong>{comment.author}</strong> <span>· {comment.role[locale]} · {t.example}</span></p>
              {comment.replyTo && <p className="rv-community__reply-to">{t.replyTo} {comment.replyTo}</p>}
              <p>{comment.text[locale]}</p></div>
            </li>)}</ol> : <p>{t.noComments}</p>}
          </section>
          <p className="rv-community__read-only">{t.readOnly}</p>
        </div>
        <aside className="rv-community__detail-aside">
          <h2>{t.match}</h2><p className="rv-community__aside-teams">{post.teams[locale]}</p><p>{post.context[locale]}</p>
          {post.matchRating && <div className="rv-community__match-rating"><h3>{t.matchRating}</h3><p className="rv-community__rating-number">{post.matchRating.score}<span> / 5</span></p><p><strong>{post.matchRating.author}</strong> · {post.matchRating.role[locale]} · {post.matchRating.viewed[locale]}</p><p>{post.matchRating.text[locale]}</p><small>{t.ratingNote}</small></div>}
          <div className="rv-community__attachment-example"><h3>{t.external}</h3><p>{t.externalNote}</p><h3>{t.file}</h3><p>{t.readOnly}</p></div>
          <nav aria-label={t.language}><Link href={`/es/community/${matchId}`} lang="es" aria-current={locale === 'es' ? 'page' : undefined}>Español</Link><Link href={`/en/community/${matchId}`} lang="en" aria-current={locale === 'en' ? 'page' : undefined}>English</Link></nav>
        </aside>
      </div>
    </main>
  </div>;
}
