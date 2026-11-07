import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import { openApplicationDatabase, validateApplicationRuntime } from '../db/application-runtime';

function required(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name];
  if (!value || !value.trim()) throw new Error(`${name} is required for Google authentication`);
  return value;
}

function requiredSecret(environment: NodeJS.ProcessEnv): string {
  const value = required(environment, 'BETTER_AUTH_SECRET');
  if (!/^[A-Za-z0-9_-]{43}$/.test(value) ||
    Buffer.from(value, 'base64url').length !== 32 ||
    Buffer.from(value, 'base64url').toString('base64url') !== value) {
    throw new Error('BETTER_AUTH_SECRET must encode 32 random bytes as base64url');
  }
  return value;
}

function exactAuthEnvironment(environment: NodeJS.ProcessEnv) {
  if (environment.BETTER_AUTH_TRUSTED_ORIGINS !== undefined ||
    environment.BETTER_AUTH_SECRETS !== undefined) {
    throw new Error('Unreviewed Better Auth origin or secret override');
  }
  return validateApplicationRuntime(environment);
}

/** This module is not mounted until its schema, credentials, and account ownership are reviewed. */
export const auth = betterAuth({
  appName: 'RefView',
  baseURL: exactAuthEnvironment(process.env).origin,
  trustedOrigins: [exactAuthEnvironment(process.env).origin],
  database: prismaAdapter(openApplicationDatabase(), { provider: 'postgresql' }),
  secret: requiredSecret(process.env),
  socialProviders: {
    google: {
      clientId: required(process.env, 'GOOGLE_CLIENT_ID'),
      clientSecret: required(process.env, 'GOOGLE_CLIENT_SECRET'),
      redirectURI: `${exactAuthEnvironment(process.env).origin}/api/auth/google/callback`,
      includeGrantedScopes: false,
    },
  },
  emailAndPassword: { enabled: false },
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: 'database',
    storeAccountCookie: false,
    accountLinking: { disableImplicitLinking: true, trustedProviders: [] },
  },
  databaseHooks: {
    account: {
      create: { before: async (account) => ({ data: { ...account, idToken: null } }) },
      update: { before: async (account) => ({ data: { ...account, idToken: null } }) },
    },
  },
  user: { deleteUser: { enabled: false }, changeEmail: { enabled: false } },
  session: { cookieCache: { enabled: false } },
  advanced: { useSecureCookies: true },
});
