import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import Cookies from 'js-cookie';

const STORAGE_KEY = 'bitelook_invite_code';

/**
 * Cross-platform storage abstraction for authentication.
 * Uses Capacitor Preferences in native apps, js-cookie in web browsers.
 */
export const storage = {
  /**
   * Get the stored invite code.
   */
  async getInviteCode(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key: STORAGE_KEY });
      return value;
    }
    return Cookies.get(STORAGE_KEY) || null;
  },

  /**
   * Store the invite code.
   */
  async setInviteCode(code: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key: STORAGE_KEY, value: code });
    } else {
      Cookies.set(STORAGE_KEY, code, { expires: 365 });
    }
  },

  /**
   * Remove the stored invite code.
   */
  async removeInviteCode(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.remove({ key: STORAGE_KEY });
    } else {
      Cookies.remove(STORAGE_KEY);
    }
  },
};

/**
 * Get headers for API requests, including the invite code header for native apps.
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // In native apps, we need to pass the invite code via header
  // since cookies don't work reliably in Capacitor WebView
  if (Capacitor.isNativePlatform()) {
    const inviteCode = await storage.getInviteCode();
    if (inviteCode) {
      headers['X-Invite-Code'] = inviteCode;
    }
  }

  return headers;
}
