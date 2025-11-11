import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createUser, findUser } from '../../../../lib/jsonStore';

function hashPassword(password: string, salt?: string) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return `${s}:${hash}`;
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'username and password required' }, { status: 400 });
    }
    const passwordHash = hashPassword(password);
    try {
      const user = await createUser(username, passwordHash);
      return NextResponse.json({ ok: true, userId: user.id });
    } catch (e: any) {
      if (String(e?.message).includes('already exists')) {
        return NextResponse.json({ error: 'user already exists' }, { status: 409 });
      }
      throw e;
    }
  } catch (e: any) {
    console.error('Register error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}