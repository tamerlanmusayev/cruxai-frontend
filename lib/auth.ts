import { API_URL } from './api';

const KEY = 'cruxai_token';

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
