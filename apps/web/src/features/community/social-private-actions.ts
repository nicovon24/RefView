'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { readAccountPrincipal } from '../../lib/auth/account-principal';
import { openApplicationDatabase, validateApplicationRuntime } from '../../lib/db/application-runtime';
import { contributorInput, matchInput, postInput, operationInput,
  createPrivateContributor, createPrivateMatch, createPrivatePost,
  issuePrivateSocialOperation } from './social-private-service';

async function authorize() {
  const requestHeaders = await headers();
  if (requestHeaders.get('origin') !== validateApplicationRuntime(process.env).origin) {
    throw new Error('Social action unavailable');
  }
  const principal = await readAccountPrincipal(requestHeaders);
  if (principal.kind !== 'account') throw new Error('Social action unavailable');
  return { principal, database: openApplicationDatabase() };
}

function refreshPrivateWorkspace() {
  revalidatePath('/es/community/my');
  revalidatePath('/en/community/my');
}

/** Keep the returned key in the current form state and reuse it for a retry. */
export async function issueSocialOperation(payload: unknown) {
  try {
    const { operation } = operationInput.parse(payload);
    const { database, principal } = await authorize();
    return await issuePrivateSocialOperation(database, principal, operation);
  } catch {
    throw new Error('Social action unavailable');
  }
}

export async function createSocialContributor(payload: unknown) {
  try {
    const input = contributorInput.parse(payload);
    const { database, principal } = await authorize();
    const result = await createPrivateContributor(database, principal, input);
    refreshPrivateWorkspace();
    return result;
  } catch {
    throw new Error('Social action unavailable');
  }
}

export async function createSocialMatch(payload: unknown) {
  try {
    const input = matchInput.parse(payload);
    const { database, principal } = await authorize();
    const result = await createPrivateMatch(database, principal, input);
    refreshPrivateWorkspace();
    return result;
  } catch {
    throw new Error('Social action unavailable');
  }
}

export async function createSocialPost(payload: unknown) {
  try {
    const input = postInput.parse(payload);
    const { database, principal } = await authorize();
    const result = await createPrivatePost(database, principal, input);
    refreshPrivateWorkspace();
    return result;
  } catch {
    throw new Error('Social action unavailable');
  }
}
