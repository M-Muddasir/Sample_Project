import { headers } from 'next/headers';
import SwaggerUIViewer from '../ui/SwaggerUIViewer';

export default async function ApisPage() {
  const hdrs = headers();
  const host = hdrs.get('host') || 'localhost:3000';
  const protocol = process.env.VERCEL ? 'https' : 'http';
  const base = `${protocol}://${host}`;
  const res = await fetch(`${base}/api/openapi`, { cache: 'no-store' });
  const spec = await res.json().catch(() => ({}));
  return (
    <div className="grid gap-4">
      <h2 className="text-xl font-semibold">API Explorer</h2>
      <p className="text-sm text-gray-700">Use Swagger to try out API calls directly.</p>
      <div className="bg-white border rounded-lg p-2">
        <SwaggerUIViewer spec={spec} />
      </div>
    </div>
  );
}