"use client";
import { useState } from 'react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registering, setRegistering] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    const endpoint = registering ? '/api/auth/register' : '/api/auth/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data?.error || 'Request failed');
      return;
    }
    if (registering) {
      setMessage('Registered successfully. You can now log in.');
      setRegistering(false);
      return;
    }
    // On login success, go to main page
    window.location.href = '/';
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 border rounded-md bg-white shadow-sm">
      <h1 className="text-2xl font-semibold mb-4">{registering ? 'Register' : 'Login'}</h1>
      <form onSubmit={submit} className="grid gap-3">
        <label htmlFor="username" className="text-sm text-gray-700">Username</label>
        <input id="username" value={username} onChange={e => setUsername(e.target.value)} className="border rounded-md p-2" />
        <label htmlFor="password" className="text-sm text-gray-700">Password</label>
        <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="border rounded-md p-2" />
        <button type="submit" className="mt-2 inline-flex items-center justify-center rounded-md bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700">
          {registering ? 'Register' : 'Login'}
        </button>
      </form>
      <div className="mt-3 text-sm">
        <button className="text-blue-600 hover:underline" onClick={() => setRegistering(r => !r)}>
          {registering ? 'Have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-red-600">{message}</p>}
    </div>
  );
}