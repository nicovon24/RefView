'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition, type FormEvent } from 'react';
import type { Locale } from '@/lib/i18n/locale';
import { createSocialContributor, createSocialMatch, createSocialPost, issueSocialOperation } from './social-private-actions';
import { removeSharedMatchAction, removeSharedPostAction } from './social-shared-actions';
import './social-private-workspace.css';

export type SocialPrivateWorkspaceReady = {
  kind: 'ready';
  mode: 'private' | 'local_shared';
  profile: { id: string; displayName: string } | null;
  matches: Array<{
    id: string; homeTeam: string; awayTeam: string; competition: string | null;
    matchDate: string; state: string; createdAt: string; revision?: number;
  }>;
  posts: Array<{
    id: string; matchId: string; opinion: string; period: string | null;
    minute: number | null; state: string; createdAt: string; revision?: number;
  }>;
  availableMatches: Array<{
    id: string; homeTeam: string; awayTeam: string; competition: string | null;
    matchDate: string; state: string; publishedAt: string | null;
  }>;
};

type Operation = 'profile' | 'match' | 'post';
type Notice = { operation: Operation; kind: 'success' | 'error'; published: boolean } | null;

const copy = {
  es: {
    back: 'Volver a Comunidad', eyebrow: 'Mis publicaciones', title: 'Tus conversaciones',
    intro: 'Prepará un partido y tu opinión sobre una jugada. Consultá el estado de cada aporte.',
    privateBoundary: 'El modo compartido todavía no está habilitado. Los nuevos aportes quedan pendientes y privados.',
    sharedBoundary: 'Los nuevos partidos completos y las jugadas en partidos visibles se publican de inmediato para todas las personas que visiten esta app local. Los aportes anteriores pendientes siguen privados.',
    profileTitle: 'Tu nombre en Comunidad', profileIntro: 'Elegí cómo querés identificarte en tus futuras conversaciones.',
    displayName: 'Nombre visible', displayNameHint: 'Entre 2 y 40 caracteres.', saveProfile: 'Guardar nombre',
    profileReady: 'Nombre guardado', matchTitle: 'Preparar un partido',
    matchIntro: 'El partido organiza las jugadas. Cargá equipos distintos y una fecha.',
    homeTeam: 'Equipo local', awayTeam: 'Equipo visitante', competition: 'Competición (opcional)',
    matchDate: 'Fecha del partido', saveMatch: 'Guardar partido privado', publishMatch: 'Publicar partido',
    postTitle: 'Escribir sobre una jugada', postIntro: 'Seleccioná un partido y explicá qué viste y cómo interpretás la decisión arbitral.',
    sharedPostIntro: 'Seleccioná un partido visible, propio o de otra persona, para publicar tu opinión de inmediato.',
    selectMatch: 'Partido', selectPlaceholder: 'Elegí un partido', opinion: 'Tu opinión',
    selectMatchLimit: 'Los partidos compartidos de otras personas aparecen aquí para escribir una jugada; no figuran en la lista de tus partidos.',
    selectMatchLimitPrivate: 'Elegí uno de tus partidos pendientes. Solo vos podés ver esta jugada por ahora.',
    opinionHint: 'Entre 20 y 3000 caracteres. Escribí tu propia interpretación; no se califica como una decisión oficial.',
    period: 'Período (opcional)', periodNone: 'Sin especificar', first: 'Primer tiempo', second: 'Segundo tiempo',
    extraFirst: 'Primer tiempo extra', extraSecond: 'Segundo tiempo extra', shootout: 'Tanda de penales',
    minute: 'Minuto (opcional)', savePost: 'Guardar jugada privada', publishPost: 'Publicar jugada',
    needProfile: 'Guardá tu nombre para preparar partidos y jugadas.', needMatch: 'Prepará un partido para escribir sobre una jugada.',
    needVisibleMatch: 'Publicá un partido para escribir una jugada visible.',
    yourMatches: 'Tus partidos', yourPosts: 'Tus jugadas', recordsLimit: 'Se muestran hasta 50 registros recientes de cada tipo.', noMatches: 'Todavía no preparaste partidos.',
    noPosts: 'Todavía no escribiste sobre una jugada.', pending: 'Pendiente · privado', visible: 'Publicado · visible',
    hidden: 'Oculto', removed: 'Retirado',
    profileSaved: 'Nombre guardado.', matchSaved: 'Partido guardado. Revisá su estado en tu lista.',
    postSaved: 'Jugada guardada. Revisá su estado en tu lista.', matchPublished: 'Partido disponible.', postPublished: 'Jugada publicada.',
    saveError: 'No se pudo guardar. Revisá los datos y volvé a intentarlo.',
    working: 'Guardando…', removePost: 'Retirar jugada', removeMatch: 'Retirar partido',
    removeMatchConfirm: 'Retirar este partido también retirará todas sus jugadas y reacciones, incluso las de otras personas. ¿Continuar?',
    removeError: 'No se pudo retirar el aporte. Actualizá la página e intentá de nuevo.', removeDone: 'Aporte retirado.',
  },
  en: {
    back: 'Back to Community', eyebrow: 'My posts', title: 'Your conversations',
    intro: 'Prepare a match and your opinion about a play. Check each entry’s status.',
    privateBoundary: 'Shared mode is not enabled yet. New entries remain pending and private.',
    sharedBoundary: 'New complete matches and plays on visible matches publish immediately for everyone visiting this local app. Earlier pending entries remain private.',
    profileTitle: 'Your Community name', profileIntro: 'Choose how you want to identify yourself in future conversations.',
    displayName: 'Display name', displayNameHint: 'Between 2 and 40 characters.', saveProfile: 'Save name',
    profileReady: 'Saved name', matchTitle: 'Prepare a match',
    matchIntro: 'The match groups plays. Enter two different teams and a date.',
    homeTeam: 'Home team', awayTeam: 'Away team', competition: 'Competition (optional)',
    matchDate: 'Match date', saveMatch: 'Save private match', publishMatch: 'Publish match',
    postTitle: 'Write about a play', postIntro: 'Select a match and explain what you saw and how you interpret the referee decision.',
    sharedPostIntro: 'Select a visible match, yours or another person’s, to publish your opinion immediately.',
    selectMatch: 'Match', selectPlaceholder: 'Choose a match', opinion: 'Your opinion',
    selectMatchLimit: 'Other people’s shared matches appear here for posting a play; they do not appear in your owned matches list.',
    selectMatchLimitPrivate: 'Choose one of your pending matches. Only you can see this play for now.',
    opinionHint: 'Between 20 and 3000 characters. Write your own interpretation; it is not scored as an official decision.',
    period: 'Period (optional)', periodNone: 'Unspecified', first: 'First half', second: 'Second half',
    extraFirst: 'First half of extra time', extraSecond: 'Second half of extra time', shootout: 'Penalty shootout',
    minute: 'Minute (optional)', savePost: 'Save private play', publishPost: 'Publish play',
    needProfile: 'Save your name before preparing matches and plays.', needMatch: 'Prepare a match before writing about a play.',
    needVisibleMatch: 'Publish a match to write a visible play.',
    yourMatches: 'Your matches', yourPosts: 'Your plays', recordsLimit: 'Up to 50 recent records of each type are shown.', noMatches: 'You have not prepared any matches yet.',
    noPosts: 'You have not written about a play yet.', pending: 'Pending · private', visible: 'Published · visible',
    hidden: 'Hidden', removed: 'Removed',
    profileSaved: 'Name saved.', matchSaved: 'Match saved. Check its status in your list.',
    postSaved: 'Play saved. Check its status in your list.', matchPublished: 'Match ready.', postPublished: 'Play published.',
    saveError: 'Could not save. Check the details and try again.',
    working: 'Saving…', removePost: 'Remove play', removeMatch: 'Remove match',
    removeMatchConfirm: 'Removing this match will also remove all its plays and reactions, including other people’s contributions. Continue?',
    removeError: 'Could not remove the entry. Refresh the page and try again.', removeDone: 'Entry removed.',
  },
} as const;

