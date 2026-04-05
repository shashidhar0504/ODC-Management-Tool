'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff, Hotel, Loader2, Lock, User } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    const result = await login(username, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #1B2A4A 0%, #243860 50%, #1B2A4A 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div style={{
          position: 'absolute', top: '-10%', right: '-5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'rgba(184,150,78,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-8%', left: '-8%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(184,150,78,0.04)',
        }} />
      </div>

      <div className="w-full max-w-sm relative animate-fade-slide-up">
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.97)' }}
        >
          {/* Top strip */}
          <div
            className="px-8 py-6 flex flex-col items-center"
            style={{ background: 'var(--brand-navy)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg"
              style={{ background: 'var(--brand-brass)' }}
            >
              <Hotel size={26} color="#1B2A4A" strokeWidth={2.5} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--brand-sand)' }}>
              ODC Manager
            </h1>
            <p className="text-xs mt-1" style={{ color: 'rgba(245,240,232,0.55)' }}>
              Hotel On-Duty Certificate System
            </p>
          </div>

          {/* Form */}
          <div className="px-8 py-7">
            <p className="text-sm font-semibold mb-5" style={{ color: 'var(--brand-navy)' }}>
              Sign in to your account
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-username"
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--brand-navy)', letterSpacing: '0.07em' }}
                >
                  Username
                </label>
                <div className="relative">
                  <User
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--brand-slate)' }}
                  />
                  <input
                    id="login-username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={e => { setUsername(e.target.value); setError(''); }}
                    placeholder="Enter your username"
                    className="w-full h-10 pl-9 pr-3 rounded-lg text-sm outline-none transition-all duration-150"
                    style={{
                      border: '1.5px solid hsl(var(--border))',
                      background: '#fdfdfd',
                      color: 'var(--brand-navy)',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-brass)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--brand-navy)', letterSpacing: '0.07em' }}
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--brand-slate)' }}
                  />
                  <input
                    id="login-password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter your password"
                    className="w-full h-10 pl-9 pr-10 rounded-lg text-sm outline-none transition-all duration-150"
                    style={{
                      border: '1.5px solid hsl(var(--border))',
                      background: '#fdfdfd',
                      color: 'var(--brand-navy)',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--brand-brass)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'hsl(var(--border))')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    style={{ color: 'var(--brand-slate)' }}
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="rounded-lg px-3 py-2.5 text-xs font-medium animate-fade-in"
                  style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' }}
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-lg text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60 mt-1"
                style={{ background: 'var(--brand-brass)' }}
              >
                {loading ? (
                  <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-4" style={{ color: 'rgba(245,240,232,0.4)' }}>
          ODC Manager v1.0 · Hotel Management Suite
        </p>
      </div>
    </div>
  );
}
