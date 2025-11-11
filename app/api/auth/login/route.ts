import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '../../../../payload.config';
import crypto from 'crypto';

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
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL not configured' }, { status: 400 });
    }
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'username and password required' }, { status: 400 });
    }
    const payload = await getPayload({ config });
    const res = await payload.find({ collection: 'app-users', where: { username: { equals: username } }, limit: 1 } as any);
    const user: any = res?.docs?.[0];
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