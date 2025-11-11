import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
export default async function Page() {
  const hdrs = headers();
  const host = hdrs.get('host') || 'localhost:3000';
  const protocol = process.env.VERCEL ? 'https' : 'http';
  const base = `${protocol}://${host}`;
  const cookie = hdrs.get('cookie') || '';
  const res = await fetch(`${base}/api/jobs`, { cache: 'no-store', headers: { cookie } });
  const data = await res.json().catch(() => ({ docs: [] }));
  const jobs = data.docs || [];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Jobs</h2>
          <a href="/" className="text-sm text-blue-600 hover:underline">Refresh</a>
        </div>
        <ul className="space-y-3">
          {jobs.map((j: any) => (
            <li key={j.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div><span className="font-medium">URL:</span> {j.url}</div>
                  <div><span className="font-medium">Status:</span> <span className={j.status === 'done' ? 'text-green-700' : 'text-red-700'}>{j.status}</span></div>
                </div>
                <div className="flex gap-3">
                  <a href={`/edit/${j.id}`} className="text-sm text-blue-600 hover:underline">Edit</a>
                  <a href={`/spec/${j.id}`} className="text-sm text-indigo-600 hover:underline">Swagger</a>
                  <form action={async () => {
                    'use server';
                    const hdrs = headers();
                    const host = hdrs.get('host') || 'localhost:3000';
                    const protocol = process.env.VERCEL ? 'https' : 'http';
                    const base = `${protocol}://${host}`;
                    const cookie = hdrs.get('cookie') || '';
                    await fetch(`${base}/api/jobs`, {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json', cookie },
                      body: JSON.stringify({ id: j.id })
                    });
                    revalidatePath('/');
                    redirect('/');
                  }}>
                    <button type="submit" className="text-sm text-red-600 hover:underline">Delete</button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-4">Generate From URLs</h2>
        <NewJobForm />
      </section>
    </div>
  );
}

function NewJobForm() {
  return (
    <form
      action={async (formData: FormData) => {
        'use server';
        const raw = String(formData.get('urls') || '').trim();
        const urls = raw.split(/\n|,/).map(u => u.trim()).filter(Boolean);
        if (!urls.length) return;
        const model = String(formData.get('model') || 'gpt-4o-mini');
        const hdrs = headers();
        const host = hdrs.get('host') || 'localhost:3000';
        const protocol = process.env.VERCEL ? 'https' : 'http';
        const base = `${protocol}://${host}`;
        const cookie = hdrs.get('cookie') || '';
        await fetch(`${base}/api/generate-openapi`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', cookie },
          body: JSON.stringify({ urls, model }),
        });
      }}
      className="grid gap-3"
    >
      <label htmlFor="urls" className="text-sm text-gray-700">Documentation URLs (first public; others auth):</label>
      <textarea id="urls" name="urls" rows={6} placeholder="https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.0/petstore.yaml\nhttps://example.com/internal/docs" className="border rounded-md p-3 bg-white shadow-sm" />
      <label htmlFor="model" className="text-sm text-gray-700">OpenAI Model</label>
      <input id="model" name="model" defaultValue="gpt-4o-mini" className="border rounded-md p-2 bg-white shadow-sm" />
      <button type="submit" className="inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">Generate</button>
      <p className="text-sm text-gray-600">After generation, refresh the list to see new records.</p>
    </form>
  );
}