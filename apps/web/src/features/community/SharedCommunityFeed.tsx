'use client';

import Link from 'next/link';
import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/lib/i18n/locale';
import type { SharedSocialFeed, SharedSocialPost } from './social-shared-service';
import { issueSharedOperation, reactToSharedPost, reportSharedPostAction } from './social-shared-actions';
import { EngagementIcon } from './EngagementIcon';
import './social-shared.css';

const copy = {
  es: {
    title: 'Publicaciones de la comunidad', real: 'Aporte de una persona',
    explanation: 'Opiniones de personas sobre jugadas. Los acuerdos y desacuerdos muestran puntos de vista, no una decisión arbitral oficial.',
    empty: 'Todavía no hay publicaciones compartidas.', unavailable: 'No pudimos cargar las publicaciones en este momento.',
    create: 'Escribir sobre una jugada', signIn: 'Iniciá sesión para reaccionar o reportar',
    agree: 'De acuerdo', disagree: 'En desacuerdo', removeReaction: 'Quitar mi reacción',
    report: 'Reportar publicación', reportReason: 'Motivo', detail: 'Detalle (opcional)',
    reasons: { abuse: 'Abuso', privacy: 'Privacidad', spam: 'Spam', other: 'Otro' },
    sendReport: 'Enviar reporte', cancel: 'Cancelar', reported: 'Reporte enviado. Se revisará por separado.',
    saved: 'Reacción guardada.', error: 'No se pudo completar la acción. Actualizá la página e intentá de nuevo.',
    working: 'Guardando…', match: 'Partido', at: 'Publicado',
  },
  en: {
    title: 'Community posts', real: 'Person-authored post',
    explanation: 'People’s opinions about plays. Agreement and disagreement express views, not an official refereeing decision.',
    empty: 'There are no shared posts yet.', unavailable: 'We could not load posts right now.',
    create: 'Write about a play', signIn: 'Sign in to react or report',
    agree: 'Agree', disagree: 'Disagree', removeReaction: 'Remove my reaction',
    report: 'Report post', reportReason: 'Reason', detail: 'Detail (optional)',
    reasons: { abuse: 'Abuse', privacy: 'Privacy', spam: 'Spam', other: 'Other' },
    sendReport: 'Send report', cancel: 'Cancel', reported: 'Report sent for separate review.',
    saved: 'Reaction saved.', error: 'Could not complete the action. Refresh the page and try again.',
    working: 'Saving…', match: 'Match', at: 'Published',
  },
} as const;

const periodLabels: Record<Locale, Record<string, string>> = {
  es: {
    first: 'Primer tiempo', second: 'Segundo tiempo',
    extra_first: 'Primer tiempo extra', extra_second: 'Segundo tiempo extra',
    shootout: 'Tanda de penales',
  },
  en: {
    first: 'First half', second: 'Second half',
    extra_first: 'First half of extra time', extra_second: 'Second half of extra time',
    shootout: 'Penalty shootout',
  },
};

type Operation = 'reaction' | 'report';
type Notice = { postId: string; kind: 'saved' | 'reported' | 'error' } | null;

function dateLabel(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-AR' : 'en-US', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC',
  }).format(new Date(value));
}

