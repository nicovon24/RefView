import type { ReactNode } from 'react';

const motifs: Record<number, ReactNode> = {
  1: <><rect x="4" y="6" width="40" height="36" rx="1"/><path d="M24 6v36M4 24h40M4 16h7v16H4m40-16h-7v16h7"/><circle cx="24" cy="24" r="6"/></>,
  2: <><circle cx="24" cy="24" r="19"/><path d="m24 13 9 7-3 11H18l-3-11 9-7Zm-9 7-8-4m26 4 8-4M18 31l-5 10m17-10 5 10"/></>,
  3: <><circle cx="15" cy="13" r="5"/><circle cx="33" cy="13" r="5"/><path d="M5 39V28c0-5 4-8 10-8s10 3 10 8v11M23 39V28c0-5 4-8 10-8s10 3 10 8v11M3 39h42"/></>,
  4: <><path d="m16 7-7 5-5 13 8 4 4-7v20h16V22l4 7 8-4-5-13-7-5-5 5h-6l-5-5Z"/><path d="M21 19h6"/></>,
  5: <><path d="M8 32 30 10l8 8-22 22-8-8Zm22-22 5-5 8 8-5 5M10 33l5 5M5 43h38"/></>,
  6: <><path d="M7 10v28M7 10l20 7-20 7m28-13v26M29 37h12M35 11l-6 8 6 8 6-8-6-8Z"/></>,
  7: <><circle cx="24" cy="27" r="16"/><path d="M24 27V16m0 11 8 5M18 4h12M24 4v7"/></>,
  8: <><circle cx="24" cy="26" r="15"/><path d="M24 11v30M9 26h30m-3-17 6 6m0-6-6 6"/></>,
  9: <><path d="M5 9h38v30H5zM24 9v30M6 30c8-10 12 10 20 0s12 10 17 0"/><circle cx="24" cy="24" r="4"/></>,
  10: <><path d="M11 6h26v13c0 10-6 15-13 15S11 29 11 19V6Zm0 5H5v7c0 6 4 9 9 9m23-16h6v7c0 6-4 9-9 9M24 34v8m-9 0h18"/></>,
  11: <><path d="M5 9v31M15 9v31M32 9v31M42 9v31M5 21h38"/><circle cx="26" cy="21" r="4"/><path d="m22 5 4 4 4-4"/></>,
  12: <><path d="M11 37 20 9l6 4-4 12 7 3 7-15 6 4-11 24-12-8-8 4Z"/><circle cx="9" cy="12" r="4"/><circle cx="38" cy="39" r="4"/></>,
  13: <><circle cx="15" cy="31" r="7"/><path d="M22 31h18M28 24l7-7m-7 21 7 7M5 13h27m-9-6 9 6-9 6"/></>,
  14: <><rect x="6" y="7" width="36" height="34"/><path d="M17 7v10h14V7M16 41a8 8 0 0 1 16 0"/><circle cx="24" cy="29" r="2"/></>,
  15: <><path d="M7 40h34M11 8l13 7 13-7M14 10v18l10 7 10-7V10M17 22h14M24 15v20"/></>,
  16: <><rect x="5" y="8" width="38" height="32"/><path d="M5 17h11v14H5m22-4 10-10m-10 0h10v10"/><circle cx="18" cy="31" r="3"/></>,
  17: <><path d="M6 41V7h35M6 26a19 19 0 0 0 19-19M16 34l18-18m-8 0h8v8"/><circle cx="11" cy="36" r="4"/></>,
};

export function LawIcon({ number }: { number: number }) {
  return <svg className="rv-academy__law-icon" aria-hidden="true" focusable="false" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {motifs[number]}
  </svg>;
}
