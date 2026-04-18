import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import Cookies from 'js-cookie';

const STORAGE_KEY = 'bitelook_session_token';

/**
 * Cross-platform storage abstraction for session tokens.
 * Uses Capacitor Preferences in native apps, js-cookie in web browsers.
 */
export const storage = {
  async getSessionToken(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      return value;
    }
    return Cookies.get(STORAGE_KEY) || null;
  },

  async setSessionToken(token: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: STORAGE_KEY, value: token });
    } else {
      Cookies.set(STORAGE_KEY, token, { expires: 7, secure: true, sameSite: 'strict' });
    }
  },

  async removeSessionToken(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: STORAGE_KEY });
    } else {
      Cookies.remove(STORAGE_KEY);
    }
  },
};

/**
 * Get headers for API requests, including the session token header for native apps.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (Capacitor.isNativePlatform()) {
    const token = await storage.getSessionToken();
    if (token) {
      headers['X-Session-Token'] = token;
    }
  }

  return headers;
}
