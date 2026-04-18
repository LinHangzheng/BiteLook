import { cookies, headers } from 'next/headers';
import { kv } from '@vercel/kv';
import type { SessionData } from '@/types/session';

const COOKIE_KEY = 'bitelook_session_token';
const HEADER_KEY = 'X-Session-Token';

/**
 * Get the session token from cookie or header (for Capacitor native apps).
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(COOKIE_KEY)?.value;
  if (cookieToken) {
    return cookieToken;
  }

  const headerStore = await headers();
  const headerToken = headerStore.get(HEADER_KEY);
  return headerToken;
}

/**
 * Validate the session token by looking it up in KV.
 * Returns the session data if valid, null otherwise.
 */
export async function validateSession(): Promise<SessionData | null> {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const session = await kv.get<SessionData>(`session:${token}`);
  if (!session) {
    return null;
  }

  if (Date.now() > session.expiresAt) {
    await kv.del(`session:${token}`);
    return null;
  }

  return session;
}
