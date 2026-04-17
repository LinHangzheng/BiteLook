import { NextRequest, NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Invite-Code',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function getValidCodes(): string[] {
  const codes = process.env.INVITE_CODES || '';
  return codes.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean);
}

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: 'No code provided' },
        { status: 400, headers: corsHeaders }
      );
    }

    const validCodes = getValidCodes();
    const normalizedCode = code.trim().toUpperCase();

    if (validCodes.length === 0) {
      return NextResponse.json(
        { valid: false, error: 'Invite system not configured' },
        { status: 503, headers: corsHeaders }
      );
    }

    if (validCodes.includes(normalizedCode)) {
      return NextResponse.json({ valid: true }, { headers: corsHeaders });
    }

    return NextResponse.json(
      { valid: false, error: 'Invalid invite code' },
      { status: 401, headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Invalid request' },
      { status: 400, headers: corsHeaders }
    );
  }
}
