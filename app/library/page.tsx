'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LIBRARY_PAGE, LibraryItem, getLibrary, deleteDocument } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';
import Modal from '@/components/Modal';

export default function LibraryPage() {
  const { t } = useT();
  const { signedIn, openLogin } = useAuth();
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pending, setPending] = useState<LibraryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // The library only exists for signed-in users (generation requires sign-in),
  // so an anonymous visitor would always see an empty list — prompt to sign in.
  useEffect(() => {
    if (!signedIn) return;
    (async () => {
      try {
        await ensureToken();
        const first = await getLibrary(0, LIBRARY_PAGE);
        setItems(first);
        setHasMore(first.length === LIBRARY_PAGE);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, [signedIn]);

  async function loadMore() {
    if (!items) return;
    setLoadingMore(true);
    try {
      const next = await getLibrary(items.length, LIBRARY_PAGE);
      setItems([...items, ...next]);
      setHasMore(next.length === LIBRARY_PAGE);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  async function confirmDelete() {
    if (!pending) return;
    setDeleting(true);
    try {
      await deleteDocument(pending.id);
      setItems((prev) => (prev ? prev.filter((x) => x.id !== pending.id) : prev));
      setPending(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">
        {t('lib.title')}
      </h1>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {!signedIn ? (
        <div className="glass mt-8 p-10 text-center">
          <p className="text-slate-400">{t('lib.signInPrompt')}</p>
          <button
            onClick={() => openLogin()}
            className="btn-glow mt-5 inline-block rounded-lg px-6 py-3 font-medium"
          >
            {t('auth.signIn')}
          </button>
        </div>
      ) : (
        <>
          {!items && !error && (
            <div className="glass mt-8 flex items-center justify-center gap-3 p-10 text-sm text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-brand" />
              {t('common.loading')}
            </div>
          )}

          {items && items.length === 0 && (
            <div className="glass mt-8 p-10 text-center">
              <p className="text-slate-400">{t('lib.empty')}</p>
              <Link href="/" className="btn-glow mt-5 inline-block rounded-lg px-6 py-3 font-medium">
                {t('lib.upload')}
              </Link>
            </div>
          )}

          <ul className="mt-8 space-y-3">
            {items?.map((d) => (
              <li
                key={d.id}
                className="glass group relative flex items-center gap-3 p-4 transition hover:border-white/25"
              >
                {/* full-row click target → open the note */}
                <Link href={`/doc/${d.id}`} aria-label={d.title} className="absolute inset-0 rounded-[inherit]" />
                <span aria-hidden>📓</span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{d.title}</span>
                {d.language && (
                  <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs uppercase text-slate-500">
                    {d.language}
                  </span>
                )}
                <StatusBadge status={d.status} />
                <button
                  onClick={() => setPending(d)}
                  aria-label={t('lib.delete')}
                  title={t('lib.delete')}
                  className="relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-red-500/15 hover:text-red-400"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M10 11v6M14 11v6" />
                  </svg>
                </button>
                {/* affordance: this row is clickable */}
                <svg
                  viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden
                  className="shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-brand"
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </li>
            ))}
          </ul>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/25 disabled:opacity-50"
              >
                {loadingMore ? '…' : t('lib.more')}
              </button>
            </div>
          )}
        </>
      )}

      {pending && (
        <Modal onClose={() => !deleting && setPending(null)}>
          <h2 className="text-lg font-bold text-ink">{t('lib.deleteTitle')}</h2>
          <p className="mt-2 text-sm text-slate-400">
            {t('lib.deleteBody').replace('{title}', pending.title)}
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setPending(null)}
              disabled={deleting}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-lg bg-red-500/90 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {deleting ? '…' : t('lib.delete')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    READY: 'text-emerald-400',
    PROCESSING: 'text-amber-400',
    FAILED: 'text-red-400',
  };
  return <span className={map[status] ?? 'text-slate-400'}>{status.toLowerCase()}</span>;
}
