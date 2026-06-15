'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import Link from 'next/link';
import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';
import { ensureToken } from './auth';
import { useT } from './i18n';

interface DocReady {
  id: string;
  title: string;
}

const SocketCtx = createContext<{ online: number }>({ online: 0 });

let socket: Socket | null = null;
let lastOnline = 0; // cached so late-mounting components show the count immediately

/**
 * One shared socket for the whole app: live presence count + "your notes are
 * ready" notifications (delivered to the user's room while they browse).
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const [online, setOnline] = useState(lastOnline);
  const [toasts, setToasts] = useState<DocReady[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await ensureToken().catch(() => '');
      if (!active) return;
      if (!socket) {
        socket = io(API_URL, {
          transports: ['websocket', 'polling'],
          auth: { token },
        });
      }
      const onCount = (n: number) => {
        lastOnline = n;
        setOnline(n);
      };
      const onReady = (d: DocReady) => setToasts((prev) => [...prev, d]);
      socket.on('online', onCount);
      socket.on('doc:ready', onReady);
      // Pull current values immediately for late mounts.
      setOnline(lastOnline);
    })();
    return () => {
      active = false;
    };
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <SocketCtx.Provider value={{ online }}>
      {children}
      {/* "ready" toasts — appear even while browsing other pages */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((d) => (
          <Link
            key={d.id}
            href={`/doc/${d.id}`}
            onClick={() => dismiss(d.id)}
            className="glass flex max-w-xs items-center gap-3 rounded-xl px-4 py-3 shadow-glow transition hover:scale-[1.02] animate-[hiw-rise_0.3s_ease-out]"
          >
            <span className="text-xl">✅</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{t('notify.ready')}</span>
              <span className="block truncate text-xs text-[var(--text-muted)]">
                {d.title} · {t('notify.open')}
              </span>
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                dismiss(d.id);
              }}
              className="ml-1 text-[var(--text-muted)] hover:text-[var(--text)]"
              aria-label="dismiss"
            >
              ✕
            </button>
          </Link>
        ))}
      </div>
    </SocketCtx.Provider>
  );
}

export const useOnline = () => useContext(SocketCtx).online;
