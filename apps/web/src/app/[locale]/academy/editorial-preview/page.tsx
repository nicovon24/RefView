import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { editorialLesson } from '@/features/academy/editorial-lesson';
import { AcademyBackLink } from '@/features/academy/AcademyBackLink';
import { academyLessonContentHashV1, academyLessonSourceV1 } from '@/features/academy/lesson-source-v1';
import '@/features/academy/editorial-preview.css';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const copy = editorialLesson.localized[locale];
  return { title: `${academyLessonSourceV1.localized[locale].title} | RefView`, description: copy.description, robots: { index: false, follow: false } };
}

export default async function EditorialPreviewPage({ params }: Props) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const copy = editorialLesson.localized[locale];
  const lesson = academyLessonSourceV1;
  const source = lesson.officialSources.filter((item) => item.language === locale);

  return <div className="rv-academy-draft">
    <a className="rv-academy-draft__skip" href="#lesson-title">{locale === 'es' ? 'Ir a la lección' : 'Skip to lesson'}</a>
    <header className="rv-academy-draft__header">
      <Link className="rv-academy-draft__brand" href={`/${locale}`}>RefView</Link>
      <nav aria-label={copy.language} className="rv-academy-draft__languages">
        <Link href="/es/academy/editorial-preview" lang="es" aria-current={locale === 'es' ? 'page' : undefined}>ES</Link>
        <span aria-hidden="true">/</span>
        <Link href="/en/academy/editorial-preview" lang="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link>
      </nav>
    </header>
    <main className="rv-academy-draft__main">
      <AcademyBackLink className="rv-academy-draft__back" href={`/${locale}`} label={copy.home} />
      <div className="rv-academy-draft__heading">
        <div>
          <h1 id="lesson-title" tabIndex={-1}>{lesson.localized[locale].title}</h1>
          <p className="rv-academy-draft__lead">{lesson.localized[locale].lead}</p>
        </div>
        <aside className="rv-academy-draft__status" aria-label={copy.draft}>
          <strong>{copy.draft}</strong>
          <span>{locale === 'es' ? 'Versión' : 'Version'} {lesson.version} · {editorialLesson.edition}</span>
          <span>{locale === 'es' ? 'Identidad exacta del borrador' : 'Exact draft identity'}</span>
          <code>{academyLessonContentHashV1}</code>
        </aside>
      </div>
      <p className="rv-academy-draft__notice">{copy.notice}</p>
      <div className="rv-academy-draft__columns">
        <article className="rv-academy-draft__lesson">
          <p className="rv-academy-draft__plain">{lesson.localized[locale].plainExplanation}</p>
          <section aria-labelledby="example-heading" className="rv-academy-draft__section">
            <h2 id="example-heading">{copy.exampleTitle}</h2>
            <div className="rv-academy-draft__evidence">
              <div><h3>{copy.factsTitle}</h3><p>{lesson.example.facts[locale]}</p></div>
              <div><h3>{copy.evidenceTitle}</h3><p>{lesson.example.evidence[locale]}</p></div>
              <div><h3>{copy.interpretationTitle}</h3><p>{lesson.example.interpretation[locale]}</p></div>
              <div><h3>{copy.applicationTitle}</h3><p>{lesson.example.ruleApplication[locale]}</p></div>
            </div>
          </section>
          <section aria-labelledby="technical-heading" className="rv-academy-draft__section">
            <h2 id="technical-heading">{copy.technicalTitle}</h2>
            <p>{lesson.localized[locale].technicalExplanation}</p>
          </section>
          <section aria-labelledby="followups-heading" className="rv-academy-draft__section">
            <h2 id="followups-heading">{copy.followUpsTitle}</h2>
            <div className="rv-academy-draft__followups">
              {lesson.preparedFollowUps.map((item) => <details key={item.followUpId}>
                <summary>{item.question[locale]}</summary>
                <p className="rv-academy-draft__prepared">{copy.prepared}</p>
                <p>{item.answer[locale]}</p>
              </details>)}
            </div>
          </section>
        </article>
        <aside className="rv-academy-draft__reference" aria-labelledby="reference-heading">
          <h2 id="reference-heading">{copy.referencesTitle}</h2>
          <p>{copy.sourceIntro}</p>
          <ul>{source.map((section) => <li key={section.sourceId}>{section.displayLabel}</li>)}</ul>
          <a href={source[0].documentUrl} target="_blank" rel="noopener noreferrer">{copy.openSource}</a>
          <p className="rv-academy-draft__digest">{copy.sourceNote} <code>{source[0].inspectedArtifactSha256}</code></p>
        </aside>
      </div>
    </main>
  </div>;
}
