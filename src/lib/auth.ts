// ─── User roles ───────────────────────────────────────────────────────────────
export type UserRole = 'developer' | 'manager';

export interface AuthUser {
  username: string;
  displayName: string;
  role: UserRole;
  initials: string;
}

// ─── Hardcoded credentials ────────────────────────────────────────────────────
// In production, replace this with a proper auth backend.
const USERS: Array<AuthUser & { password: string }> = [
  {
    username:    'developer',
    password:    'dev@odc2025',
    displayName: 'Developer',
    role:        'developer',
    initials:    'DV',
  },
  {
    username:    'manager',
    password:    'mgr@odc2025',
    displayName: 'ODC Manager',
    role:        'manager',
    initials:    'MG',
  },
];

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export function authenticate(username: string, password: string): AuthUser | null {
  const found = USERS.find(
    (u) => u.username === username.trim().toLowerCase() && u.password === password
  );
  if (!found) return null;
  const { password: _pw, ...user } = found;
  return user;
}

export const SESSION_KEY = 'odc-auth-session';
