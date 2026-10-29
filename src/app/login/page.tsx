'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nextParam = searchParams.get('next') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          next: nextParam,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Incorrect username or password');
        setLoading(false);
        return;
      }

      // Success: redirect to target
      const redirectUrl = data.redirect || nextParam || '/';
      window.location.href = redirectUrl;
    } catch (err: any) {
      setError(err?.message || 'Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-xl border border-zinc-200 shadow-sm p-6 sm:p-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center h-12 w-auto mb-3">
          <img
            src="/logo.png"
            alt="Nusa Flores Travel"
            className="max-h-12 max-w-[180px] object-contain"
          />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Sign in to your account</h1>
        <p className="text-xs text-zinc-500 mt-1">Tour Proposal Generator &mdash; Nusa Flores Travel</p>
      </div>

      {/* Error Alert Box */}
      {error && (
        <div className="mb-5 p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-xs font-medium text-zinc-700 mb-1.5">
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            required
            autoFocus
            autoComplete="username"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 rounded-md bg-white border border-zinc-300 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 shadow-xs transition disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-zinc-700 mb-1.5">
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 rounded-md bg-white border border-zinc-300 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-zinc-900 shadow-xs transition disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Signing in...</span>
            </>
          ) : (
            <span>Sign In</span>
          )}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-zinc-100 text-center text-[11px] text-zinc-400">
        Authorized staff access only &bull; Protected session
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="bg-zinc-50 text-zinc-900 min-h-screen flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-xs text-zinc-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
