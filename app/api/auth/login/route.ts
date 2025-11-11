import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUser } from '../../../../lib/jsonStore';

function verifyPassword(password: string, stored: string) {
  const [salt, hashHex] = (stored || '').split(':');
  if (!salt || !hashHex) return false;
  const calc = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (storedBuf.length !== calc.length) return false;
  const a = new Uint8Array(storedBuf.buffer, storedBuf.byteOffset, storedBuf.byteLength);
  const b = new Uint8Array(calc.buffer, calc.byteOffset, calc.byteLength);
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'username and password required' }, { status: 400 });
    }
    const user = await findUser(username);
    if (!user) {
      return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
    }
    const ok = verifyPassword(password, String(user?.passwordHash || ''));
    if (!ok) {
      return NextResponse.json({ error: 'invalid credentials' }, { status: 401 });
    }
    const resp = NextResponse.json({ ok: true });
    resp.cookies.set('sessionUser', username, { httpOnly: true, path: '/', sameSite: 'lax' });
    return resp;
  } catch (e: any) {
    console.error('Login error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}