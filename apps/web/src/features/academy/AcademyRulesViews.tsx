import Link from 'next/link';
import { SiteHeader } from '@/components/site/SiteHeader';
import { AcademyBackLink } from './AcademyBackLink';
import type { AcademyLocale } from './catalog-ui-v1-data';
import { academyCopy } from './catalog-ui-v1-copy';
import { LawIcon } from './LawIcon';
import { LawIllustration } from './LawIllustration';
import { AcademyPhoto } from './AcademyPhoto';
import { LawDetailSections } from './LawDetailSections';
import { getLawGuide } from './law-guide-v1';
import { getLawDepth } from './law-depth-v1';
import { getTopicDepth } from './topic-depth-v1';
import { TopicIllustration } from './TopicIllustration';
import { laws202627, lawTopics202627, officialEditionPdfUrl, officialLawUrl, topicsForLaw, type LawEntry, type LawTopic } from './rules-directory-v1';

const copy = {
  es: {
    directory: 'Reglas de Juego 2026/27', directoryIntro: 'Recorré las 17 reglas con explicaciones, esquemas y referencias a la edición oficial. Entrá en cada regla para conocer sus condiciones, procedimientos y decisiones.',
    law: 'Regla', open: 'Explorar regla', topics: 'Temas de RefView',
    references: 'Referencias oficiales', online: 'Abrir esta regla en IFAB', onlineNote: 'La versión en línea puede cambiar de edición.',
    law4OnlineNote: 'La página en línea aún muestra una prohibición general de joyas; esta guía sigue el PDF oficial 2026/27, que admite accesorios no peligrosos cubiertos de forma segura.',
    pdf: 'Abrir las Reglas de Juego 2026/27 en PDF', pdfNote: 'Este PDF fija la edición 2026/27.',
    topicOpen: 'Explorar tema', back: 'Volver a las 17 reglas', backLaw: 'Volver a la Regla',
    pages: 'páginas',
    guide: 'La regla en juego', keyPoints: 'Puntos clave', illustration: 'Esquema original de RefView',
    jumpGuide: 'Leer la guía', jumpDetails: 'Entender la regla', jumpTopics: 'Ir a los temas', jumpReferences: 'Ver fuentes',
    previous: 'Regla anterior', next: 'Regla siguiente',
    topicGuide: 'Entender este tema', topicIndex: 'Otros temas', previousTopic: 'Tema anterior', nextTopic: 'Tema siguiente',
    technicalDiagram: 'Ver esquema técnico de la regla', technicalTopicDiagram: 'Ver esquema técnico del tema',
  },
  en: {
    directory: 'Laws of the Game 2026/27', directoryIntro: 'Explore all 17 Laws with explanations, diagrams and references to the official edition. Open each Law to learn its conditions, procedures and decisions.',
    law: 'Law', open: 'Explore Law', topics: 'RefView topics',
    references: 'Official references', online: 'Open this Law on IFAB', onlineNote: 'The online version may advance to a later edition.',
    law4OnlineNote: 'The online page still shows a blanket jewellery ban; this guide follows the official 2026/27 PDF, which allows non-dangerous accessories when safely covered.',
    pdf: 'Open the 2026/27 Laws of the Game PDF', pdfNote: 'This PDF pins the 2026/27 edition.',
    topicOpen: 'Explore topic', back: 'Back to all 17 Laws', backLaw: 'Back to Law',
    pages: 'pages',
    guide: 'The Law in play', keyPoints: 'Key points', illustration: 'Original RefView diagram',
    jumpGuide: 'Read the guide', jumpDetails: 'Understand the Law', jumpTopics: 'Go to topics', jumpReferences: 'View sources',
    previous: 'Previous Law', next: 'Next Law',
    topicGuide: 'Understand this topic', topicIndex: 'Other topics', previousTopic: 'Previous topic', nextTopic: 'Next topic',
    technicalDiagram: 'View the Law diagram', technicalTopicDiagram: 'View the topic diagram',
  },
} as const;

export function AcademyRulesDirectory({ locale }: { locale: AcademyLocale }) {
  const t = copy[locale];
  return <section className="rv-academy__section rv-academy__rules" aria-labelledby="rules-directory-title">
    <div className="rv-academy__section-title"><h2 id="rules-directory-title">{t.directory}</h2><span>IFAB 2026/27</span></div>
    <p className="rv-academy__rules-intro">{t.directoryIntro}</p>
    <ol className="rv-academy__rules-grid">{laws202627.map((law) => <li key={law.number}>
      <Link href={`/${locale}/academy/rules/${law.number}`} aria-label={`${t.open} ${t.law} ${law.number}: ${law.title[locale]}`}>
        <span className="rv-academy__rules-top"><span className="rv-academy__rules-number">{String(law.number).padStart(2, '0')}</span><LawIcon number={law.number} /></span>
        <span className="rv-academy__rules-name">{law.title[locale]}</span>
        <span className="rv-academy__rules-overview">{law.overview[locale]}</span>
        <span className="rv-academy__rules-action">{t.open} <span aria-hidden="true">↗</span></span>
      </Link>
    </li>)}</ol>
  </section>;
}

