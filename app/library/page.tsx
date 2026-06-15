'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LIBRARY_PAGE, LibraryItem, getLibrary } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useT } from '@/lib/i18n';

export default function LibraryPage() {
  const { t } = useT();
  const [items, setItems] = useState<LibraryItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

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

  return (
    <div>
      <h1 className="text-3xl font-extrabold">
        {t('lib.title')}
      </h1>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

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
          <li key={d.id}>
            <Link
              href={`/doc/${d.id}`}
              className="glass flex items-center justify-between p-4 transition hover:border-white/25"
            >
              <span className="flex items-center gap-3">
                <span>📓</span>
                <span className="font-medium text-ink">{d.title}</span>
              </span>
              <span className="flex items-center gap-3 text-xs text-slate-500">
                {d.language && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 uppercase">
                    {d.language}
                  </span>
                )}
                <StatusBadge status={d.status} />
              </span>
            </Link>
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