const periodKeys = ['first', 'second', 'extra_first', 'extra_second', 'shootout'] as const;

function formValue(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export function SocialPrivateWorkspace({ locale, workspace }: {
  locale: Locale; workspace: SocialPrivateWorkspaceReady;
}) {
  const t = copy[locale];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice>(null);
  const [removeNotice, setRemoveNotice] = useState<'done' | 'error' | null>(null);
  const retryKeys = useRef<Partial<Record<Operation, { payload: string; key: string }>>>({});
  const matchById = new Map([...workspace.matches, ...workspace.availableMatches]
    .map((match) => [match.id, match] as const));
  const availableMatches = workspace.availableMatches.filter((match) =>
    workspace.mode === 'local_shared' ? match.state === 'visible' : match.state === 'pending');
  const stateLabel = (state: string) => state === 'visible' ? t.visible
    : state === 'hidden' ? t.hidden : state === 'removed' ? t.removed : t.pending;

  function run(operation: Operation, payload: object, action: (key: string) => Promise<unknown>, published = false) {
    setNotice(null);
    startTransition(async () => {
      const fingerprint = JSON.stringify(payload);
      try {
        let retry = retryKeys.current[operation];
        if (!retry || retry.payload !== fingerprint) {
          const issued = await issueSocialOperation({ operation });
          retry = { payload: fingerprint, key: issued.operationKey };
          retryKeys.current[operation] = retry;
        }
        await action(retry.key);
        delete retryKeys.current[operation];
        setNotice({ operation, kind: 'success', published });
        router.refresh();
      } catch {
        setNotice({ operation, kind: 'error', published: false });
      }
    });
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = { displayName: formValue(data, 'displayName') };
    run('profile', payload, (operationKey) => createSocialContributor({ ...payload, operationKey }));
  }

  function submitMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload = {
      homeTeam: formValue(data, 'homeTeam'), awayTeam: formValue(data, 'awayTeam'),
      competition: formValue(data, 'competition') || undefined, matchDate: formValue(data, 'matchDate'),
    };
    run('match', payload, (operationKey) => createSocialMatch({ ...payload, operationKey }), workspace.mode === 'local_shared');
  }

  function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const minute = formValue(data, 'minute');
    const payload = {
      matchId: formValue(data, 'matchId'), opinion: formValue(data, 'opinion'),
      period: formValue(data, 'period') || undefined, minute: minute ? Number(minute) : undefined,
    };
    const selectedMatch = availableMatches.find((match) => match.id === payload.matchId);
    run('post', payload, (operationKey) => createSocialPost({ ...payload, operationKey }),
      workspace.mode === 'local_shared' && selectedMatch?.state === 'visible');
  }

  function removePost(postId: string, expectedRevision: number) {
    setRemoveNotice(null);
    startTransition(async () => {
      try {
        await removeSharedPostAction({ postId, expectedRevision });
        setRemoveNotice('done');
        router.refresh();
      } catch {
        setRemoveNotice('error');
      }
    });
  }

  function removeMatch(matchId: string, expectedRevision: number) {
    if (!window.confirm(t.removeMatchConfirm)) return;
    setRemoveNotice(null);
    startTransition(async () => {
      try {
        await removeSharedMatchAction({ matchId, expectedRevision });
        setRemoveNotice('done');
        router.refresh();
      } catch {
        setRemoveNotice('error');
      }
    });
  }

  function feedback(operation: Operation) {
    if (notice?.operation !== operation) return null;
    const message = notice.kind === 'error' ? t.saveError
      : operation === 'profile' ? t.profileSaved
        : operation === 'match' ? (notice.published ? t.matchPublished : t.matchSaved)
          : (notice.published ? t.postPublished : t.postSaved);
    return <p className="rv-social-private__feedback" role={notice.kind === 'error' ? 'alert' : 'status'}>{message}</p>;
  }

  return <main className="rv-social-private" id="social-private-main">
    <div className="rv-social-private__inner">
      <Link className="rv-social-private__back" href={`/${locale}/community`}>{t.back}</Link>
      <header className="rv-social-private__hero">
        <span className="rv-social-private__eyebrow">{t.eyebrow}</span>
        <h1 id="private-social-title">{t.title}</h1>
        <p>{t.intro}</p>
        <p className="rv-social-private__boundary">{workspace.mode === 'local_shared' ? t.sharedBoundary : t.privateBoundary}</p>
      </header>

      <div className="rv-social-private__grid">
        <div className="rv-social-private__forms">
          <section className="rv-social-private__section" aria-labelledby="social-private-profile">
            <h2 id="social-private-profile">01 · {t.profileTitle}</h2>
            <p>{t.profileIntro}</p>
            {workspace.profile ? <p className="rv-social-private__saved-name"><span>{t.profileReady}</span><strong>{workspace.profile.displayName}</strong></p>
              : <form onSubmit={submitProfile} onChange={() => { delete retryKeys.current.profile; }}>
                <label htmlFor="social-display-name">{t.displayName}</label>
                <input id="social-display-name" name="displayName" type="text" autoComplete="nickname" required minLength={2} maxLength={40} disabled={pending} aria-describedby="social-display-hint" />
                <small id="social-display-hint">{t.displayNameHint}</small>
                <button type="submit" disabled={pending}>{pending ? t.working : t.saveProfile}</button>
              </form>}
            {feedback('profile')}
          </section>

          <section className="rv-social-private__section" aria-labelledby="social-private-match">
            <h2 id="social-private-match">02 · {t.matchTitle}</h2>
            <p>{t.matchIntro}</p>
            {workspace.profile ? <form onSubmit={submitMatch} onChange={() => { delete retryKeys.current.match; }}>
              <div className="rv-social-private__field-row">
                <div><label htmlFor="social-home-team">{t.homeTeam}</label><input id="social-home-team" name="homeTeam" required minLength={2} maxLength={80} disabled={pending} /></div>
                <div><label htmlFor="social-away-team">{t.awayTeam}</label><input id="social-away-team" name="awayTeam" required minLength={2} maxLength={80} disabled={pending} /></div>
              </div>
              <div className="rv-social-private__field-row">
                <div><label htmlFor="social-competition">{t.competition}</label><input id="social-competition" name="competition" minLength={2} maxLength={80} disabled={pending} /></div>
                <div><label htmlFor="social-match-date">{t.matchDate}</label><input id="social-match-date" name="matchDate" type="date" required disabled={pending} /></div>
              </div>
              <button type="submit" disabled={pending}>{pending ? t.working : workspace.mode === 'local_shared' ? t.publishMatch : t.saveMatch}</button>
            </form> : <p className="rv-social-private__prerequisite">{t.needProfile}</p>}
            {feedback('match')}
          </section>

          <section className="rv-social-private__section" aria-labelledby="social-private-post">
            <h2 id="social-private-post">03 · {t.postTitle}</h2>
            <p>{workspace.mode === 'local_shared' ? t.sharedPostIntro : t.postIntro}</p>
            {workspace.profile && availableMatches.length > 0 ? <form onSubmit={submitPost} onChange={() => { delete retryKeys.current.post; }}>
              <label htmlFor="social-post-match">{t.selectMatch}</label>
              <select id="social-post-match" name="matchId" required defaultValue="" disabled={pending} aria-describedby="social-post-match-hint">
                <option value="" disabled>{t.selectPlaceholder}</option>
                {availableMatches.map((match) => <option value={match.id} key={match.id}>{match.homeTeam} – {match.awayTeam} · {match.matchDate}</option>)}
              </select>
              <small id="social-post-match-hint">{workspace.mode === 'local_shared' ? t.selectMatchLimit : t.selectMatchLimitPrivate}</small>
              <div className="rv-social-private__field-row">
                <div><label htmlFor="social-post-period">{t.period}</label><select id="social-post-period" name="period" disabled={pending} defaultValue="">
                  <option value="">{t.periodNone}</option>
                  {periodKeys.map((period) => <option value={period} key={period}>{period === 'extra_first' ? t.extraFirst : period === 'extra_second' ? t.extraSecond : t[period]}</option>)}
                </select></div>
                <div><label htmlFor="social-post-minute">{t.minute}</label><input id="social-post-minute" name="minute" type="number" min={0} max={130} step={1} disabled={pending} /></div>
              </div>
              <label htmlFor="social-post-opinion">{t.opinion}</label>
              <textarea id="social-post-opinion" name="opinion" required minLength={20} maxLength={3000} rows={7} disabled={pending} aria-describedby="social-opinion-hint" />
              <small id="social-opinion-hint">{t.opinionHint}</small>
              <button type="submit" disabled={pending}>{pending ? t.working
                : workspace.mode === 'local_shared' ? t.publishPost : t.savePost}</button>
            </form> : <p className="rv-social-private__prerequisite">{workspace.profile
              ? (workspace.mode === 'local_shared' ? t.needVisibleMatch : t.needMatch) : t.needProfile}</p>}
            {feedback('post')}
          </section>
        </div>

        <aside className="rv-social-private__records" aria-label={locale === 'es' ? 'Tus aportes' : 'Your contributions'}>
          <p className="rv-social-private__records-limit">{t.recordsLimit}</p>
          <section aria-labelledby="social-private-matches"><h2 id="social-private-matches">{t.yourMatches}</h2>
            {workspace.matches.length ? <ol>{workspace.matches.map((match) => <li key={match.id}>
              <strong>{match.homeTeam} – {match.awayTeam}</strong><span>{match.competition ? `${match.competition} · ` : ''}{match.matchDate}</span><em>{stateLabel(match.state)}</em>
              {match.state !== 'removed' && typeof match.revision === 'number' && <button type="button" disabled={pending}
                onClick={() => removeMatch(match.id, match.revision!)}>{t.removeMatch}</button>}
            </li>)}</ol> : <p>{t.noMatches}</p>}
          </section>
          <section aria-labelledby="social-private-posts"><h2 id="social-private-posts">{t.yourPosts}</h2>
            {workspace.posts.length ? <ol>{workspace.posts.map((post) => {
              const match = matchById.get(post.matchId);
              return <li key={post.id}>
                {match && <span>{match.homeTeam} – {match.awayTeam}</span>}
                <p>{post.opinion}</p><em>{stateLabel(post.state)}</em>
                {post.state !== 'removed' && typeof post.revision === 'number' && <button type="button" disabled={pending}
                  onClick={() => removePost(post.id, post.revision!)}>{t.removePost}</button>}
              </li>;
            })}</ol> : <p>{t.noPosts}</p>}
            {removeNotice && <p role={removeNotice === 'error' ? 'alert' : 'status'}>{removeNotice === 'error' ? t.removeError : t.removeDone}</p>}
          </section>
        </aside>
      </div>
    </div>
  </main>;
}