export function AcademyLawView({ locale, law }: {
  locale: AcademyLocale; law: LawEntry;
}) {
  const t = copy[locale];
  const topics = topicsForLaw(law.number);
  const guide = getLawGuide(law.number);
  const depth = getLawDepth(law.number);
  const previous = laws202627[law.number - 2];
  const next = laws202627[law.number];
  return <div className="rv-academy">
    <a className="rv-academy__skip" href="#law-title">{academyCopy[locale].skip}</a>
    <SiteHeader locale={locale} active="academy" languagePath={`/academy/rules/${law.number}`} />
    <main className="rv-academy__main rv-academy__main--lesson">
      <AcademyBackLink href={`/${locale}/academy#rules-directory-title`} label={t.back} />
      <header className="rv-academy__hero rv-academy__hero--lesson">
        <p className="rv-academy__meta">{t.law} {law.number} · IFAB 2026/27</p>
        <h1 id="law-title" tabIndex={-1}>{law.title[locale]}</h1>
        <p>{guide.introduction[locale]}</p>
        <nav className="rv-academy__law-jumps" aria-label={locale === 'es' ? 'En esta regla' : 'On this Law'}>
          <a href="#law-guide-title">{t.jumpGuide}</a>
          <a href="#law-depth-title">{t.jumpDetails}</a>
          {topics.length > 0 && <a href="#law-topics-title">{t.jumpTopics}</a>}
          <a href="#law-references-title">{t.jumpReferences}</a>
        </nav>
      </header>
      <div className="rv-academy__columns">
        <div className="rv-academy__law-body">
        <section className="rv-academy__section rv-academy__law-guide" aria-labelledby="law-guide-title">
          <h2 id="law-guide-title">{t.guide}</h2>
          <AcademyPhoto locale={locale} lawNumber={law.number} />
          <p className="rv-academy__law-explanation">{guide.explanation[locale]}</p>
          <h3>{t.keyPoints}</h3>
          <ul className="rv-academy__law-keypoints">{guide.keyPoints.map((point) => <li key={point.title.en}>
            <strong>{point.title[locale]}</strong><p>{point.body[locale]}</p>
          </li>)}</ul>
          <details className="rv-academy__technical">
            <summary>{t.technicalDiagram}</summary>
            <figure className="rv-academy__law-figure" tabIndex={0}>
              <LawIllustration number={law.number} locale={locale} />
              <figcaption>{t.illustration} · {guide.figureCaption[locale]}<span className="rv-academy__figure-scroll">{locale === 'es' ? ' · Deslizá para ver el esquema completo' : ' · Scroll to see the full diagram'}</span></figcaption>
            </figure>
          </details>
        </section>
        <LawDetailSections locale={locale} depth={depth} />
        {topics.length > 0 && <section className="rv-academy__section" aria-labelledby="law-topics-title">
          <h2 id="law-topics-title">{t.topics}</h2>
          <ul className="rv-academy__law-topics">{topics.map((topic) => <li key={topic.slug}>
                <h3>{topic.title[locale]}</h3><p>{topic.scope[locale]}</p>
                <Link href={`/${locale}/academy/rules/${law.number}/topics/${topic.slug}`}>{t.topicOpen} <span aria-hidden="true">↗</span></Link>
              </li>)}</ul>
        </section>}
        </div>
        <aside className="rv-academy__references" aria-labelledby="law-references-title">
          <h2 id="law-references-title">{t.references}</h2>
          <ul>
            <li><strong>IFAB · {t.law} {law.number}</strong><a href={officialLawUrl(law, locale)} target="_blank" rel="noopener noreferrer">{t.online} ↗</a><span>{law.number === 4 ? t.law4OnlineNote : t.onlineNote}</span></li>
            <li><strong>IFAB · 2026/27</strong><span>{guide.sourceSection[locale]} · {t.pages} {guide.sourcePages[locale]}</span><a href={officialEditionPdfUrl(locale, guide.sourceStartPage[locale])} target="_blank" rel="noopener noreferrer">{t.pdf} ↗</a><span>{t.pdfNote}</span></li>
          </ul>
        </aside>
      </div>
      <nav className="rv-academy__law-adjacent" aria-label={locale === 'es' ? 'Navegar por las reglas' : 'Navigate the Laws'}>
        {previous ? <Link href={`/${locale}/academy/rules/${previous.number}`}><span>{t.previous}</span><strong>← {t.law} {previous.number}: {previous.title[locale]}</strong></Link> : <span />}
        {next ? <Link href={`/${locale}/academy/rules/${next.number}`}><span>{t.next}</span><strong>{t.law} {next.number}: {next.title[locale]} →</strong></Link> : <span />}
      </nav>
    </main>
  </div>;
}

