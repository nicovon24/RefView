'use server';

import { cookies, headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { openApplicationDatabase, validateApplicationRuntime } from '@/lib/db/application-runtime';
import { saveAcademyLesson, unsaveAcademyLesson } from './saved-academy-service';

const lessonIdentity = z.strictObject({
  lessonId: z.string().min(1).max(128).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  version: z.number().int().positive().safe(),
});

async function authorize(payload: unknown) {
  const runtime = validateApplicationRuntime(process.env);
  if ((await headers()).get('origin') !== runtime.origin) {
    throw new Error('Application action origin is unavailable');
  }
  return { database: openApplicationDatabase(), identity: lessonIdentity.parse(payload) };
}

function refreshSavedViews() {
  revalidatePath('/es/profile');
  revalidatePath('/en/profile');
}

export async function saveSavedAcademyLesson(payload: unknown) {
  const { database, identity } = await authorize(payload);
  const result = await saveAcademyLesson(database, await cookies(), identity);
  refreshSavedViews();
  return result;
}

export async function unsaveSavedAcademyLesson(payload: unknown) {
  const { database, identity } = await authorize(payload);
  const result = await unsaveAcademyLesson(database, await cookies(), identity);
  refreshSavedViews();
  return result;
}
