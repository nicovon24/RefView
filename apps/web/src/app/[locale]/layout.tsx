import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { locales } from '@/lib/i18n/locale';
import '../globals.css';

export const metadata = {
  title: 'RefView — Refereeing from inside the moment',
  description: 'A Spanish-first football refereeing learning platform.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== 'es' && locale !== 'en') notFound();
  return <html lang={locale}><body>{children}</body></html>;
}
