import { cookies } from 'next/headers';

const COOKIE_KEY = 'bitelook_invite_code';

function getValidCodes(): string[] {
  const codes = process.env.INVITE_CODES || '';
  return codes.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean);
}

export async function validateInviteCode(): Promise<boolean> {
  const cookieStore = await cookies();
  const inviteCode = cookieStore.get(COOKIE_KEY)?.value;

  if (!inviteCode) {
    console.log('No invite code cookie found');
    return false;
  }

  const validCodes = getValidCodes();
  const isValid = validCodes.includes(inviteCode.toUpperCase());

  console.log('Validating invite code:', inviteCode, 'Valid:', isValid);

  return isValid;
}
