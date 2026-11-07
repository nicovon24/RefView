import 'server-only';

import { getSessionCookie } from 'better-auth/cookies';
import type { PrismaClient } from '../../generated/prisma/client';
import type { ApplicationOwnerTransaction } from './application-owner';

export type AccountPrincipal = Readonly<{
  kind: 'account';
  token: string;
  sessionCreatedAt: Date;
}>;

export type AccountPresence = AccountPrincipal | Readonly<{ kind: 'missing' }>;

const accountCookieNames = new Set([
  'better-auth.session_token',
  'better-auth-session_token',
  '__Secure-better-auth.session_token',
  '__Secure-better-auth-session_token',
]);

function hasAccountCookie(requestHeaders: Headers): boolean {
  const header = requestHeaders.get('cookie');
  if (!header) return false;
  return header.split(';').some((part) => {
    const trimmed = part.trim();
    const separator = trimmed.indexOf('=');
    return accountCookieNames.has(separator < 0 ? trimmed : trimmed.slice(0, separator));
  });
}

/** A present account credential must never silently fall back to an anonymous owner. */
export async function readAccountPrincipal(requestHeaders: Headers): Promise<AccountPresence> {
  if (!hasAccountCookie(requestHeaders)) return { kind: 'missing' };
  if (!getSessionCookie(requestHeaders)) throw new Error('account session unavailable');

  const { auth } = await import('./google-auth');
  const current = await auth.api.getSession({ headers: requestHeaders });
  if (!current?.session?.token || !current.session.createdAt) {
    throw new Error('account session unavailable');
  }
  return {
    kind: 'account',
    token: current.session.token,
    sessionCreatedAt: current.session.createdAt,
  };
}

/** The database rechecks the verified cookie's session token under the account lock. */
export async function withAccountTransaction<T>(
  database: PrismaClient,
  principal: AccountPrincipal,
  operation: (tx: ApplicationOwnerTransaction, accountId: string) => Promise<T>,
): Promise<T> {
  return database.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ accountId: string }>>`
      SELECT public.application_lock_account(${principal.token}) AS "accountId"`;
    if (rows.length !== 1 || !rows[0]?.accountId) {
      throw new Error('account session unavailable');
    }
    return operation(tx, rows[0].accountId);
  });
}
