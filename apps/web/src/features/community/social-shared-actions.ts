'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { readAccountPrincipal } from '../../lib/auth/account-principal';
import { openApplicationDatabase, validateApplicationRuntime } from '../../lib/db/application-runtime';
import { issueSharedSocialOperation, reportSharedPost, setSharedPostReaction, removeSharedPost, removeSharedMatch,
  sharedOperationInput, sharedReactionInput, sharedReportInput, sharedRemoveInput, sharedRemoveMatchInput } from './social-shared-service';

async function authorize() {
  const requestHeaders = await headers();
  if (requestHeaders.get('origin') !== validateApplicationRuntime(process.env).origin) {
    throw new Error('Social action unavailable');
  }
  const principal = await readAccountPrincipal(requestHeaders);
  if (principal.kind !== 'account') throw new Error('Social action unavailable');
  return { principal, database: openApplicationDatabase() };
}

function refreshCommunity() {
  for (const locale of ['es', 'en']) {
    revalidatePath(`/${locale}/community`);
    revalidatePath(`/${locale}/community/my`);
  }
}

export async function issueSharedOperation(payload: unknown) {
  try {
    const { operation } = sharedOperationInput.parse(payload);
    const { principal, database } = await authorize();
    return await issueSharedSocialOperation(database, principal, operation);
  } catch {
    throw new Error('Social action unavailable');
  }
}

export async function reactToSharedPost(payload: unknown) {
  try {
    const input = sharedReactionInput.parse(payload);
    const { principal, database } = await authorize();
    await setSharedPostReaction(database, principal, input);
    refreshCommunity();
    return { kind: 'saved' as const };
  } catch {
    throw new Error('Social action unavailable');
  }
}

export async function reportSharedPostAction(payload: unknown) {
  try {
    const input = sharedReportInput.parse(payload);
    const { principal, database } = await authorize();
    await reportSharedPost(database, principal, input);
    refreshCommunity();
    return { kind: 'saved' as const };
  } catch {
    throw new Error('Social action unavailable');
  }
}

export async function removeSharedPostAction(payload: unknown) {
  try {
    const input = sharedRemoveInput.parse(payload);
    const { principal, database } = await authorize();
    await removeSharedPost(database, principal, input);
    refreshCommunity();
    return { kind: 'saved' as const };
  } catch {
    throw new Error('Social action unavailable');
  }
}

export async function removeSharedMatchAction(payload: unknown) {
  try {
    const input = sharedRemoveMatchInput.parse(payload);
    const { principal, database } = await authorize();
    await removeSharedMatch(database, principal, input);
    refreshCommunity();
    return { kind: 'saved' as const };
  } catch {
    throw new Error('Social action unavailable');
  }
}
