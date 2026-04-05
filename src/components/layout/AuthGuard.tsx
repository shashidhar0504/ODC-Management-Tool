'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { RefreshCw } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  /** If true, also requires developer role */
  developerOnly?: boolean;
}

export default function AuthGuard({ children, developerOnly = false }: AuthGuardProps) {
  const { user, loading, isDeveloper } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center"
        style={{ background: 'var(--brand-sand)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--brand-brass)' }} />
      </div>
    );
  }

  // Not logged in
  if (!user) return null;

  // Developer-only page accessed by a non-developer
  if (developerOnly && !isDeveloper) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6"
        style={{ background: 'var(--brand-sand)' }}>
        <div className="bg-white rounded-2xl border shadow-lg max-w-sm w-full p-8 text-center"
          style={{ borderColor: 'hsl(var(--border))' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,68,68,0.1)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--brand-navy)' }}>
            Developer Access Only
          </h2>
          <p className="text-sm" style={{ color: 'var(--brand-slate)' }}>
            The Settings page is restricted to the <strong>Developer</strong> role. Please contact your system administrator for access.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-5 w-full py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--brand-brass)' }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
