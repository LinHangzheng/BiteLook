import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { corsHeaders } from '@/lib/cors';
import { getSessionToken, validateSession } from '@/lib/validate-session';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET() {
  const session = await validateSession();

  if (!session) {
    return NextResponse.json(
      { valid: false, error: 'Invalid or expired session' },
      { status: 401, headers: corsHeaders }
    );
  }

  return NextResponse.json(
    { valid: true, userId: session.userId, expiresAt: session.expiresAt },
    { headers: corsHeaders }
  );
}

export async function DELETE() {
  const token = await getSessionToken();

  if (token) {
    await kv.del(`session:${token}`);
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders });
}
