'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authenticate, SESSION_KEY, type AuthUser } from './auth';

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
  isDeveloper: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => ({ error: 'Not initialised' }),
  logout: () => {},
  isDeveloper: false,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Restore session on mount
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  // Redirect to login if not authenticated (after loading)
  useEffect(() => {
    if (loading) return;
    if (!user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, loading, pathname, router]);

  const login = useCallback(async (username: string, password: string) => {
    const found = authenticate(username, password);
    if (!found) return { error: 'Invalid username or password.' };
    setUser(found);
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(found)); } catch {}
    return {};
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isDeveloper: user?.role === 'developer' }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}
