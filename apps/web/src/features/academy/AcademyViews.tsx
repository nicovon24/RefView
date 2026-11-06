import type { ReactNode } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/site/SiteHeader';
import { AcademyBackLink } from './AcademyBackLink';
import type { AcademyLocale, CatalogLesson, PublicLesson } from './catalog-ui-v1-data';
import { academyCopy } from './catalog-ui-v1-copy';
import { AcademyRulesDirectory } from './AcademyRulesViews';

type Mode = 'published' | 'preview';

export function AcademyCatalogView({ locale, lessons, outcome, mode = 'published' }: {
  locale: AcademyLocale; lessons: readonly CatalogLesson[]; outcome: 'ready' | 'unavailable'; mode?: Mode;
}) {
  const t = academyCopy[locale];
  return <div className="rv-academy">
    <a className="rv-academy__skip" href="#academy-title">{t.skip}</a>
    <SiteHeader locale={locale} active="academy" languagePath="/academy" />
    <main className="rv-academy__main">
      <header className="rv-academy__hero">
        <h1 id="academy-title" tabIndex={-1}>{t.title}</h1>
        <p>{t.intro}</p>
      </header>
      {mode === 'published' && <AcademyRulesDirectory locale={locale} />}
      <section className="rv-academy__section" aria-labelledby="academy-browse">
        <div className="rv-academy__section-title"><h2 id="academy-browse">{t.browse}</h2><span>{t.edition}: IFAB 2026/27</span></div>
        {outcome === 'unavailable' ? <AcademyNotice
          title={locale === 'es' ? 'No podemos comprobar las lecciones ahora' : 'Lessons cannot be checked right now'}
          body={locale === 'es' ? 'El índice de las 17 reglas sigue disponible. Intentá consultar las lecciones publicadas más tarde.' : 'The 17-Law directory remains available. Try checking published lessons again later.'} />
          : lessons.length === 0 ? <AcademyNotice title={t.emptyTitle} body={t.empty} />
            : <div className="rv-academy__grid">{lessons.map((lesson) => <article className="rv-academy__card" key={`${lesson.lessonId}:${lesson.version}`}>
              <p className="rv-academy__meta">{t.challenge} · {t.edition}: {formatEdition(lesson.lawsEdition)}</p>
              <h3>{lesson.title}</h3><p>{lesson.lead}</p>
              <div className="rv-academy__card-footer"><span>{t.level}: {t[lesson.level as 'beginner' | 'intermediate' | 'advanced']} · {t.version} {lesson.version}</span>
                <Link href={mode === 'preview' ? `/${locale}/academy/interface-preview` : `/${locale}/academy/${lesson.lessonId}?version=${lesson.version}`}>{t.open} <span aria-hidden="true">↗</span></Link>
              </div>
            </article>)}</div>}
      </section>
    </main>
  </div>;
}

export function AcademyLessonView({ locale, lesson, mode, saveControl }: {
  locale: AcademyLocale; lesson: PublicLesson; mode: Mode; saveControl?: ReactNode;
}) {
  const t = academyCopy[locale];
  const preview = locale === 'es'
    ? { title: 'Vista de interfaz · sin publicar', notice: 'Esta lección aprobada se muestra solo para revisar la interfaz. No figura en el catálogo público y no se puede guardar ni practicar desde aquí.', practice: 'Esta vista no inicia una práctica ni guarda resultados. Los ejercicios relacionados aparecerán cuando estén publicados y sean compatibles.' }
    : { title: 'Interface preview · unpublished', notice: 'This approved lesson is shown only for interface review. It is not in the public catalog and cannot be saved or practiced here.', practice: 'This preview does not start practice or save results. Related exercises will appear when published and compatible.' };
  const languagePath = mode === 'preview' ? '/academy/interface-preview' : `/academy/${lesson.lessonId}?version=${lesson.version}`;
  return <div className="rv-academy">
    <a className="rv-academy__skip" href="#lesson-title">{t.skip}</a>
    <SiteHeader locale={locale} active="academy" languagePath={languagePath} />
    <main className="rv-academy__main rv-academy__main--lesson">
      <AcademyBackLink href={`/${locale}/academy`} label={t.back} />
      {mode === 'preview' && <div className="rv-academy__preview" role="note"><strong>{preview.title}</strong><p>{preview.notice}</p></div>}
      <header className="rv-academy__hero rv-academy__hero--lesson">
        <p className="rv-academy__meta">{t.challenge} · {t.edition}: {formatEdition(lesson.lawsEdition)} · {t.version} {lesson.version}</p>
        <h1 id="lesson-title" tabIndex={-1}>{lesson.title}</h1><p>{lesson.lead}</p>
        {saveControl}
      </header>
      <div className="rv-academy__columns"><article className="rv-academy__body">
        <p className="rv-academy__plain">{lesson.plainExplanation}</p>
        <section className="rv-academy__section" aria-labelledby="example-title"><h2 id="example-title">{t.example}</h2>
          <div className="rv-academy__evidence">
            <div><h3>{t.facts}</h3><p>{lesson.example.facts}</p></div>
            <div><h3>{t.evidence}</h3><p>{lesson.example.evidence}</p></div>
            <div><h3>{t.interpretation}</h3><p>{lesson.example.interpretation}</p></div>
            <div><h3>{t.application}</h3><p>{lesson.example.ruleApplication}</p></div>
          </div>
        </section>
        <section className="rv-academy__section" aria-labelledby="technical-title"><h2 id="technical-title">{t.technical}</h2><p>{lesson.technicalExplanation}</p></section>
        <section className="rv-academy__section" aria-labelledby="followups-title"><h2 id="followups-title">{t.followUps}</h2>
          <div className="rv-academy__followups">{lesson.followUps.map((item) => <details key={item.followUpId}>
            <summary>{item.question}</summary><p className="rv-academy__prepared">{t.prepared}</p><p>{item.answer}</p>
            <p className="rv-academy__citation">{item.sourceLabels.join(' · ')}</p>
          </details>)}</div>
        </section>
        <section className="rv-academy__section" aria-labelledby="practice-title"><h2 id="practice-title">{t.practice}</h2>
          {mode === 'published' && lesson.practice.length ? <ul className="rv-academy__practice">{lesson.practice.map((item) =>
            <li key={`${item.itemId}:${item.version}`}><span>{item.title}</span>
              <Link href={`/${locale}/assessments#assessment-${item.itemId}-v${item.version}`}>{t.practiceOpen}</Link>
            </li>)}</ul> : <p>{mode === 'preview' ? preview.practice : t.practiceUnavailable}</p>}
        </section>
      </article><aside className="rv-academy__references" aria-labelledby="sources-title"><h2 id="sources-title">{t.sources}</h2>
        <ul>{lesson.sources.map((source) => <li key={source.sourceId}><strong>{source.displayLabel}</strong><span>{source.publisher} · {t.edition}: {formatEdition(lesson.lawsEdition)}</span><a href={source.documentUrl} target="_blank" rel="noopener noreferrer">{t.sourceLink} ↗</a></li>)}</ul>
      </aside></div>
    </main>
  </div>;
}

export function AcademyNotice({ title, body }: { title: string; body: string }) {
  return <div className="rv-academy__state" role="status"><h3>{title}</h3><p>{body}</p></div>;
}

function formatEdition(value: string) { return value.replace('IFAB-', 'IFAB ').replace('-', '/'); }
