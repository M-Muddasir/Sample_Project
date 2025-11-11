import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, defaultValue: T): Promise<T> {
  await ensureDataDir();
  const p = path.join(DATA_DIR, file);
  try {
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt) as T;
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      await writeJsonAtomic(file, defaultValue as any);
      return defaultValue;
    }
    throw e;
  }
}

async function writeJsonAtomic(file: string, data: any) {
  await ensureDataDir();
  const p = path.join(DATA_DIR, file);
  const tmp = p + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, p);
}

export type ApiJob = {
  id: string;
  url: string;
  status: 'done' | 'error';
  result?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
};

export async function listJobs(): Promise<ApiJob[]> {
  return await readJson<ApiJob[]>('jobs.json', []);
}

export async function getJob(id: string): Promise<ApiJob | null> {
  const jobs = await listJobs();
  return jobs.find((j) => j.id === id) || null;
}

export async function upsertJob(job: Partial<ApiJob> & { url: string; status: 'done' | 'error' }): Promise<ApiJob> {
  let jobs = await listJobs();
  const now = new Date().toISOString();
  if (job.id) {
    const idx = jobs.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      const updated: ApiJob = { ...jobs[idx], ...job, updatedAt: now } as ApiJob;
      jobs[idx] = updated;
      await writeJsonAtomic('jobs.json', jobs);
      return updated;
    }
  }
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const created: ApiJob = {
    id,
    url: job.url,
    status: job.status,
    result: job.result,
    error: job.error,
    createdAt: now,
    updatedAt: now,
  };
  jobs = [created, ...jobs];
  await writeJsonAtomic('jobs.json', jobs);
  return created;
}

export async function updateJob(id: string, data: Partial<Pick<ApiJob, 'status' | 'result' | 'error'>>): Promise<ApiJob | null> {
  const jobs = await listJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const updated: ApiJob = { ...jobs[idx], ...data, updatedAt: now } as ApiJob;
  jobs[idx] = updated;
  await writeJsonAtomic('jobs.json', jobs);
  return updated;
}

export async function deleteJob(id: string): Promise<boolean> {
  let jobs = await listJobs();
  const before = jobs.length;
  jobs = jobs.filter((j) => j.id !== id);
  if (jobs.length === before) return false;
  await writeJsonAtomic('jobs.json', jobs);
  return true;
}

export async function listUsers(): Promise<User[]> {
  return await readJson<User[]>('users.json', []);
}

export async function findUser(username: string): Promise<User | null> {
  const users = await listUsers();
  return users.find((u) => u.username === username) || null;
}

export async function createUser(username: string, passwordHash: string): Promise<User> {
  const users = await listUsers();
  if (users.some((u) => u.username === username)) {
    throw new Error('user already exists');
  }
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const user: User = { id, username, passwordHash, createdAt: new Date().toISOString() };
  const next = [user, ...users];
  await writeJsonAtomic('users.json', next);
  return user;
}