import { cookies, headers } from 'next/headers';

const COOKIE_KEY = 'bitelook_invite_code';
const HEADER_KEY = 'X-Invite-Code';

function getValidCodes(): string[] {
  const codes = process.env.INVITE_CODES || '';
  return codes.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean);
}

/**
 * Get the invite code from cookie or header (for Capacitor native apps).
 */
export async function getInviteCode(): Promise<string | null> {
  // First try to get from cookie
  const cookieStore = await cookies();
  const cookieCode = cookieStore.get(COOKIE_KEY)?.value;
  if (cookieCode) {
    return cookieCode;
  }

  // Fall back to header (for Capacitor native apps)
  const headerStore = await headers();
  const headerCode = headerStore.get(HEADER_KEY);
  return headerCode;
}

export async function validateInviteCode(): Promise<boolean> {
  const inviteCode = await getInviteCode();

  if (!inviteCode) {
    console.log('No invite code found in cookie or header');
    return false;
  }

  const validCodes = getValidCodes();
  const isValid = validCodes.includes(inviteCode.toUpperCase());

  console.log('Validating invite code:', inviteCode, 'Valid:', isValid);

  return isValid;
}
