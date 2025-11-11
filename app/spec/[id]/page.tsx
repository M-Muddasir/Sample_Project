import { headers } from 'next/headers';
import SwaggerUIViewer from '../../ui/SwaggerUIViewer';

export default async function SpecPage({ params }: { params: { id: string } }) {
  const hdrs = headers();
  const host = hdrs.get('host') || 'localhost:3000';
  const protocol = process.env.VERCEL ? 'https' : 'http';
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get('cookie') || '';
  const res = await fetch(`${base}/api/jobs?id=${params.id}`, { cache: 'no-store', headers: { cookie } });
  const data = await res.json().catch(() => ({ doc: null }));
  const job = data.doc;
  let spec: any = null;
  try {
    spec = job?.result ? JSON.parse(job.result) : null;
  } catch {
    spec = null;
  }
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">Swagger Preview</h2>
      {spec ? (
        <div className="bg-white border rounded-lg p-2">
          <SwaggerUIViewer spec={spec} />
        </div>
      ) : (
        <p className="text-sm text-gray-700">No valid spec JSON found in this record.</p>
      )}
    </div>
  );
}