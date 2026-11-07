import Link from 'next/link';
import type { ReactNode } from 'react';
import type { CatalogItem, RestoredAttempt } from './route-ui-v1-data';
import { assessmentCopy } from './route-ui-v1-copy';

type Locale = 'es' | 'en';
type ActiveAttempt = Extract<RestoredAttempt, { state: 'ready' }>['attempt'];
type FinalResult = Extract<RestoredAttempt, { state: 'finalized' }>['result'];
const restarts = ['playOn', 'penaltyKick', 'directFreeKick', 'indirectFreeKick', 'droppedBall'] as const;
const disciplines = ['none', 'yellow', 'red'] as const;

export function AssessmentCatalog({ locale, items, action, previewHref }: {
  locale: Locale; items: CatalogItem[]; action?: (item: CatalogItem) => ReactNode;
  previewHref?: (item: CatalogItem) => string;
}) {
  const t = assessmentCopy[locale];
  return <div className="rv-assessment__list">{items.map((item, index) =>
    <article className="rv-assessment__row" id={`assessment-${item.itemId}-v${item.version}`} key={`${item.itemId}:${item.version}`}>
      <span className="rv-assessment__row-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div className="rv-assessment__row-body"><p className="rv-assessment__meta">{t[item.type]} · {t[item.level]} · {t.version} {item.version}</p>
        <h3>{item.title}</h3><p className="rv-assessment__meta">{t.topicName} · {item.lawsEdition.replaceAll('-', ' ')}</p></div>
      <div className="rv-assessment__row-action">{previewHref ? <Link className="rv-assessment__button" href={previewHref(item)}>{t.previewQuestion}</Link> : action?.(item)}</div>
    </article>)}</div>;
}

export function AssessmentQuestion({ locale, attempt, formAction, idempotencyKey, preview = false, correctionHref }: {
  locale: Locale; attempt: ActiveAttempt; formAction?: (formData: FormData) => void | Promise<void>;
  idempotencyKey?: string; preview?: boolean; correctionHref?: string;
}) {
  const t = assessmentCopy[locale];
  const fields = attempt.inputSpec.kind === 'ruleQuestion' ? <fieldset><legend className="rv-assessment__sr-only">{t.answer}</legend>
    {attempt.inputSpec.options.map((option) => <label className="rv-assessment__choice" key={option.optionId}>
      <input type="radio" name="optionId" value={option.optionId} required={!preview} /><span>{option.label}</span></label>)}
  </fieldset> : <>
    <label>{t.restart}<select name="restart" required={!preview} defaultValue=""><option value="" disabled>—</option>
      {restarts.map((value) => <option key={value} value={value}>{t[value]}</option>)}</select></label>
    <label>{t.discipline}<select name="discipline" required={!preview} defaultValue=""><option value="" disabled>—</option>
      {disciplines.map((value) => <option key={value} value={value}>{t[value]}</option>)}</select></label>
    <label>{t.offender}<select name="offenderHandle" defaultValue=""><option value="">{t.none}</option>
      {attempt.inputSpec.offenderHandles.map((handle) => <option value={handle} key={handle}>{handle}</option>)}</select></label>
    {attempt.inputSpec.kind === 'authoredIncidentAnalysis' && <label>{t.reasoning}
      <textarea name="reasoning" required={!preview} /><small>{preview ? t.previewReasoningNote : t.reasoningNote}</small></label>}
  </>;
  return <div className="rv-assessment__question">
    <div className="rv-assessment__question-main"><p className="rv-assessment__meta">{t[attempt.type]} · {attempt.lawsEdition.replaceAll('-', ' ')}</p>
      <h2>{t.prompt}</h2><p className="rv-assessment__prompt">{attempt.prompt}</p>
      {preview && attempt.inputSpec.kind === 'authoredIncidentAnalysis' && <p className="rv-assessment__preview-source-note">{t.previewSourceSaveNote}</p>}
      {attempt.publicEvidence.length > 0 && <section className="rv-assessment__evidence"><h3>{t.evidence}</h3><ul>{attempt.publicEvidence.map((entry) =>
        <li key={entry.evidenceId}>{entry.text}</li>)}</ul></section>}</div>
    <div className="rv-assessment__answer"><h2>{t.answer}</h2>
      {preview ? <div className="rv-assessment__form">{fields}<p className="rv-assessment__note">{t.previewNoAttempt}</p></div>
        : <form className="rv-assessment__form" action={formAction}>
          {idempotencyKey && <input type="hidden" name="idempotencyKey" value={idempotencyKey} />}
          {fields}<p className="rv-assessment__note">{t.immutable}</p><button type="submit">{t.confirm}</button>
        </form>}
      {correctionHref && <Link className="rv-assessment__button rv-assessment__preview-correction-link" href={correctionHref}>{t.viewExampleCorrection}</Link>}
    </div>
  </div>;
}

export function AssessmentCorrection({ locale, correction, next, nextTitle }: {
  locale: Locale; correction: FinalResult['correction']; next?: ReactNode; nextTitle?: string;
}) {
  const t = assessmentCopy[locale];
  return <div className="rv-assessment__correction"><section><h2>{t.result}</h2><p className="rv-assessment__correction-summary">{correction.summary}</p><p>{correction.explanation}</p></section>
    <section><h3>{t.evidence}</h3><ul>{correction.evidence.map((entry) => <li key={entry.evidenceId}>{entry.text}</li>)}</ul>
      <h3>{t.sources}</h3><ul>{correction.sources.map((source) => <li key={source.sourceId}>
        <a href={source.documentUrl} target="_blank" rel="noopener noreferrer">{source.displayLabel}</a> ({source.printedPage})</li>)}</ul></section>
    {next && <section><h3>{nextTitle ?? t.next}</h3>{next}</section>}</div>;
}
