import { NextRequest, NextResponse } from 'next/server';

// Invite codes are stored as comma-separated values in env variable
// Example: INVITE_CODES=CODE123,FRIEND456,BETA789
function getValidCodes(): string[] {
  const codes = process.env.INVITE_CODES || '';
  return codes.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'No code provided' }, { status: 400 });
    }

    const validCodes = getValidCodes();
    const normalizedCode = code.trim().toUpperCase();

    if (validCodes.length === 0) {
      // If no codes configured, reject all
      return NextResponse.json(
        { valid: false, error: 'Invite system not configured' },
        { status: 503 }
      );
    }

    if (validCodes.includes(normalizedCode)) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false, error: 'Invalid invite code' }, { status: 401 });
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 });
  }
}
