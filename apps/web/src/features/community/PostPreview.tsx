import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locale';
import { communityCopy } from './copy';
import { EngagementIcon } from './EngagementIcon';
import type { SocialPreview } from './social-preview';

export function PostPreview({ preview, locale, detail = false }: { preview: SocialPreview; locale: Locale; detail?: boolean }) {
  const t = communityCopy[locale];
  const href = `/${locale}/community/${preview.matchId}`;
  return <article className={`rv-community__post${detail ? ' rv-community__post--detail' : ''}`}>
    <div className="rv-community__post-head">
      <div className="rv-community__avatar" aria-hidden="true">{preview.author.slice(0, 1)}</div>
      <div className="rv-community__author"><strong>{preview.author}</strong><span>{preview.authorRole[locale]}</span></div>
      <span className="rv-community__post-time">{preview.published[locale]}</span>
    </div>
    <div className="rv-community__post-content">
      <p className="rv-community__match-context">{preview.teams[locale]} <span>· {preview.context[locale]}</span></p>
      <p className="rv-community__fiction">{t.fictional}</p>
      {detail ? <h2>{preview.title[locale]}</h2> : <h3><Link href={href}>{preview.title[locale]}</Link></h3>}
      <p className="rv-community__opinion">{preview.opinion[locale]}</p>
      {preview.image && preview.imageAlt && <figure className="rv-community__figure">
        <div className="rv-community__image-wrap"><Image src={preview.image} alt={preview.imageAlt[locale]} width={1280} height={720} sizes="(max-width: 760px) 100vw, 680px" /></div>
        <figcaption>{preview.attachment[locale]}</figcaption>
      </figure>}
      {preview.image && <div className="rv-community__attachments">
        <a href={preview.image} target="_blank" rel="noopener noreferrer">{t.file} · PNG</a>
        <span>{t.external} · {t.externalNote}</span>
      </div>}
      {!preview.image && <p className="rv-community__no-media">{preview.attachment[locale]}</p>}
      <div className="rv-community__engagement" aria-label={t.readOnly}>
        {(['agree', 'disagree', 'comments'] as const).map((kind) => {
          const count = kind === 'comments' ? preview.comments.length : preview[kind];
          const label = t[kind];
          return <span className="rv-community__engagement-stat" key={kind} tabIndex={0} aria-label={`${count} ${label}`} data-tooltip={label}>
            <EngagementIcon kind={kind} /><strong aria-hidden="true">{count}</strong>
          </span>;
        })}
      </div>
      {!detail && <Link className="rv-community__read-link" href={href}>{t.open}</Link>}
    </div>
  </article>;
}
