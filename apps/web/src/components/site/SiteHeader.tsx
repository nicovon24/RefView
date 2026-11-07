import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locale';
import { PreferredLocaleLink } from './PreferredLocaleLink';
import './site-header.css';

export type SiteRoute = 'home' | 'incident' | 'playtest' | 'controls' | 'academy' | 'community' | 'profile';

const copy = {
  es: { navigation: 'Navegación principal', language: 'Idioma', menu: 'Menú', home: 'Inicio', incident: 'Revisión 3D', playtest: 'Prueba local', controls: 'Controles', academy: 'Academia', community: 'Comunidad', profile: 'Perfil', spanish: 'Español', english: 'English' },
  en: { navigation: 'Main navigation', language: 'Language', menu: 'Menu', home: 'Home', incident: '3D review', playtest: 'Local playtest', controls: 'Controls', academy: 'Academy', community: 'Community', profile: 'Profile', spanish: 'Español', english: 'English' },
} as const;

const paths: Record<SiteRoute, string> = {
  home: '', incident: '/simulator/incident-preview',
  playtest: '/simulator/incident-playtest', controls: '/simulator/controls', academy: '/academy', community: '/community', profile: '/profile',
};
const routes: SiteRoute[] = ['home', 'incident', 'playtest', 'academy', 'community', 'profile'];

export function SiteHeader({ locale, active, title, languagePath }: { locale: Locale; active: SiteRoute; title?: string; languagePath?: string }) {
  const t = copy[locale];
  const path = languagePath ?? paths[active];
  return <header className="rv-site-header">
    <div className="rv-site-header__inner">
      <Link className="rv-site-header__brand" href={`/${locale}`} aria-label={`RefView · ${t.home}`}>
        <span className="rv-site-header__mark" aria-hidden="true" /><span>RefView</span>
      </Link>
      {title && <span className="rv-site-header__title">{title}</span>}
      <nav className="rv-site-header__nav" aria-label={t.navigation}>
        {routes.map((route) => <Link key={route} href={`/${locale}${paths[route]}`}
          aria-current={active === route ? 'page' : undefined}>{t[route]}</Link>)}
      </nav>
      <nav className="rv-site-header__languages" aria-label={t.language}>
        <PreferredLocaleLink locale="es" href={`/es${path}`} label={t.spanish} current={locale === 'es'} />
        <span aria-hidden="true">/</span>
        <PreferredLocaleLink locale="en" href={`/en${path}`} label={t.english} current={locale === 'en'} />
      </nav>
      <details className="rv-site-header__mobile">
        <summary aria-label={t.menu}>
          <span className="rv-site-header__menu-icon" aria-hidden="true"><i /><i /><i /></span><span>{t.menu}</span>
        </summary>
        <nav aria-label={t.navigation}>
          {routes.map((route) => <Link key={route} href={`/${locale}${paths[route]}`}
            aria-current={active === route ? 'page' : undefined}>{t[route]}</Link>)}
        </nav>
      </details>
    </div>
  </header>;
}
