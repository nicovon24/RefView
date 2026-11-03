import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScenePreview } from '@/features/simulator/scene/ScenePreview';
import { copy } from '@/lib/i18n/locale';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  const t = copy[locale];

  return (
    <main className="page-shell">
      <header className="site-header">
        <Link className="brand" href={`/${locale}`} aria-label="RefView home">
          <span className="brand-mark" aria-hidden="true">R<span>V</span></span>
          <span>REFVIEW</span>
        </Link>
        <nav className="language-nav" aria-label={t.language}>
          <Link aria-current={locale === 'es' ? 'page' : undefined} href="/es" lang="es">ES</Link>
          <span aria-hidden="true">/</span>
          <Link aria-current={locale === 'en' ? 'page' : undefined} href="/en" lang="en">EN</Link>
        </nav>
      </header>

      <div className="hero-grid">
        <section className="hero-copy" aria-labelledby="page-title">
          <p className="eyebrow"><span className="signal-dot" />{t.eyebrow}</p>
          <h1 id="page-title">{t.title}</h1>
          <p className="intro">{t.intro}</p>
          <div className="hero-actions">
            <Button asChild><Link href="/prototype/index.html">{t.prototype}<span aria-hidden="true">↗</span></Link></Button>
          </div>
          <p className="next-step">{t.next}</p>
        </section>
        <section className="scene-card" aria-labelledby="scene-title">
          <div className="scene-heading">
            <div><p className="scene-kicker">01 / WEBGL</p><h2 id="scene-title">{t.scene}</h2></div>
            <span className="scene-live">LIVE TEST</span>
          </div>
          <ScenePreview locale={locale} />
          <div className="scene-footer"><span className="scene-led" />{t.sceneDescription}</div>
        </section>
      </div>
      <footer className="site-footer"><span>{t.status}</span><span>© REFVIEW</span></footer>
    </main>
  );
}
