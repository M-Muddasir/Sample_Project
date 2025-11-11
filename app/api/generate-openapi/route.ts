import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import path from 'node:path';
import { URL } from 'node:url';
import { upsertJob as upsertJobStore } from '../../../lib/jsonStore';

// Hardcoded credentials for private documentation access
// Note: Kept inline per requirements; do not log or expose.
const AUTH_EMAIL = 'api-reader@example.com';
const AUTH_PASSWORD = 'S3curePass!';

// Remove Payload CMS usage; persistence is handled via local JSON files

function baseUrlFrom(input: string): string {
  try {
    const u = new URL(input);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

async function fetchPublic(url: string): Promise<string> {
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`Failed to fetch public URL: ${res.status}`);
  return await res.text();
}

async function tryBasicAuth(url: string): Promise<Response> {
  const token = Buffer.from(`${AUTH_EMAIL}:${AUTH_PASSWORD}`).toString('base64');
  return fetch(url, {
    headers: { Authorization: `Basic ${token}` }
  });
}

async function attemptLogin(url: string): Promise<string | null> {
  const u = new URL(url);
  const candidates = [
    `${u.protocol}//${u.host}/api/auth/login`,
    `${u.protocol}//${u.host}/login`,
    `${u.protocol}//${u.host}/auth/login`
  ];
  for (const endpoint of candidates) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD })
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const token = data.token || data.access_token || data.jwt || null;
        if (token) return token;
      }
    } catch {}
  }
  return null;
}

async function fetchPrivate(url: string): Promise<string> {
  // First try without auth
  let res = await fetch(url);
  if (res.ok) return await res.text();

  // Try Basic Auth
  res = await tryBasicAuth(url);
  if (res.ok) return await res.text();

  // Try login to get Bearer token
  const token = await attemptLogin(url);
  if (token) {
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) return await res.text();
  }

  throw new Error(`Failed to fetch private URL: ${res.status}`);
}

function openAIPrompt(docText: string, docUrl: string) {
  const base = baseUrlFrom(docUrl);
  return [
    {
      role: 'system',
      content:
        'You are an API documentation parser. Output ONLY valid OpenAPI 3.0.3 JSON. Fill gaps with safe defaults.'
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text:
            `Generate an OpenAPI 3.0.3 JSON spec from the documentation provided.\n` +
            `Rules: \n` +
            `- Ensure "openapi": "3.0.3"\n` +
            `- info: include title, description, and use version "1.0.0" if unknown\n` +
            `- servers: include base URL "${base}" if appropriate\n` +
            `- paths: include HTTP methods, parameters, request bodies, responses\n` +
            `- components: include schemas, examples, and definitions if present\n` +
            `- For unknown parameter types, use "string"\n` +
            `- For missing responses, use HTTP 200 with example JSON object\n` +
            `- Output MUST be valid JSON only, no comments or prose.\n\n` +
            `Documentation URL: ${docUrl}\n` +
            `Base URL: ${base}\n\n` +
            `Documentation content (HTML/plain text):\n` +
            `${docText}`
        }
      ]
    }
  ];
}

async function generateSpec(openai: OpenAI, docText: string, docUrl: string): Promise<any> {
  const messages = openAIPrompt(docText, docUrl);
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages, 
    temperature: 0,
    response_format: { type: 'json_object' }
  } as any);

  const content = resp.choices?.[0]?.message?.content ?? '';
  let json: any;
  try {
    json = JSON.parse(content);
  } catch (e) {
    // Attempt to salvage JSON by extracting the largest {...} block
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('OpenAI returned non-JSON content');
    json = JSON.parse(match[0]);
  }

  // Normalize / enforce required fields
  json.openapi = '3.0.3';
  json.info = json.info || {};
  json.info.version = json.info.version || '1.0.0';
  json.info.title = json.info.title || 'API';
  json.info.description = json.info.description || 'Generated from documentation.';
  const base = baseUrlFrom(docUrl);
  if (base) {
    json.servers = json.servers && Array.isArray(json.servers) ? json.servers : [];
    if (!json.servers.some((s: any) => s && s.url === base)) {
      json.servers.unshift({ url: base });
    }
  }
  json.paths = json.paths || {};
  json.components = json.components || {};

  return json;
}

export async function POST(req: NextRequest) {
  try {
    const sessionUser = req.cookies.get('sessionUser');
    if (!sessionUser?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const urls: string[] = Array.isArray(body?.urls) ? body.urls.map((x: any) => String(x).trim().replace(/^`|`$/g, '')) : [];
    const model: string = typeof body?.model === 'string' && body.model.trim() ? body.model.trim() : 'gpt-4o-mini';
    if (!urls.length) {
      return NextResponse.json({ error: 'Invalid payload: urls[] required' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY is not set' }, { status: 500 });
    }

    const results: Array<{ id?: string; url: string; status: 'done' | 'error'; result?: string; error?: string }> = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      let status: 'done' | 'error' = 'done';
      let resultStr: string | undefined;
      let errorMsg: string | undefined;

      try {
        // 1st URL is public, others may require auth
        const doc = i === 0 ? await fetchPublic(url) : await fetchPrivate(url);

        // Generate OpenAPI spec
        const spec = await generateSpec(openai, doc, url);
        resultStr = JSON.stringify(spec, null, 2);
        const created = await upsertJobStore({ url, status: 'done', result: resultStr });
        results.push({ id: created.id, url, status, result: resultStr });
      } catch (err: any) {
        status = 'error';
        errorMsg = err?.message || 'Unknown error';
        const created = await upsertJobStore({ url, status: 'error', error: errorMsg });
        results.push({ id: created.id, url, status, error: errorMsg });
      }
    }

    return NextResponse.json({ results, model });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error' }, { status: 500 });
  }
}