export function SharedCommunityFeed({ locale, feed }: { locale: Locale; feed: SharedSocialFeed }) {
  const t = copy[locale];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reporting, setReporting] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const retryKeys = useRef<Record<string, { fingerprint: string; key: string }>>({});

  function run(postId: string, operation: Operation, payload: object, action: (key: string) => Promise<unknown>) {
    const slot = `${operation}:${postId}`;
    const fingerprint = JSON.stringify(payload);
    setNotice(null);
    startTransition(async () => {
      try {
        let retry = retryKeys.current[slot];
        if (!retry || retry.fingerprint !== fingerprint) {
          const issued = await issueSharedOperation({ operation });
          retry = { fingerprint, key: issued.operationKey };
          retryKeys.current[slot] = retry;
        }
        await action(retry.key);
        delete retryKeys.current[slot];
        setNotice({ postId, kind: operation === 'report' ? 'reported' : 'saved' });
        setReporting(null);
        router.refresh();
      } catch {
        setNotice({ postId, kind: 'error' });
      }
    });
  }

  function react(post: SharedSocialPost, choice: 'agree' | 'disagree') {
    const payload = {
      postId: post.id,
      choice: post.myReaction?.choice === choice ? 'clear' : choice,
      expectedRevision: post.myReaction?.revision ?? -1,
    };
    run(post.id, 'reaction', payload, (operationKey) => reactToSharedPost({ ...payload, operationKey }));
  }

  return <section className="rv-social-shared" aria-labelledby="community-shared-title">
    <div className="rv-social-shared__heading">
      <div><h2 id="community-shared-title">{t.title}</h2><p>{t.explanation}</p></div>
      <Link href={`/${locale}/community/my`}>{t.create}</Link>
    </div>
    {feed.kind === 'unavailable' ? <p role="status">{t.unavailable}</p>
      : feed.posts.length === 0 ? <p className="rv-social-shared__empty">{t.empty}</p>
      : <ol className="rv-social-shared__list">{feed.posts.map((post) => <li key={post.id}>
        <article className="rv-social-shared__post">
          <div className="rv-social-shared__meta"><span className="rv-social-shared__badge">{t.real}</span>
            <time dateTime={post.publishedAt}>{t.at} {dateLabel(post.publishedAt, locale)}</time></div>
          <p className="rv-social-shared__author">{post.contributor.displayName}</p>
          <h3>{post.match.homeTeam} – {post.match.awayTeam}</h3>
          <p className="rv-social-shared__context">{post.match.competition ? `${post.match.competition} · ` : ''}{post.match.matchDate}
            {post.period && periodLabels[locale][post.period] ? ` · ${periodLabels[locale][post.period]}` : ''}
            {post.minute !== null ? ` · ${post.minute}′` : ''}</p>
          <p className="rv-social-shared__opinion">{post.opinion}</p>
          <div className="rv-social-shared__actions">
            <button className="rv-social-shared__reaction" type="button" disabled={!feed.signedIn || pending}
              aria-pressed={post.myReaction?.choice === 'agree'}
              aria-label={`${t.agree}: ${post.reactions.agree}${post.myReaction?.choice === 'agree' ? `. ${t.removeReaction}` : ''}`}
              data-tooltip={t.agree} onClick={() => react(post, 'agree')}>
              <EngagementIcon kind="agree" /><strong aria-hidden="true">{post.reactions.agree}</strong></button>
            <button className="rv-social-shared__reaction" type="button" disabled={!feed.signedIn || pending}
              aria-pressed={post.myReaction?.choice === 'disagree'}
              aria-label={`${t.disagree}: ${post.reactions.disagree}${post.myReaction?.choice === 'disagree' ? `. ${t.removeReaction}` : ''}`}
              data-tooltip={t.disagree} onClick={() => react(post, 'disagree')}>
              <EngagementIcon kind="disagree" /><strong aria-hidden="true">{post.reactions.disagree}</strong></button>
            {feed.signedIn && <button type="button" disabled={pending} onClick={() => setReporting(reporting === post.id ? null : post.id)}>{t.report}</button>}
          </div>
          {!feed.signedIn && <p className="rv-social-shared__hint"><Link href={`/${locale}/profile`}>{t.signIn}</Link></p>}
          {reporting === post.id && <form className="rv-social-shared__report" onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const payload = { postId: post.id, reason: data.get('reason'), detail: data.get('detail') };
            run(post.id, 'report', payload, (operationKey) => reportSharedPostAction({ ...payload, operationKey }));
          }}>
            <label>{t.reportReason}<select name="reason" required defaultValue="abuse" disabled={pending}>
              {Object.entries(t.reasons).map(([reason, label]) => <option key={reason} value={reason}>{label}</option>)}
            </select></label>
            <label>{t.detail}<textarea name="detail" maxLength={500} rows={3} disabled={pending} /></label>
            <div><button type="submit" disabled={pending}>{pending ? t.working : t.sendReport}</button>
              <button type="button" onClick={() => setReporting(null)} disabled={pending}>{t.cancel}</button></div>
          </form>}
          {notice?.postId === post.id && <p role={notice.kind === 'error' ? 'alert' : 'status'} className="rv-social-shared__notice">
            {notice.kind === 'error' ? t.error : notice.kind === 'reported' ? t.reported : t.saved}</p>}
        </article>
      </li>)}</ol>}
  </section>;
}
