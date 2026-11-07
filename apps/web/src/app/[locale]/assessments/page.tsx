import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { assessmentCopy } from '@/features/assessments/route-ui-v1-copy';
import { readAssessmentCatalog } from '@/features/assessments/route-ui-v1-data';
import { startAssessmentAction } from '@/features/assessments/route-ui-v1-actions';
import { readApplicationOwner } from '@/lib/auth/application-owner';
import { openApplicationDatabase } from '@/lib/db/application-runtime';
import { SiteHeader } from '@/components/site/SiteHeader';
import { AssessmentCatalog } from '@/features/assessments/assessment-views';
import '@/features/assessments/route-ui-v1.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AssessmentsPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const { level } = await searchParams;
  if (level && !['beginner', 'intermediate', 'advanced'].includes(level)) notFound();
  const t = assessmentCopy[locale];
  const catalog = await readAssessmentCatalog(locale);
  const items = catalog.kind === 'ready' ? catalog.items.filter((item) => !level || item.level === level) : [];
  const owner = items.length ?
    await readApplicationOwner(openApplicationDatabase(), await cookies()).catch(() => ({ status: 'unavailable' as const })) : null;
  return <div className="rv-assessment">
    <a className="rv-assessment__skip" href="#assessment-title">{locale === 'es' ? 'Ir al contenido' : 'Skip to content'}</a>
    <SiteHeader locale={locale} active="home" />
    <main className="rv-assessment__main">
      <header className="rv-assessment__hero"><h1 id="assessment-title">{t.title}</h1><p>{t.intro}</p></header>
      <section className="rv-assessment__section" aria-labelledby="assessment-browse"><h2 id="assessment-browse">{t.browse}</h2>
        <form className="rv-assessment__filters" action={`/${locale}/assessments`} method="get">
          <span>{t.topic}: {t.topicName}</span><span>{t.edition}: IFAB 2026/27</span>
          <label htmlFor="assessment-level">{t.level}</label>
          <select id="assessment-level" name="level" defaultValue={level ?? ''}>
            <option value="">{t.allLevels}</option>
            {(['beginner', 'intermediate', 'advanced'] as const).map((value) =>
              <option key={value} value={value}>{t[value]} ({catalog.kind === 'ready' ? catalog.levelCounts[value] : '–'})</option>)}
          </select><button type="submit">{t.filter}</button>
        </form>
        {catalog.kind === 'unavailable' ? <div className="rv-assessment__state" role="status">{t.unavailable}</div>
          : items.length === 0 ? <div className="rv-assessment__state" role="status">{catalog.items.length ? t.emptySelection : t.empty}</div>
            : <>{owner?.status === 'missing' && <p>{t.noOwner} <Link href={`/${locale}/profile`}>{t.profile}</Link></p>}
              {owner?.status === 'unavailable' && <p role="status">{t.ownerUnavailable}</p>}
              <AssessmentCatalog locale={locale} items={items} action={owner?.status === 'active' ? (item) =>
                <form action={startAssessmentAction.bind(null, locale, item.itemId, item.version)}><button type="submit">{t.open}</button></form> : undefined} /></>}
      </section>
    </main>
  </div>;
}
