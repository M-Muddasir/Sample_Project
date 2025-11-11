import { NextRequest, NextResponse } from 'next/server';
import { listJobs, getJob as getJobStore, updateJob as updateJobStore, deleteJob as deleteJobStore } from '../../../lib/jsonStore';

export async function GET(req: NextRequest) {
  try {
    const sessionUser = req.cookies.get('sessionUser');
    if (!sessionUser?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id) {
      const doc = await getJobStore(id);
      return NextResponse.json({ doc });
    }
    const docs = await listJobs();
    return NextResponse.json({ docs });
  } catch (e: any) {
    try {
      console.error('GET /api/jobs error:', e?.message, e?.stack);
      console.error('GET /api/jobs full error:', JSON.stringify(e));
    } catch { }
    return NextResponse.json({ docs: [], error: e?.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const sessionUser = req.cookies.get('sessionUser');
    if (!sessionUser?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { id, data } = body || {};
    if (!id || !data) return NextResponse.json({ error: 'id and data required' }, { status: 400 });
    const doc = await updateJobStore(id, data);
    if (!doc) return NextResponse.json({ error: 'not found' }, { status: 404 });
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
    const body = await req.json();
    const { id } = body || {};
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const ok = await deleteJobStore(id);
    if (!ok) return NextResponse.json({ error: 'not found' }, { status: 404 });
    return NextResponse.json({ ok });
  } catch (e: any) {
    console.error('DELETE /api/jobs error:', e?.message, e?.stack);
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}