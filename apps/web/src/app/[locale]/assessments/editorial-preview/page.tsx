import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { assessmentDraftsV1, type AssessmentSourceV1 } from '@/features/assessments/source-v1';
import { AssessmentCatalog, AssessmentQuestion, AssessmentCorrection } from '@/features/assessments/assessment-views';
import { projectAssessmentActiveAttemptV1, projectAssessmentCatalogItemV1 } from '@/features/assessments/public-dto-v1';
import { assessmentCopy } from '@/features/assessments/route-ui-v1-copy';
import { openApplicationDatabase, validateApplicationRuntime } from '@/lib/db/application-runtime';
import '@/features/assessments/editorial-preview-v1.css';
import '@/features/assessments/route-ui-v1.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

type Locale = 'es' | 'en';
type Props = { params: Promise<{ locale: string }>; searchParams?: Promise<{ interface?: string; item?: string }> };

async function requireLocalUnreviewedDrafts() {
  if (process.env.NODE_ENV === 'production') notFound();
  let configuredOrigin: URL;
  try {
    configuredOrigin = new URL(validateApplicationRuntime(process.env).origin);
  } catch {
    notFound();
  }
  const requestHeaders = await headers();
  if (configuredOrigin.protocol !== 'http:' || !configuredOrigin.port ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(configuredOrigin.hostname) ||
    requestHeaders.get('host') !== configuredOrigin.host ||
    (requestHeaders.has('origin') && requestHeaders.get('origin') !== configuredOrigin.origin)) notFound();

  const database = openApplicationDatabase();
  const candidates = assessmentDraftsV1.map(({ source }) => ({ itemId: source.itemId, itemVersion: source.version }));
  const [rows, reviews] = await database.$transaction([
    database.assessmentPublication.findMany({
      where: { OR: candidates },
      select: { itemId: true, itemVersion: true, contentHash: true, state: true, revision: true,
        reviewId: true, reviewedAt: true, retiredAt: true,
        source: { select: { rubricHash: true } }, events: { select: { eventId: true } } },
    }),
    database.assessmentReviewRecord.findMany({
      where: { OR: candidates }, select: { reviewId: true },
    }),
  ], { isolationLevel: 'Serializable' }).catch(() => notFound());
  if (reviews.length || rows.some((row) => {
    const draft = assessmentDraftsV1.find(({ source }) => source.itemId === row.itemId && source.version === row.itemVersion);
    return !draft || row.contentHash !== draft.contentHash || row.source.rubricHash !== draft.rubricHash ||
      row.state !== 'draft' || row.revision !== 0 || row.reviewId !== null || row.reviewedAt !== null ||
      row.retiredAt !== null || row.events.length !== 0;
  })) notFound();
}

