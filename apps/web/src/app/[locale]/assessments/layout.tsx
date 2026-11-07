import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

export default function AssessmentsUnavailableLayout({ children }: Readonly<{ children: ReactNode }>) {
  void children;
  notFound();
}
