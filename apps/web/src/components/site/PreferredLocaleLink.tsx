'use client';

import Link from 'next/link';
import type { Locale } from '@/lib/i18n/locale';
import { savePreferredLocale } from '@/features/profile/device-preferences';

export function PreferredLocaleLink({ locale, href, label, current }: { locale: Locale; href: string; label: string; current: boolean }) {
  return <Link href={href} lang={locale} aria-label={label} aria-current={current ? 'page' : undefined}
    onClick={() => { savePreferredLocale(locale); }}>{locale.toUpperCase()}</Link>;
}
