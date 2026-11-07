import { validateApplicationRuntime } from '@/lib/db/application-runtime';

export const runtime = 'nodejs';

const SOCIAL_PATH = '/api/auth/sign-in/social';
const GOOGLE_CALLBACK_PATH = '/api/auth/google/callback';
const INTERNAL_GOOGLE_CALLBACK_PATH = '/api/auth/callback/google';
const MAX_START_BODY_BYTES = 128;

function unavailable(): Response {
  return new Response('Google sign-in is unavailable', { status: 503 });
}

function rejected(status: number): Response {
  return new Response(null, { status });
}

function configuredOrigin(): string | null {
  try {
    return validateApplicationRuntime(process.env).origin;
  } catch {
    return null;
  }
}

function hasConfiguredHost(request: Request, origin: string): boolean {
  return request.headers.get('host') === new URL(origin).host;
}

async function googleAuth() {
  try {
    return (await import('@/lib/auth/google-auth')).auth;
  } catch {
    return null;
  }
}

async function isStrictGoogleStart(request: Request): Promise<boolean> {
  if (request.headers.get('content-type')?.toLowerCase() !== 'application/json') return false;
  const declaredLength = request.headers.get('content-length');
  if (declaredLength !== null &&
    (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_START_BODY_BYTES)) return false;
  if (!request.body) return false;

  try {
    const reader = request.body.getReader();
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let body = '';
    let length = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_START_BODY_BYTES) {
        await reader.cancel();
        return false;
      }
      body += decoder.decode(value, { stream: true });
    }
    body += decoder.decode();
    const value: unknown = JSON.parse(body);
    return typeof value === 'object' && value !== null && !Array.isArray(value) &&
      Object.keys(value).length === 1 &&
      Object.prototype.hasOwnProperty.call(value, 'provider') &&
      (value as Record<string, unknown>).provider === 'google';
  } catch {
    return false;
  }
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== SOCIAL_PATH) return rejected(404);
  const localeValues = url.searchParams.getAll('locale');
  if (localeValues.length > 1 || url.searchParams.size !== localeValues.length
    || (localeValues.length === 1 && localeValues[0] !== 'es' && localeValues[0] !== 'en')) {
    return rejected(400);
  }
  const locale = localeValues[0] ?? 'es';

  const origin = configuredOrigin();
  if (!origin) return unavailable();
  if (!hasConfiguredHost(request, origin) || request.headers.get('origin') !== origin) return rejected(403);
  if (!await isStrictGoogleStart(request)) return rejected(400);

  const auth = await googleAuth();
  if (!auth) return unavailable();

  const headers = new Headers();
  headers.set('content-type', 'application/json');
  headers.set('origin', origin);
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  try {
    return await auth.handler(new Request(`${origin}${SOCIAL_PATH}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ provider: 'google', callbackURL: `${origin}/${locale}/profile` }),
    }));
  } catch {
    return unavailable();
  }
}

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== GOOGLE_CALLBACK_PATH) return rejected(404);

  const origin = configuredOrigin();
  if (!origin) return unavailable();
  if (!hasConfiguredHost(request, origin)) return rejected(403);

  const auth = await googleAuth();
  if (!auth) return unavailable();

  try {
    const internalCallback = new URL(INTERNAL_GOOGLE_CALLBACK_PATH, origin);
    internalCallback.search = url.search;
    return await auth.handler(new Request(internalCallback, request));
  } catch {
    return unavailable();
  }
}
