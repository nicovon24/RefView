import type { AcademyLocale } from './catalog-ui-v1-data';
import { officialEditionPdfUrl } from './rules-directory-v1';
import type { LawDepth } from './law-depth-contract';

const labels = {
  es: { details: 'Entender la regla', onPage: 'En esta guía', source: 'Fuente IFAB 2026/27', page: 'páginas', note: 'Atención' },
  en: { details: 'Understand the Law', onPage: 'In this guide', source: 'IFAB 2026/27 source', page: 'pages', note: 'Note' },
} as const;

export function LawDetailSections({ locale, depth, title, idPrefix = 'law' }: {
  locale: AcademyLocale; depth: LawDepth; title?: string; idPrefix?: string;
}) {
  const t = labels[locale];
  const headingId = `${idPrefix}-depth-title`;
  return <section className="rv-law-depth" aria-labelledby={headingId}>
    <div className="rv-law-depth__heading">
      <h2 id={headingId}>{title ?? t.details}</h2>
      <nav aria-label={t.onPage} className="rv-law-depth__index">
        {depth.sections.map((section) => <a key={section.id} href={`#${idPrefix}-detail-${section.id}`}>{section.title[locale]}</a>)}
      </nav>
    </div>
    <div className="rv-law-depth__sections">{depth.sections.map((section) => <section key={section.id} id={`${idPrefix}-detail-${section.id}`} aria-labelledby={`${idPrefix}-detail-${section.id}-title`} className="rv-law-depth__section">
      <h3 id={`${idPrefix}-detail-${section.id}-title`}>{section.title[locale]}</h3>
      {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph[locale]}</p>)}
      {section.facts && <dl className="rv-law-depth__facts">{section.facts.map((fact) => <div key={fact.label.en}><dt>{fact.label[locale]}</dt><dd>{fact.value[locale]}</dd></div>)}</dl>}
      {section.steps && <ol className="rv-law-depth__steps">{section.steps.map((step) => <li key={step.label.en}><strong>{step.label[locale]}</strong><span>{step.body[locale]}</span></li>)}</ol>}
      {section.caution && <p className="rv-law-depth__caution"><strong>{t.note}:</strong> {section.caution[locale]}</p>}
      <p className="rv-law-depth__source"><span>{t.source} · {section.source.section[locale]} · {t.page} {section.source.pages[locale]}</span><a href={officialEditionPdfUrl(locale, section.source.startPage[locale])} target="_blank" rel="noopener noreferrer">{locale === 'es' ? 'Abrir sección oficial ↗' : 'Open official section ↗'}</a>{section.source.supplemental && <a href={officialEditionPdfUrl(locale, section.source.supplemental.startPage[locale])} target="_blank" rel="noopener noreferrer">{section.source.supplemental.label[locale]} ↗</a>}{section.source.onlineUpdate && <a href={section.source.onlineUpdate.url[locale]} target="_blank" rel="noopener noreferrer">{section.source.onlineUpdate.label[locale]} ↗</a>}</p>
    </section>)}</div>
  </section>;
}
