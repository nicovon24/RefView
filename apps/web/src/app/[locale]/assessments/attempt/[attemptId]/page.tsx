import { randomUUID } from 'node:crypto';
import { SiteHeader } from '@/components/site/SiteHeader';
import { AssessmentQuestion, AssessmentCorrection } from '@/features/assessments/assessment-views';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { assessmentCopy } from '@/features/assessments/route-ui-v1-copy';
import { readAssessmentAttempt, type RestoredAttempt } from '@/features/assessments/route-ui-v1-data';
import { finalizeAssessmentAction, startAssessmentAction } from '@/features/assessments/route-ui-v1-actions';
import '@/features/assessments/route-ui-v1.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
type Result = Extract<RestoredAttempt, { state: 'finalized' }>['result'];
type PublicAnswer = Result['submittedAnswer'] | Result['acceptedOutcomes'][number];

function answerDetails(answer: PublicAnswer, locale: 'es' | 'en', optionLabels: Record<string, string>) {
  const t = assessmentCopy[locale];
  if (answer.kind === 'ruleQuestion') return <span>{t.answer}: {optionLabels[answer.optionId] ?? t.optionUnavailable}</span>;
  return <span>{t.restart}: {t[answer.restart]}; {t.discipline}: {t[answer.discipline]};
    {' '}{t.offender}: {answer.offenderHandle ?? t.none}
    {'reasoning' in answer && <><br />{t.reasoning}: {answer.reasoning}</>}</span>;
}

export default async function AssessmentAttemptPage({ params }: {
  params: Promise<{ locale: string; attemptId: string }>;
}) {
  const { locale, attemptId } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const t = assessmentCopy[locale];
  const read = await readAssessmentAttempt(attemptId, locale);
  const attempt = read.kind === 'ready' && read.value.state === 'ready' ? read.value.attempt : null;
  const result = read.kind === 'ready' && read.value.state === 'finalized' ? read.value.result : null;
  return <div className="rv-assessment"><SiteHeader locale={locale} active="assessments" languagePath={`/assessments/attempt/${attemptId}`} /><main className="rv-assessment__main">
    <header className="rv-assessment__hero"><h1>{attempt?.title ?? result?.title ?? t.title}</h1>
      <p>{attempt ? t.prompt : result ? t.result : t.missing}</p></header>
    <section className="rv-assessment__section">
      {read.kind !== 'ready' ? <div className="rv-assessment__state" role="status">{read.kind === 'missing' ? t.missing : t.unavailableAttempt}</div>
        : attempt ? <AssessmentQuestion locale={locale} attempt={attempt}
          formAction={finalizeAssessmentAction.bind(null, locale, attempt.attemptId, attempt.type)}
          idempotencyKey={randomUUID()} /> : result && <div className="rv-assessment__result">
          <section className="rv-assessment__panel"><h2>{t.submitted}</h2><p>{answerDetails(result.submittedAnswer, locale, read.optionLabels)}</p>
            <p><strong>{t.score}:</strong> {result.evaluation.structuredDecision.score}/100</p>
            <h3>{t.accepted}</h3><ul>{result.acceptedOutcomes.map((outcome, index) =>
              <li key={index}>{answerDetails(outcome, locale, read.optionLabels)}</li>)}</ul>
            {result.reasoningReview.length > 0 && <><h3>{t.unscored}</h3><ul>{result.reasoningReview.map((dimension) => <li key={dimension.dimensionId}>{dimension.prompt}</li>)}</ul></>}
            <p>{t.notApplicable}: {locale === 'es' ? 'posicionamiento, comunicación y protocolo' : 'positioning, communication, and protocol'}.</p>
          </section>
          <AssessmentCorrection locale={locale} correction={result.correction} />
          <section className="rv-assessment__panel"><h2>{t.next}</h2>{result.nextPractice.length === 0 ? <p>{t.nextUnavailable}</p> :
            <ul>{result.nextPractice.map((next) => <li key={`${next.targetItemId}:${next.targetVersion}`}>
              {next.availability === 'available' ? <form action={startAssessmentAction.bind(null, locale, next.targetItemId, next.targetVersion)}>
                <button type="submit">{t.available}: {next.targetItemId}</button></form>
                : `${next.targetItemId}: ${t.unavailableItem}`}</li>)}</ul>}
            <Link href={`/${locale}/assessments`}>{t.retry}</Link></section>
        </div>}
    </section>
  </main></div>;
}
