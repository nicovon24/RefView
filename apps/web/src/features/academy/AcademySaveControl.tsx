'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { saveSavedAcademyLesson } from '@/features/profile/saved-academy-actions';
import { academyCopy } from './catalog-ui-v1-copy';

type SaveState = 'missing' | 'unavailable' | 'saved' | 'unsaved';

export function AcademySaveControl({ locale, lessonId, version, initialState }: {
  locale: 'es' | 'en'; lessonId: string; version: number; initialState: SaveState;
}) {
  const t = academyCopy[locale];
  const [state, setState] = useState<SaveState>(initialState);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(false);
    startTransition(async () => {
      try {
        await saveSavedAcademyLesson({ lessonId, version });
        setState('saved');
      } catch {
        setError(true);
      }
    });
  }

  return <div className="rv-academy__save" aria-label={t.save}>
    {state === 'unsaved' && <button type="button" onClick={save} disabled={pending}>{pending ? t.saving : t.save}</button>}
    <p role="status" aria-live="polite">{error ? t.saveError : state === 'saved' ? t.saved
      : state === 'missing' ? t.saveMissing : state === 'unavailable' ? t.saveUnavailable : ''}</p>
    <p>{t.saveScope} <Link href={`/${locale}/profile`}>{t.profile}</Link></p>
  </div>;
}
