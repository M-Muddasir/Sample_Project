import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function NavBar() {
  const sessionUser = cookies().get('sessionUser');
  const loggedIn = !!sessionUser?.value;
  return (
    <nav className="container flex items-center gap-6 py-4">
      <a href="/" className="text-lg font-semibold text-gray-800">Api Spec Jobs</a>
      <a href="/apis" className="text-sm text-blue-700 hover:underline">APIs</a>
      <span className="ml-auto flex items-center gap-3">
        {loggedIn ? (
          <form
            action={async () => {
              'use server';
              // Directly clear the session cookie in a Server Action.
              // Using fetch('/api/...') from a Server Action can fail because
              // Node's fetch requires an absolute URL. This avoids that.
              cookies().delete('sessionUser');
              redirect('/login');
            }}
          >
            <button type="submit" className="inline-flex items-center justify-center rounded-md bg-gray-100 text-gray-800 px-3 py-1 text-sm hover:bg-gray-200">Logout</button>
          </form>
        ) : (
          <a href="/login" className="text-sm text-blue-700 hover:underline">Login</a>
        )}
      </span>
    </nav>
  );
}