export function AcademyTopicView({ locale, law, topic }: {
  locale: AcademyLocale; law: LawEntry; topic: LawTopic;
}) {
  const t = copy[locale];
  const depth = getTopicDepth(topic.slug);
  const siblingTopics = topicsForLaw(law.number).filter((entry) => entry.slug !== topic.slug);
  const orderedTopics = [...lawTopics202627].sort((a, b) => a.primaryLaw - b.primaryLaw || a.slug.localeCompare(b.slug));
  const topicIndex = orderedTopics.findIndex((entry) => entry.slug === topic.slug);
  const previousTopic = orderedTopics[topicIndex - 1];
  const nextTopic = orderedTopics[topicIndex + 1];
  const topicHref = (entry: LawTopic) => `/${locale}/academy/rules/${entry.primaryLaw}/topics/${entry.slug}`;
  return <div className="rv-academy">
    <a className="rv-academy__skip" href="#topic-title">{academyCopy[locale].skip}</a>
    <SiteHeader locale={locale} active="academy" languagePath={`/academy/rules/${law.number}/topics/${topic.slug}`} />
    <main className="rv-academy__main rv-academy__main--lesson">
      <AcademyBackLink href={`/${locale}/academy/rules/${law.number}`} label={`${t.backLaw} ${law.number}`} />
      <header className="rv-academy__hero rv-academy__hero--lesson">
        <p className="rv-academy__meta">{t.law} {law.number} · IFAB 2026/27</p>
        <h1 id="topic-title" tabIndex={-1}>{topic.title[locale]}</h1>
        <p>{topic.scope[locale]}</p>
        <nav className="rv-academy__law-jumps" aria-label={locale === 'es' ? 'En este tema' : 'On this topic'}>
          <a href="#topic-depth-title">{t.jumpGuide}</a>
          <a href="#topic-references-title">{t.jumpReferences}</a>
        </nav>
      </header>
      <div className="rv-academy__columns">
        <div className="rv-academy__topic-body">
          <AcademyPhoto locale={locale} lawNumber={law.number} topicSlug={topic.slug} />
          <details className="rv-academy__technical rv-academy__technical--topic">
            <summary>{t.technicalTopicDiagram}</summary>
            <figure className="rv-academy__law-figure rv-academy__topic-figure" tabIndex={0}><TopicIllustration slug={topic.slug} locale={locale} /><figcaption>{t.illustration} · {topic.title[locale]}<span className="rv-academy__figure-scroll">{locale === 'es' ? ' · Deslizá para ver el esquema completo' : ' · Scroll to see the full diagram'}</span></figcaption></figure>
          </details>
          <LawDetailSections locale={locale} depth={depth} title={t.topicGuide} idPrefix="topic" />
          {siblingTopics.length > 0 && <section className="rv-academy__section" aria-labelledby="topic-siblings-title">
            <h2 id="topic-siblings-title">{t.topicIndex}</h2>
            <ul className="rv-academy__topic-siblings">{siblingTopics.map((entry) => <li key={entry.slug}><Link href={topicHref(entry)}>{entry.title[locale]} →</Link></li>)}</ul>
          </section>}
        </div>
        <aside className="rv-academy__references" aria-labelledby="topic-references-title">
          <h2 id="topic-references-title">{t.references}</h2>
          <ul>
            <li><strong>IFAB · {t.law} {law.number}</strong><a href={officialLawUrl(law, locale)} target="_blank" rel="noopener noreferrer">{t.online} ↗</a><span>{law.number === 4 ? t.law4OnlineNote : t.onlineNote}</span></li>
            <li><strong>IFAB · 2026/27</strong><span>{topic.sourceSection[locale]} · {t.pages} {topic.sourcePages[locale]}</span><a href={officialEditionPdfUrl(locale, Number.parseInt(topic.sourcePages[locale], 10))} target="_blank" rel="noopener noreferrer">{t.pdf} ↗</a><span>{t.pdfNote}</span></li>
          </ul>
        </aside>
      </div>
      <nav className="rv-academy__law-adjacent" aria-label={locale === 'es' ? 'Navegar por los temas' : 'Navigate topics'}>
        {previousTopic ? <Link href={topicHref(previousTopic)}><span>{t.previousTopic}</span><strong>← {previousTopic.title[locale]}</strong></Link> : <span />}
        {nextTopic ? <Link href={topicHref(nextTopic)}><span>{t.nextTopic}</span><strong>{nextTopic.title[locale]} →</strong></Link> : <span />}
      </nav>
    </main>
  </div>;
}
