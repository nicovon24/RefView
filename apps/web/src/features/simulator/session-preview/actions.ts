'use server';

import { cookies, headers } from 'next/headers';
import { establishAnonymousSession, requireExactOrigin } from '@/lib/auth/anonymous-session';
import { openSessionTestDatabase, validateSessionTestRuntime } from '@/lib/db/session-runtime';

export async function establishPreviewSession(payload: unknown): Promise<{ status: 'active'; expiresAt: string }> {
  const { origin } = validateSessionTestRuntime(process.env);
  requireExactOrigin((await headers()).get('origin'), origin);
  const jar = await cookies();
  return establishAnonymousSession(openSessionTestDatabase(), jar, payload);
}
