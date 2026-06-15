'use client';

import { useEffect, useState } from 'react';
import { BookHit, getBooksCount, searchBooks } from '@/lib/api';
import { useT } from '@/lib/i18n';

interface Props {
  onClose: () => void;
  onUse: (source: { url: string; name: string }) => void;
}

export default function BookSearchModal({ onClose, onUse }: Props) {
  const { t } = useT();
  const [tab, setTab] = useState<'books' | 'link'>('books');
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<BookHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [count, setCount] = useState(0);
  const [link, setLink] = useState('');

  useEffect(() => {
    getBooksCount().then(setCount).catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function doSearch() {
    if (!q.trim()) return;
    setSearching(true);
    setSearched(true);
    try {
      setHits(await searchBooks(q));
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }

  function importLink() {
    const url = link.trim();
    if (!url) return;
    const name = url.split('/').pop()?.split('?')[0] || 'link';
    onUse({ url, name });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="glass relative w-full max-w-2xl p-6 animate-[hiw-rise_0.25s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="close"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-white/10 hover:text-[var(--text)]"
        >
          ✕
        </button>

        {/* tabs */}
        <div className="mb-4 inline-flex rounded-xl border border-[var(--border)] p-1 text-sm">
          <button
            onClick={() => setTab('books')}
            className={`rounded-lg px-3 py-1.5 font-medium ${tab === 'books' ? 'bg-[var(--surface-2)]' : 'text-[var(--text-muted)]'}`}
          >
            📚 {t('books.search')}
          </button>
          <button
            onClick={() => setTab('link')}
            className={`rounded-lg px-3 py-1.5 font-medium ${tab === 'link' ? 'bg-[var(--surface-2)]' : 'text-[var(--text-muted)]'}`}
          >
            🔗 {t('link.import')}
          </button>
        </div>

        {tab === 'books' ? (
          <>
            {count > 0 && (
              <p className="mb-3 text-sm text-[var(--text-muted)]">
                {t('books.count', { n: count.toLocaleString() })}
              </p>
            )}
            <div className="flex gap-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                placeholder={t('books.placeholder')}
                className="flex-1 rounded-lg border border-[var(--border)] bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button onClick={doSearch} className="btn-glow rounded-lg px-5 py-2.5 text-sm font-medium">
                {t('books.go')}
              </button>
            </div>

            <div className="mt-4 grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
              {searching && <p className="col-span-full text-sm text-[var(--text-muted)]">{t('books.searching')}</p>}
              {!searching && searched && hits.length === 0 && (
                <p className="col-span-full text-sm text-[var(--text-muted)]">{t('books.none')}</p>
              )}
              {hits.map((b) => (
                <button
                  key={b.id}
                  disabled={!b.textUrl}
                  onClick={() => b.textUrl && onUse({ url: b.textUrl, name: `${b.title}.txt` })}
                  className="group flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white/5 text-left transition hover:border-brand disabled:opacity-40"
                >
                  {b.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.cover} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="grid h-40 w-full place-items-center text-3xl">📘</div>
                  )}
                  <div className="p-2">
                    <p className="line-clamp-2 text-xs font-semibold">{b.title}</p>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-muted)]">{b.author}</p>
                    <span className="mt-1 inline-block text-[11px] font-medium text-brand opacity-0 transition group-hover:opacity-100">
                      {t('books.use')} →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div>
            <p className="mb-3 text-sm text-[var(--text-muted)]">{t('link.hint')}</p>
            <div className="flex gap-2">
              <input
                autoFocus
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && importLink()}
                placeholder={t('link.placeholder')}
                className="flex-1 rounded-lg border border-[var(--border)] bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button onClick={importLink} className="btn-glow rounded-lg px-5 py-2.5 text-sm font-medium">
                {t('link.go')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
