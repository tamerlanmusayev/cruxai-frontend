'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AuthUser, getUser, googleLogin, signOut, telegramLogin } from './auth';
import { useT } from './i18n';
import Modal from '@/components/Modal';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';
const GIS_SRC = 'https://accounts.google.com/gsi/client';
const TG_BOT = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? '';

interface AuthContextValue {
  user: AuthUser | null;
  signedIn: boolean;
  /** Open the Google sign-in modal; runs `onSuccess` after a successful login. */
  openLogin: (onSuccess?: () => void) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

// Minimal typing for the Google Identity Services global.
interface GoogleId {
  accounts: {
    id: {
      initialize: (cfg: {
        client_id: string;
        callback: (r: { credential: string }) => void;
      }) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleId;
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

let gisPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google sign-in'));
    document.head.appendChild(s);
  });
  return gisPromise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [open, setOpen] = useState(false);
  const onSuccessRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setUser(getUser());
  }, []);

  const openLogin = useCallback((onSuccess?: () => void) => {
    onSuccessRef.current = onSuccess ?? null;
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    onSuccessRef.current = null;
  }, []);

  const logout = useCallback(() => {
    signOut();
    setUser(null);
  }, []);

  const handleSuccess = useCallback((u: AuthUser) => {
    setUser(u);
    setOpen(false);
    const cb = onSuccessRef.current;
    onSuccessRef.current = null;
    if (cb) cb();
  }, []);

  return (
    <AuthContext.Provider value={{ user, signedIn: !!user?.email, openLogin, logout }}>
      {children}
      {open && <LoginModal onClose={close} onSuccess={handleSuccess} />}
    </AuthContext.Provider>
  );
}

function LoginModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (u: AuthUser) => void;
}) {
  const { t } = useT();
  const btnRef = useRef<HTMLDivElement>(null);
  const tgRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Google Identity Services button.
  useEffect(() => {
    if (!CLIENT_ID || !btnRef.current) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !window.google || !btnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            setBusy(true);
            setError(null);
            try {
              onSuccess(await googleLogin(credential));
            } catch (e) {
              setError((e as Error).message);
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(btnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          width: 280,
        });
      })
      .catch((e) => setError((e as Error).message));
    return () => {
      cancelled = true;
    };
  }, [onSuccess]);

  // Telegram login widget (renders Telegram's own button + global callback).
  useEffect(() => {
    if (!TG_BOT || !tgRef.current) return;
    window.onTelegramAuth = async (user) => {
      setBusy(true);
      setError(null);
      try {
        onSuccess(await telegramLogin(user));
      } catch (e) {
        setError((e as Error).message);
        setBusy(false);
      }
    };
    const s = document.createElement('script');
    s.src = 'https://telegram.org/js/telegram-widget.js?22';
    s.async = true;
    s.setAttribute('data-telegram-login', TG_BOT);
    s.setAttribute('data-size', 'large');
    s.setAttribute('data-radius', '10');
    s.setAttribute('data-onauth', 'onTelegramAuth(user)');
    tgRef.current.appendChild(s);
    return () => {
      delete window.onTelegramAuth;
    };
  }, [onSuccess]);

  const nothingConfigured = !CLIENT_ID && !TG_BOT;

  return (
    <Modal onClose={onClose} className="max-w-sm">
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-2xl">
          🔐
        </div>
        <h2 className="text-lg font-bold text-ink">{t('auth.title')}</h2>
        <p className="mt-1.5 text-sm text-[var(--text-muted)]">{t('auth.hint')}</p>

        <div className="mt-6 flex min-h-[44px] flex-col items-center gap-3">
          {CLIENT_ID && <div ref={btnRef} />}
          {TG_BOT && <div ref={tgRef} />}
          {busy && <span className="text-sm text-[var(--text-muted)]">…</span>}
        </div>

        {nothingConfigured ? (
          <p className="mt-4 text-xs text-amber-400">{t('auth.notConfigured')}</p>
        ) : (
          error && error !== 'not-configured' && (
            <p className="mt-4 text-xs text-red-400">{error}</p>
          )
        )}

        <p className="mt-5 text-[11px] leading-relaxed text-[var(--text-muted)]">
          {t('auth.privacy')}
        </p>
      </div>
    </Modal>
  );
}