const copy = {
  es: {
    title: 'Revisión editorial de evaluaciones', intro: 'Tres candidatos exactos para revisar. Son borradores inéditos: las respuestas y correcciones se muestran aquí solo para revisión editorial.',
    draft: 'BORRADOR · NO PUBLICADO', scope: 'Acceso directo para revisión · sin intento ni puntuación',
    item: 'Identidad del ítem', rubric: 'Identidad de la rúbrica', version: 'Versión', type: 'Tipo', level: 'Nivel',
    question: 'Consigna', facts: 'Hechos y evidencia presentados', options: 'Opciones propuestas', answer: 'Respuestas aceptadas propuestas',
    alternatives: 'Alternativas aceptadas', alternativesNote: 'Solo las respuestas enumeradas; ninguna alternativa adicional está codificada en este borrador.',
    reasoning: 'Criterios para autoevaluar la explicación', unscored: 'Explicación requerida, guardada y sin puntuación automática.', unscoredLabel: 'sin puntuación',
    correction: 'Corrección propuesta', evidence: 'Evidencia vinculada a la corrección', references: 'Fuentes oficiales y procedencia',
    sourceDigest: 'SHA-256 del PDF inspeccionado', inspected: 'Inspeccionado', recommendation: 'Práctica siguiente propuesta',
    noRecommendation: 'No hay práctica siguiente propuesta.', edition: 'Edición de reglas',
    stop: 'Detener juego', restart: 'Reanudación', discipline: 'Disciplina', offender: 'Infractor',
    yes: 'sí', no: 'no', none: 'ninguna', yellow: 'amarilla', red: 'roja', penaltyKick: 'penalti',
    directFreeKick: 'tiro libre directo', indirectFreeKick: 'tiro libre indirecto', droppedBall: 'balón a tierra', playOn: 'seguir jugando',
    beginner: 'Inicial', intermediate: 'Intermedio', advanced: 'Avanzado',
    ruleQuestion: 'Pregunta de regla', restartDiscipline: 'Reanudación y disciplina', authoredIncidentAnalysis: 'Análisis de incidente escrito',
  },
  en: {
    title: 'Assessment editorial review', intro: 'Three exact candidates for review. These are unpublished drafts: answers and corrections appear here only for editorial review.',
    draft: 'DRAFT · UNPUBLISHED', scope: 'Direct access for review · no attempt or scoring',
    item: 'Item identity', rubric: 'Rubric identity', version: 'Version', type: 'Type', level: 'Level',
    question: 'Prompt', facts: 'Presented facts and evidence', options: 'Proposed options', answer: 'Proposed accepted answers',
    alternatives: 'Accepted alternatives', alternativesNote: 'Only the listed answers; no additional alternative is encoded in this draft.',
    reasoning: 'Explanation self-review dimensions', unscored: 'Explanation required, saved, and not automatically scored.', unscoredLabel: 'unscored',
    correction: 'Proposed correction', evidence: 'Evidence linked to the correction', references: 'Official sources and provenance',
    sourceDigest: 'Inspected PDF SHA-256', inspected: 'Inspected', recommendation: 'Proposed next practice',
    noRecommendation: 'No next practice proposed.', edition: 'Rules edition',
    stop: 'Stop play', restart: 'Restart', discipline: 'Discipline', offender: 'Offender',
    yes: 'yes', no: 'no', none: 'none', yellow: 'yellow card', red: 'red card', penaltyKick: 'penalty kick',
    directFreeKick: 'direct free kick', indirectFreeKick: 'indirect free kick', droppedBall: 'dropped ball', playOn: 'play on',
    beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced',
    ruleQuestion: 'Rule question', restartDiscipline: 'Restart and discipline', authoredIncidentAnalysis: 'Written incident analysis',
  },
} as const;

function AcceptedAnswer({ answer, locale }: {
  answer: AssessmentSourceV1['privateRubric']['acceptedAnswers'][number]; locale: Locale;
}) {
  const t = copy[locale];
  if (answer.kind === 'ruleQuestion') return <code translate="no">{answer.optionId}</code>;
  return <span>{t.stop}: {answer.stopPlay ? t.yes : t.no} · {t.restart}: {t[answer.restart]} · {t.discipline}: {t[answer.discipline]} · {t.offender}: <code translate="no">{answer.offenderHandle ?? 'null'}</code></span>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return { title: `${copy[locale].title} | RefView`, description: copy[locale].intro,
    robots: { index: false, follow: false, nocache: true } };
}

