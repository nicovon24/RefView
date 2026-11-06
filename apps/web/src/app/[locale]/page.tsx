import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ScenePreview } from '@/features/simulator/scene/ScenePreview';
import { homeCopy } from '@/features/home/copy';
import { ArrowIcon } from '@/components/site/ArrowIcon';
import { SiteHeader } from '@/components/site/SiteHeader';
import '@/components/site/site-buttons.css';
import '@/features/home/home.css';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const t = homeCopy[locale];
  const incidentHref = `/${locale}/simulator/incident-preview`;
  const controlsHref = `/${locale}/simulator/controls`;
  const playtestHref = `/${locale}/simulator/incident-playtest`;

  return (
    <main className="rv-home">
      <a className="rv-home__skip" href="#home-title">{t.skip}</a>
      <SiteHeader locale={locale} active="home" />

      <div className="rv-home__main">
        <section className="rv-home__hero" aria-labelledby="home-title">
          <div className="rv-home__hero-scene" aria-hidden="true"><ScenePreview locale={locale} /></div>
          <div className="rv-home__hero-copy">
            <h1 id="home-title" tabIndex={-1}>{t.title}</h1>
            <p className="rv-home__intro">{t.intro}</p>
            <div className="rv-home__actions">
              <Link className="rv-site-button rv-site-button--primary" href={incidentHref}>{t.openIncident}<ArrowIcon /></Link>
              <Link className="rv-site-button rv-site-button--ghost" href={playtestHref}>{t.openPlaytest}<ArrowIcon diagonal /></Link>
            </div>
            <p className="rv-home__hero-note">{t.incidentNote}</p>
          </div>
          <aside className="rv-home__scene-card" aria-label={t.sceneSection}>
            <span>{t.sceneState}</span>
            <strong>{t.sceneTitle}</strong>
            <small>{t.sceneCaption}</small>
          </aside>
        </section>

        <section className="rv-home__paths" aria-label={t.explore}>
          <div className="rv-home__path-intro"><h2>{t.nextTitle}</h2><p>{t.nextDescription}</p></div>
          <div className="rv-home__path-list">
            <Link href={playtestHref} className="rv-home__path">
              <span><strong>{t.playtestTitle}</strong><small>{t.playtestDescription}</small></span><ArrowIcon diagonal />
            </Link>
            <Link href={controlsHref} className="rv-home__path">
              <span><strong>{t.controlsTitle}</strong><small>{t.controlsDescription}</small></span><ArrowIcon diagonal />
            </Link>
            <Link href="/prototype/index.html" className="rv-home__path">
              <span><strong>{t.prototypeTitle}</strong><small>{t.prototypeDescription}</small></span><ArrowIcon diagonal />
            </Link>
          </div>
        </section>
      </div>
      <footer className="rv-home__footer"><span>{t.footer}</span><span>© RefView</span></footer>
    </main>
  );
}
