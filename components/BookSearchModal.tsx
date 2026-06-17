'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookHit, BookRecommendation, getBooksCount, recommendBooks, searchBooks } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import LiveTokens from '@/components/LiveTokens';
import Modal from '@/components/Modal';
import { useT } from '@/lib/i18n';

type Tab = 'books' | 'link' | 'ai';

interface Props {
  onClose: () => void;
  onUse: (source: { url: string; name: string }) => void;
  onOverview: (title: string) => void;
  initialTab?: Tab;
}

const DEBOUNCE_MS = 500;
const MIN_QUERY = 2;

export default function BookSearchModal({ onClose, onUse, onOverview, initialTab = 'books' }: Props) {
  const { t, lang } = useT();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<BookHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [count, setCount] = useState(0);
  const [link, setLink] = useState('');

  // AI recommend
  const [topic, setTopic] = useState('');
  const [recs, setRecs] = useState<BookRecommendation[] | null>(null);
  const [recBusy, setRecBusy] = useState(false);

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

  // Lazy search: fire only after the user pauses typing.
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

  async function doRecommend() {
    if (topic.trim().length < 3 || recBusy) return;
    setRecBusy(true);
    try {
      await ensureToken();
      setRecs(await recommendBooks(topic.trim(), lang));
    } catch {
      setRecs([]);
    } finally {
      setRecBusy(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'books', label: `📚 ${t('books.search')}` },
    { key: 'ai', label: `✨ ${t('rec.tab')}` },
    { key: 'link', label: `🔗 ${t('link.import')}` },
  ];

  return (
    <Modal onClose={onClose} className="max-w-2xl">
      <div className="mb-4 inline-flex rounded-xl border border-[var(--border)] p-1 text-sm">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`rounded-lg px-3 py-1.5 font-medium ${tab === tb.key ? 'bg-[var(--surface-2)]' : 'text-[var(--text-muted)]'}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'books' && (
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
              <div
                key={b.id}
                className="flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-white/5"
              >
                {b.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.cover} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="grid h-36 w-full place-items-center text-3xl">📘</div>
                )}
                <div className="flex flex-1 flex-col p-2">
                  <p className="line-clamp-2 text-xs font-semibold">{b.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-[var(--text-muted)]">{b.author}</p>
                  {b.textUrl ? (
                    <button
                      onClick={() => onUse({ url: b.textUrl!, name: `${b.title}.txt` })}
                      className="mt-auto rounded-lg bg-brand/15 px-2 py-1 text-[11px] font-medium text-brand hover:bg-brand/25"
                    >
                      {t('books.use')} →
                    </button>
                  ) : (
                    <button
                      onClick={() => onOverview(b.title)}
                      className="mt-auto rounded-lg border border-[var(--border)] px-2 py-1 text-[11px] font-medium text-[var(--text-muted)] hover:border-brand hover:text-[var(--text)]"
                    >
                      {t('books.overview')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'ai' && (
        <>
          <p className="mb-3 text-sm text-[var(--text-muted)]">{t('rec.hint')}</p>
          <div className="flex gap-2">
            <input
              autoFocus
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doRecommend()}
              placeholder={t('rec.placeholder')}
              className="flex-1 rounded-lg border border-[var(--border)] bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button onClick={doRecommend} disabled={recBusy} className="btn-glow rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50">
              {recBusy ? '…' : t('rec.go')}
            </button>
          </div>

          <div className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
            {recBusy && (
              <div className="space-y-1">
                <p className="text-sm text-[var(--text-muted)]">{t('rec.thinking')}</p>
                <LiveTokens />
              </div>
            )}
            {!recBusy && recs?.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">{t('books.none')}</p>
            )}
            {recs?.map((r, i) => (
              <div key={i} className="flex gap-3 rounded-xl border border-[var(--border)] bg-white/5 p-3">
                {r.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={r.cover} alt="" className="h-20 w-14 shrink-0 rounded object-cover" />
                ) : (
                  <div className="grid h-20 w-14 shrink-0 place-items-center rounded bg-[var(--surface-2)] text-xl">📘</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{r.author}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{r.why}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.textUrl && (
                      <button
                        onClick={() => onUse({ url: r.textUrl!, name: `${r.title}.txt` })}
                        className="rounded-lg bg-brand/15 px-3 py-1 text-xs font-medium text-brand hover:bg-brand/25"
                      >
                        {t('books.use')} →
                      </button>
                    )}
                    <button
                      onClick={() => onOverview(r.title)}
                      className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--text-muted)] hover:border-brand hover:text-[var(--text)]"
                    >
                      {t('books.overview')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'link' && (
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
