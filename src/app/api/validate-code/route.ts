import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { nanoid } from 'nanoid';
import { corsHeaders } from '@/lib/cors';
import type { SessionData } from '@/types/session';
import { SESSION_TTL_SECONDS } from '@/types/session';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function getValidCodes(): string[] {
  const codes = process.env.INVITE_CODES || '';
  return codes.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean);
}

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:validate:${ip}`;
  const count = await kv.incr(key);
  if (count === 1) {
    await kv.expire(key, 60);
  }
  return count <= 5;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const allowed = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { valid: false, error: 'Too many attempts. Please wait a minute.' },
        { status: 429, headers: corsHeaders }
      );
    }

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

    if (!validCodes.includes(normalizedCode)) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invite code' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Generate session
    const sessionToken = nanoid(32);
    const userId = `user_${nanoid(12)}`;
    const now = Date.now();

    const session: SessionData = {
      sessionId: sessionToken,
      userId,
      inviteCode: normalizedCode,
      createdAt: now,
      expiresAt: now + SESSION_TTL_SECONDS * 1000,
    };

    await kv.set(`session:${sessionToken}`, session, { ex: SESSION_TTL_SECONDS });

    return NextResponse.json(
      { valid: true, sessionToken, userId },
      { headers: corsHeaders }
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Invalid request' },
      { status: 400, headers: corsHeaders }
    );
  }
}
