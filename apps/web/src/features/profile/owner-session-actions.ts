'use server';

import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { bootstrapApplicationOwner, readApplicationOwner } from '@/lib/auth/application-owner';
import { deleteApplicationOwner } from '@/lib/auth/application-owner-retention';
import { openApplicationDatabase, validateApplicationRuntime } from '@/lib/db/application-runtime';

const emptyPayload = z.strictObject({});

async function authorizeAction(payload: unknown) {
  const runtime = validateApplicationRuntime(process.env);
  const origin = (await headers()).get('origin');
  if (origin !== runtime.origin) throw new Error('Application action origin is unavailable');
  emptyPayload.parse(payload);
  return openApplicationDatabase();
}

export async function bootstrapOwnerSession(payload: unknown) {
  const database = await authorizeAction(payload);
  return bootstrapApplicationOwner(database, await cookies(), {});
}

export async function readOwnerSession(payload: unknown) {
  const database = await authorizeAction(payload);
  return readApplicationOwner(database, await cookies());
}

export async function deleteOwnerSession(payload: unknown) {
  const database = await authorizeAction(payload);
  await deleteApplicationOwner(database, await cookies(), {});
  return { status: 'missing' } as const;
}