export default async function EditorialPreviewPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  await requireLocalUnreviewedDrafts();
  const query = await searchParams;
  if (query?.interface) {
    if (!['catalog', 'question', 'correction'].includes(query.interface)) notFound();
    const ui = assessmentCopy[locale];
    const base = `/${locale}/assessments/editorial-preview`;
    const draft = assessmentDraftsV1.find(({ source }) => source.itemId === query.item);
    if (query.interface !== 'catalog' && !draft) notFound();
    const catalog = assessmentDraftsV1.map((candidate) => projectAssessmentCatalogItemV1(candidate, locale));
    const current = draft!;
    const suggested = query.interface === 'correction' ? assessmentDraftsV1.find(({ source }) =>
      current.source.recommendationRefs.some((reference) => reference.targetItemId === source.itemId && reference.targetVersion === source.version)) : undefined;
    const question = query.interface === 'question' ? projectAssessmentActiveAttemptV1(current, 'interface-preview', locale) : null;
    const source = query.interface === 'correction' ? current.source : null;
    const correction = source ? {
      summary: source.correction.summary[locale], explanation: source.correction.explanation[locale],
      evidence: source.publicEvidence.filter((entry) => source.correction.evidenceIds.includes(entry.evidenceId)).map((entry) => ({ evidenceId: entry.evidenceId, text: entry.text[locale] })),
      sources: source.officialSources.filter((entry) => source.correction.sourceIds[locale].includes(entry.sourceId)).map((entry) => ({
        sourceId: entry.sourceId, publisher: entry.publisher, edition: entry.edition, documentUrl: entry.documentUrl,
        lawNumber: entry.lawNumber, sectionCode: entry.sectionCode, displayLabel: entry.displayLabel, printedPage: entry.printedPage,
      })),
    } : null;
    return <div className="rv-assessment rv-assessment--preview"><a className="rv-assessment__skip" href="#assessment-title">{locale === 'es' ? 'Ir al contenido' : 'Skip to content'}</a>
      <main className="rv-assessment__main"><nav className="rv-assessment__preview-nav"><Link href={`${base}?interface=catalog`}>{ui.previewCatalog}</Link><span><Link href={`/es/assessments/editorial-preview?interface=${query.interface}${query.item ? `&item=${query.item}` : ''}`} lang="es">ES</Link> / <Link href={`/en/assessments/editorial-preview?interface=${query.interface}${query.item ? `&item=${query.item}` : ''}`} lang="en">EN</Link></span></nav>
        <p className="rv-assessment__preview-banner">{ui.previewBanner}</p><header className="rv-assessment__hero"><h1 id="assessment-title">{query.interface === 'catalog' ? ui.previewCatalog : current.source.localized[locale].title}</h1><p>{query.interface === 'catalog' ? ui.previewIntro : query.interface === 'question' ? ui.previewQuestionIntro : ui.previewCorrectionIntro}</p></header>
        {query.interface === 'catalog' && <section className="rv-assessment__section"><h2>{ui.browse}</h2><AssessmentCatalog locale={locale} items={catalog} previewHref={(item) => `${base}?interface=question&item=${item.itemId}`} /></section>}
        {question && <section className="rv-assessment__section"><AssessmentQuestion locale={locale} attempt={question} preview correctionHref={`${base}?interface=correction&item=${current.source.itemId}`} /></section>}
        {correction && <section className="rv-assessment__section"><p className="rv-assessment__note">{ui.previewCorrectionNote}</p><AssessmentCorrection locale={locale} correction={correction} nextTitle={ui.previewNextTitle} next={<nav className="rv-assessment__preview-next" aria-label={ui.previewNextTitle}>
          {suggested && <Link className="rv-assessment__button" href={`${base}?interface=question&item=${suggested.source.itemId}`}>{ui.previewNext}: {suggested.source.localized[locale].title}</Link>}
          <Link href={`${base}?interface=catalog`}>{ui.previewBackToCatalog}</Link>
        </nav>} /></section>}
      </main></div>;
  }
  const t = copy[locale];
  return <div className="rv-assessment-editorial">
    <a className="rv-assessment-editorial__skip" href="#editorial-title">{locale === 'es' ? 'Ir al contenido' : 'Skip to content'}</a>
    <main className="rv-assessment-editorial__main">
      <header className="rv-assessment-editorial__header">
        <Link href={`/${locale}`}>RefView</Link>
        <nav aria-label={locale === 'es' ? 'Idioma de la interfaz' : 'Interface language'}>
          <Link href="/es/assessments/editorial-preview" lang="es" aria-current={locale === 'es' ? 'page' : undefined}>ES</Link>
          <span aria-hidden="true">/</span>
          <Link href="/en/assessments/editorial-preview" lang="en" aria-current={locale === 'en' ? 'page' : undefined}>EN</Link>
        </nav>
      </header>
      <div className="rv-assessment-editorial__hero">
        <p className="rv-assessment-editorial__eyebrow">{t.draft}</p>
        <h1 id="editorial-title">{t.title}</h1>
        <p>{t.intro}</p><p className="rv-assessment-editorial__scope">{t.scope}</p>
      </div>
      <nav className="rv-assessment-editorial__index" aria-label={locale === 'es' ? 'Ítems' : 'Items'}>
        {assessmentDraftsV1.map(({ source }, index) => <a key={source.itemId} href={`#item-${source.itemId}`}>{String(index + 1).padStart(2, '0')} · {source.localized[locale].title}</a>)}
      </nav>
      {assessmentDraftsV1.map(({ source, contentHash, rubricHash }, index) => <article className="rv-assessment-editorial__item" id={`item-${source.itemId}`} key={source.itemId}>
        <div className="rv-assessment-editorial__item-head">
          <div><p className="rv-assessment-editorial__eyebrow">{t.draft} · {String(index + 1).padStart(2, '0')} / 03</p>
            <h2>{source.localized[locale].title}</h2><p><code translate="no">{source.itemId}</code> · {t.version} {source.version} · {t.type}: {t[source.type]} · {t.level}: {t[source.level]} · {t.edition}: {source.lawsEdition}</p></div>
          <dl className="rv-assessment-editorial__hashes"><div><dt>{t.item}</dt><dd><code translate="no">{contentHash}</code></dd></div><div><dt>{t.rubric}</dt><dd><code translate="no">{rubricHash}</code></dd></div></dl>
        </div>
        <div className="rv-assessment-editorial__languages">
          {(['es', 'en'] as const).map((language) => <section lang={language} aria-label={language === 'es' ? 'Contenido en español' : 'English content'} key={language}>
            <p className="rv-assessment-editorial__language">{language === 'es' ? 'ES · Español' : 'EN · English'}</p>
            <h3>{source.localized[language].title}</h3>
            <h4>{copy[language].question}</h4><p>{source.localized[language].prompt}</p>
            <h4>{copy[language].facts}</h4><ul>{source.publicEvidence.map((entry) => <li key={entry.evidenceId}><code translate="no">{entry.evidenceId}</code> · {entry.text[language]}</li>)}</ul>
            {source.inputSpec.kind === 'ruleQuestion' && <><h4>{copy[language].options}</h4><ol className="rv-assessment-editorial__options">{source.inputSpec.options.map((option) => <li key={option.optionId}><code translate="no">{option.optionId}</code> · {option.label[language]}</li>)}</ol></>}
            {source.inputSpec.kind !== 'ruleQuestion' && <p className="rv-assessment-editorial__handles">{copy[language].offender}: {source.inputSpec.offenderHandles.map((handle) => <code translate="no" key={handle}>{handle}</code>)}</p>}
            <h4>{copy[language].answer}</h4><ol>{source.privateRubric.acceptedAnswers.map((answer, answerIndex) => <li key={answerIndex}><AcceptedAnswer answer={answer} locale={language}/></li>)}</ol>
            <p className="rv-assessment-editorial__note"><strong>{copy[language].alternatives}:</strong> {source.privateRubric.acceptedAnswers.length}. {copy[language].alternativesNote}</p>
            {source.privateRubric.reasoningDimensions.length > 0 && <><h4>{copy[language].reasoning}</h4><p className="rv-assessment-editorial__note">{copy[language].unscored}</p><ul>{source.privateRubric.reasoningDimensions.map((dimension) => <li key={dimension.dimensionId}><code translate="no">{dimension.dimensionId}</code> · {dimension.prompt[language]} ({copy[language].unscoredLabel})</li>)}</ul></>}
            <h4>{copy[language].correction}</h4><p><strong>{source.correction.summary[language]}</strong></p><p>{source.correction.explanation[language]}</p>
            <p className="rv-assessment-editorial__note">{copy[language].evidence}: {source.correction.evidenceIds.map((id) => <code translate="no" key={id}>{id} </code>)}</p>
            <h4>{copy[language].references}</h4><ul>{source.officialSources.filter((reference) => source.correction.sourceIds[language].includes(reference.sourceId)).map((reference) => <li key={reference.sourceId}>
              <a href={reference.documentUrl} target="_blank" rel="noopener noreferrer">{reference.publisher} · {reference.edition} · {reference.displayLabel}</a>
              <span className="rv-assessment-editorial__source-meta">{copy[language].inspected}: {reference.inspectedAt} · {copy[language].sourceDigest}: <code translate="no">{reference.inspectedArtifactSha256}</code></span>
            </li>)}</ul>
          </section>)}
        </div>
        <p className="rv-assessment-editorial__next">{t.recommendation}: {source.recommendationRefs.length ? source.recommendationRefs.map((ref) => <code translate="no" key={ref.targetItemId}>{ref.targetItemId} v{ref.targetVersion} · {ref.lawsEdition}</code>) : t.noRecommendation}</p>
      </article>)}
    </main>
  </div>;
}
