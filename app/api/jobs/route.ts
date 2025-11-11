import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '../../../payload.config';

let payloadClientPromise: Promise<any> | null = null;
async function init() {
  if (!config) {
    console.error('Payload config import is undefined');
  } else {
    try {
      console.log('Payload config keys:', Object.keys(config as any));
      console.log('collections is array?', Array.isArray((config as any).collections));
    } catch { }
  }
  if (!payloadClientPromise) {
    payloadClientPromise = getPayload({ config });
  }
  return payloadClientPromise;
}

export async function GET(req: NextRequest) {
  try {
    const sessionUser = req.cookies.get('sessionUser');
    if (!sessionUser?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!process.env.DATABASE_URL) {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');
      if (id) {
        return NextResponse.json({ doc: null, warning: 'DATABASE_URL not configured; no persistence available' });
      }
      return NextResponse.json({ docs: [], warning: 'DATABASE_URL not configured; no persistence available' });
    }
    console.log('GET /api/jobs: DATABASE_URL present?', !!process.env.DATABASE_URL);
    let payload: any;
    try {
      payload = await init();
      console.log('GET /api/jobs: Payload initialized');
    } catch (e: any) {
      console.error('GET /api/jobs: Payload init failed:', e?.message, e?.stack);
      try {
        console.error('GET /api/jobs: init error keys:', Object.getOwnPropertyNames(e));
      } catch { }
      return NextResponse.json({ docs: [], warning: 'Payload initialization failed; check DATABASE_URL and Postgres connectivity' });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id) {
      const doc = await payload.findByID({ collection: 'api-spec-jobs', id } as any);
      return NextResponse.json({ doc });
    }
    const res = await payload.find({ collection: 'api-spec-jobs', limit: 50, sort: '-createdAt' } as any);
    return NextResponse.json({ docs: res.docs || [] });
  } catch (e: any) {
    try {
      console.error('GET /api/jobs error:', e?.message, e?.stack);
      console.error('GET /api/jobs full error:', JSON.stringify(e));
    } catch { }
    return NextResponse.json({ docs: [], warning: e?.message || 'Server error' });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = req.cookies.get('sessionUser');
    if (!sessionUser?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL not configured; cannot update' }, { status: 400 });
    }
    const payload = await init();
    const body = await req.json();
    const { id, data } = body || {};
    if (!id || !data) return NextResponse.json({ error: 'id and data required' }, { status: 400 });
    const doc = await payload.update({ collection: 'api-spec-jobs', id, data } as any);
    return NextResponse.json({ doc });
  } catch (e: any) {
    console.error('PUT /api/jobs error:', e?.message, e?.stack);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionUser = req.cookies.get('sessionUser');
    if (!sessionUser?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'DATABASE_URL not configured; cannot delete' }, { status: 400 });
    }
    const payload = await init();
    const body = await req.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await payload.delete({ collection: 'api-spec-jobs', id } as any);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('DELETE /api/jobs error:', e?.message, e?.stack);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}