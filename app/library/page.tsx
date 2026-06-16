'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LIBRARY_PAGE, LibraryItem, getLibrary, deleteDocument } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import Modal from '@/components/Modal';

export default function LibraryPage() {
  const { t } = useT();
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [pending, setPending] = useState<LibraryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
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
  }, []);

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
            className="glass flex items-center justify-between p-4 transition hover:border-white/25"
          >
            <Link href={`/doc/${d.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              <span>📓</span>
              <span className="truncate font-medium text-ink">{d.title}</span>
            </Link>
            <span className="ml-3 flex shrink-0 items-center gap-3 text-xs text-slate-500">
              {d.language && (
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 uppercase">
                  {d.language}
                </span>
              )}
              <StatusBadge status={d.status} />
              <button
                onClick={() => setPending(d)}
                aria-label={t('lib.delete')}
                title={t('lib.delete')}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-red-500/15 hover:text-red-400"
              >
                🗑
              </button>
            </span>
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
