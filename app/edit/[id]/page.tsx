import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getJob(id: string) {
  const hdrs = headers();
  const host = hdrs.get('host') || 'localhost:3000';
  const protocol = process.env.VERCEL ? 'https' : 'http';
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get('cookie') || '';
  const res = await fetch(`${base}/api/jobs?id=${id}`, { cache: 'no-store', headers: { cookie } });
  const data = await res.json().catch(() => ({ doc: null }));
  return data.doc;
}

export default async function EditPage({ params }: { params: { id: string } }) {
  const job = await getJob(params.id);
  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Edit Job</h2>
        <a href="/" className="text-sm text-blue-600 hover:underline">Back</a>
      </div>
      {!job ? (
        <div className="text-sm text-red-600">Job not found or unavailable.</div>
      ) : (
        <div className="text-sm"><span className="font-medium">URL:</span> {job.url}</div>
      )}
      <form
        action={async (formData: FormData) => {
          'use server';
          const hdrs = headers();
          const host = hdrs.get('host') || 'localhost:3000';
          const protocol = process.env.VERCEL ? 'https' : 'http';
          const base = `${protocol}://${host}`;
          const status = String(formData.get('status') || 'done');
          const result = String(formData.get('result') || '');
          const cookie = hdrs.get('cookie') || '';
          const resp = await fetch(`${base}/api/jobs`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', cookie },
            body: JSON.stringify({ id: params.id, data: { status, result } })
          });
          if (!resp.ok) {
            redirect(`/edit/${params.id}?error=${encodeURIComponent('Update failed')}`);
          }
          // After save, revalidate and redirect to main page
          revalidatePath(`/`);
          redirect('/');
        }}
        className="grid gap-3"
      >
        <label htmlFor="status" className="text-sm text-gray-700">Status</label>
        <select id="status" name="status" defaultValue={job?.status || 'done'} className="border rounded-md p-2 bg-white shadow-sm">
          <option value="done">done</option>
          <option value="error">error</option>
        </select>
        <label htmlFor="result" className="text-sm text-gray-700">Result (OpenAPI JSON)</label>
        <textarea id="result" name="result" rows={12} defaultValue={job?.result || ''} className="border rounded-md p-3 bg-white shadow-sm" />
        <button type="submit" className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Save</button>
      </form>
    </div>
  );
}