import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '../../../../payload.config';
import crypto from 'crypto';

function hashPassword(password: string, salt?: string) {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return `${s}:${hash}`;
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
    const exists = await payload.find({ collection: 'app-users', where: { username: { equals: username } }, limit: 1 } as any);
    if (exists?.docs?.length) {
      return NextResponse.json({ error: 'user already exists' }, { status: 409 });
    }
    const passwordHash = hashPassword(password);
    const doc = await payload.create({ collection: 'app-users', data: { username, passwordHash } } as any);
    return NextResponse.json({ ok: true, userId: doc.id });
  } catch (e: any) {
    console.error('Register error:', e);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}