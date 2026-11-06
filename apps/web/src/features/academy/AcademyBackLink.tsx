import Link from 'next/link';

export function AcademyBackLink({ href, label, className = 'rv-academy__back' }: { href: string; label: string; className?: string }) {
  return <Link className={className} href={href} aria-label={label} title={label}>
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m11 5-7 7 7 7" />
      <path d="M4 12h16" />
    </svg>
  </Link>;
}
