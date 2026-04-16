import { Capacitor } from '@capacitor/core';

/**
 * Get the API base URL based on the runtime environment.
 * - Native app (Capacitor): Uses the deployed Vercel backend
 * - Web: Uses relative paths (empty string)
 */
export function getApiBaseUrl(): string {
  // Check if running in native Capacitor environment
  if (Capacitor.isNativePlatform()) {
    // In native app, use the deployed Vercel backend
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://bitelook.vercel.app';
  }

  // In web browser, use relative paths
  return '';
}

/**
 * Build a full API URL from a path.
 * @param path - The API path (e.g., '/api/process-menu')
 * @returns The full URL for the API endpoint
 */
export function apiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path}`;
}

/**
 * Check if we're running in a native Capacitor environment.
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}
