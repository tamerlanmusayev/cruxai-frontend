import { API_URL } from './api';

const KEY = 'cruxai_token';
const USER_KEY = 'cruxai_user';

export interface AuthUser {
  email: string;
  name: string | null;
  picture: string | null;
}

/** Returns a session token, creating an anonymous one on first use. */
export async function ensureToken(): Promise<string> {
  if (typeof window === 'undefined') return '';
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const res = await fetch(`${API_URL}/auth/anonymous`, { method: 'POST' });
  if (!res.ok) throw new Error('Could not start a session');
  const { token } = (await res.json()) as { token: string };
  localStorage.setItem(KEY, token);
  return token;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEY);
}

/** The signed-in Google user, or null for anonymous/guest sessions. */
export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isSignedIn(): boolean {
  return !!getUser()?.email;
}

/**
 * Exchange a Google ID token for our session token. Passes the current
 * anonymous token so the new account adopts any work done as a guest.
 */
export async function googleLogin(credential: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential, anonToken: getToken() ?? undefined }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { message?: string }).message ?? 'Sign-in failed');
  }
  const { token, user } = (await res.json()) as { token: string; user: AuthUser };
  localStorage.setItem(KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

/** Drop the current session; a fresh anonymous token is minted on next use. */
export function signOut(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(USER_KEY);
}
