'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookHit, getBooksCount, searchBooks } from '@/lib/api';
import Modal from '@/components/Modal';
import { useT } from '@/lib/i18n';

interface Props {
  onClose: () => void;
  onUse: (source: { url: string; name: string }) => void;
  initialTab?: 'books' | 'link';
}

const DEBOUNCE_MS = 500;
const MIN_QUERY = 2;

export default function BookSearchModal({ onClose, onUse, initialTab = 'books' }: Props) {
  const { t } = useT();
  const [tab, setTab] = useState<'books' | 'link'>(initialTab);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<BookHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [count, setCount] = useState(0);
  const [link, setLink] = useState('');

  useEffect(() => {
    getBooksCount().then(setCount).catch(() => {});
  }, []);

  const doSearch = useCallback(async (query: string) => {
    const term = query.trim();
    if (term.length < MIN_QUERY) {
      setHits([]);
      setSearched(false);
      return;
    }
    setSearching(true);
    setSearched(true);
    try {
      setHits(await searchBooks(term));
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Lazy search: fire only after the user pauses typing; each keystroke
  // resets the timer, so it never fires mid-typing.
  useEffect(() => {
    if (tab !== 'books') return;
    const id = setTimeout(() => doSearch(q), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [q, tab, doSearch]);

  function importLink() {
    const url = link.trim();
    if (!url) return;
    const name = url.split('/').pop()?.split('?')[0] || 'link';
    onUse({ url, name });
  }

  return (
    <Modal onClose={onClose} className="max-w-2xl">
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
                onKeyDown={(e) => e.key === 'Enter' && doSearch(q)}
                placeholder={t('books.placeholder')}
                className="flex-1 rounded-lg border border-[var(--border)] bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button onClick={() => doSearch(q)} className="btn-glow rounded-lg px-5 py-2.5 text-sm font-medium">
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
    </Modal>
  );
}
