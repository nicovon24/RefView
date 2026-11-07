'use server';

import { cookies, headers } from 'next/headers';
import { z } from 'zod';
import { applicationOwnerTokenHash } from '@/lib/auth/application-owner';
import { readAccountPrincipal, withAccountTransaction } from '@/lib/auth/account-principal';
import { openApplicationDatabase, validateApplicationRuntime } from '@/lib/db/application-runtime';

const emptyPayload = z.strictObject({});
const deletionPayload = z.strictObject({ confirmation: z.literal('DELETE REFVIEW') });
const recentSessionMs = 5 * 60 * 1000;
const accountCookieNames = ['better-auth.session_token', 'better-auth-session_token',
  '__Secure-better-auth.session_token', '__Secure-better-auth-session_token'];

async function clearAccountCookies() {
  const store = await cookies();
  for (const name of accountCookieNames) {
    store.set(name, '', {
      expires: new Date(0),
      path: '/',
      secure: name.startsWith('__Secure-'),
      httpOnly: true,
      sameSite: 'lax',
    });
  }
}

/** Explicitly drops an invalid local account credential without claiming identity. */
export async function forgetInvalidAccountSession(payload: unknown) {
  emptyPayload.parse(payload);
  const origin = validateApplicationRuntime(process.env).origin;
  if ((await headers()).get('origin') !== origin) {
    throw new Error('Account action origin is unavailable');
  }
  await clearAccountCookies();
  return { status: 'forgotten' } as const;
}

async function authorize(payload: unknown, schema: typeof emptyPayload | typeof deletionPayload) {
  schema.parse(payload);
  const requestHeaders = await headers();
  const origin = validateApplicationRuntime(process.env).origin;
  if (requestHeaders.get('origin') !== origin) {
    throw new Error('Account action origin is unavailable');
  }
  const principal = await readAccountPrincipal(requestHeaders);
  if (principal.kind !== 'account') throw new Error('Account session unavailable');
  return { principal, database: openApplicationDatabase() };
}

/** Explicitly attaches only the current browser's independently validated anonymous owner. */
export async function attachCurrentAnonymousData(payload: unknown) {
  const { principal, database } = await authorize(payload, emptyPayload);
  const store = await cookies();
  const tokenHash = applicationOwnerTokenHash(store);
  if (!tokenHash) throw new Error('Account attachment unavailable');

  try {
    const rows = await database.$queryRaw<Array<{ outcome: string }>>`
      SELECT public.application_attach_owner(${principal.token}, ${tokenHash}) AS outcome`;
    const outcome = rows[0]?.outcome;
    if (outcome !== 'attached' && outcome !== 'already_attached') {
      throw new Error('Account attachment unavailable');
    }
    store.delete('refview_session');
    return { status: outcome } as const;
  } catch {
    throw new Error('Account attachment unavailable');
  }
}

/** All account buckets and provider tokens are removed by one token-bound SQL call. */
export async function deleteCurrentAccount(payload: unknown) {
  const { principal, database } = await authorize(payload, deletionPayload);
  await database.$transaction(async (tx) => {
    const account = await tx.$queryRaw<Array<{ accountId: string }>>`
      SELECT public.application_lock_account(${principal.token}) AS "accountId"`;
    if (account.length !== 1 || !account[0]?.accountId) {
      throw new Error('Account deletion unavailable');
    }
    const recent = await tx.$queryRaw<Array<{ createdAt: Date; databaseNow: Date }>>`
      SELECT s."createdAt" AS "createdAt", clock_timestamp() AS "databaseNow"
      FROM public."session" s WHERE s."token" = ${principal.token}
        AND s."userId" = ${account[0].accountId} FOR SHARE`;
    const row = recent[0];
    if (!row || row.databaseNow.getTime() < row.createdAt.getTime()
      || row.databaseNow.getTime() - row.createdAt.getTime() > recentSessionMs) {
      throw new Error('Recent account session required');
    }
    await tx.$queryRaw`SELECT public.application_delete_account(${principal.token})::text`;
  });

  await clearAccountCookies();
  return { status: 'deleted' } as const;
}

/** Revokes this device's account session without deleting learning data. */
export async function logoutCurrentAccount(payload: unknown) {
  const { principal, database } = await authorize(payload, emptyPayload);
  await withAccountTransaction(database, principal, async (tx, accountId) => {
    const deleted = await tx.session.deleteMany({
      where: { token: principal.token, userId: accountId },
    });
    if (deleted.count !== 1) throw new Error('Account logout unavailable');
  });
  await clearAccountCookies();
  return { status: 'signed_out' } as const;
}
