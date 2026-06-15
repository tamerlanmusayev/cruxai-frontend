'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { createFromSources, overviewBook, uploadFiles } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { getRecaptchaToken } from '@/lib/recaptcha';
import { LANGS, Lang, useT } from '@/lib/i18n';
import HowItWorksDemo from '@/components/HowItWorksDemo';
import BookSearchModal from '@/components/BookSearchModal';
import ReviewsSection from '@/components/ReviewsSection';
import Modal from '@/components/Modal';

const MAX_TOTAL_MB = 40;
const MAX_FILES = 20;
const ALLOWED = ['pdf', 'docx', 'txt', 'md'];
const ACCEPTED = '.pdf,.docx,.txt,.md';
const COMPRESS_URL = 'https://www.ilovepdf.com/compress_pdf';

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '';
}

/** Human-readable size that doesn't collapse small files to "0.0 MB". */
function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function HomePage() {
  const router = useRouter();
  const { t, lang } = useT();
  const { signedIn, openLogin } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [askLang, setAskLang] = useState(false);
  const [modalLang, setModalLang] = useState<Lang>(lang);
  const [showBooks, setShowBooks] = useState(false);
  const [booksTab, setBooksTab] = useState<'books' | 'link'>('books');
  // a picked book / pasted link / AI-overview awaiting a notes-language choice
  type Pending =
    | { kind: 'source'; url: string; name: string; label: string }
    | { kind: 'overview'; title: string; label: string };
  const [pending, setPending] = useState<Pending | null>(null);


  const valid = files.filter((f) => ALLOWED.includes(extOf(f.name)));
  const invalid = files.filter((f) => !ALLOWED.includes(extOf(f.name)));
  const validMb = valid.reduce((s, f) => s + f.size, 0) / 1024 / 1024;
  const overLimit = validMb > MAX_TOTAL_MB || valid.length > MAX_FILES;
  const canStart = valid.length > 0 && !overLimit;

  const features = [
    { icon: '📓', label: t('home.f.summary') },
    { icon: '🔊', label: t('home.f.audio') },
    { icon: '🧠', label: t('home.f.quiz') },
    { icon: '📎', label: t('home.f.citations') },
  ];

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    setError(null);
    const names = new Set(files.map((f) => f.name + f.size));
    const next = [...files];
    for (const f of Array.from(incoming)) {
      if (!names.has(f.name + f.size)) next.push(f);
    }
    const capped = next.slice(0, MAX_FILES);
    setFiles(capped);

    const v = capped.filter((f) => ALLOWED.includes(extOf(f.name)));
    const mb = v.reduce((s, f) => s + f.size, 0) / 1024 / 1024;
    if (v.length > 0 && mb <= MAX_TOTAL_MB && !busy) {
      setModalLang(lang);
      setAskLang(true);
    }
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  // A book/link/overview was picked — ask the notes language before creating.
  function pickSource(source: { url: string; name: string }) {
    setShowBooks(false);
    setPending({ kind: 'source', ...source, label: source.name });
    setModalLang(lang);
    setAskLang(true);
  }

  function pickOverview(title: string) {
    setShowBooks(false);
    setPending({ kind: 'overview', title, label: `✨ ${title}` });
    setModalLang(lang);
    setAskLang(true);
  }

  function closeAskLang() {
    setAskLang(false);
    setPending(null);
  }

  async function submitWith(notesLang: Lang) {
    if (!pending && !canStart) return;
    // Generation costs AI tokens — require a real account first (variant 1:
    // browse freely as a guest, sign in only at the moment of generating).
    if (!signedIn) {
      setAskLang(false);
      openLogin(() => {
        void submitWith(notesLang);
      });
      return;
    }
    setAskLang(false);
    setBusy(true);
    setError(null);
    try {
      const authToken = await ensureToken();
      const captcha = await getRecaptchaToken('upload');
      const { id } =
        pending?.kind === 'overview'
          ? await overviewBook(pending.title, authToken, notesLang, captcha)
          : pending?.kind === 'source'
            ? await createFromSources(
                [{ url: pending.url, name: pending.name }],
                authToken,
                notesLang,
                captcha,
              )
            : await uploadFiles(valid, authToken, notesLang, captcha);
      setPending(null);
      router.push(`/doc/${id}`);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="text-center">
      <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {t('home.badge')}
      </div>

      <h1 className="mx-auto max-w-2xl text-4xl font-extrabold leading-tight sm:text-6xl">
        <span className="grad-text">{t('home.title')}</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
        {t('home.subtitle')}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {features.map((f) => (
          <span
            key={f.label}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300"
          >
            {f.icon} {f.label}
          </span>
        ))}
      </div>

      <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-medium text-emerald-300">
        🆓 {t('free.badge')}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`glass mx-auto mt-8 max-w-xl cursor-pointer p-12 transition ${
          dragging ? 'ring-2 ring-brand' : 'hover:border-white/20'
        } ${busy ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        {busy ? (
          <p className="font-medium text-brand">{t('home.uploading')}</p>
        ) : (
          <>
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-fuchsia-500/30 text-2xl">
              ⬆
            </div>
            <p className="text-lg font-medium">{t('home.drop')}</p>
            <p className="mt-1 text-sm text-slate-500">
              {t('home.dropHint', { files: MAX_FILES, mb: MAX_TOTAL_MB })}
            </p>
          </>
        )}
      </div>

      <div className="mx-auto mt-4 flex max-w-xl items-center gap-3 text-sm text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        {t('home.or')}
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => {
            setBooksTab('books');
            setShowBooks(true);
          }}
          disabled={busy}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 disabled:opacity-50"
        >
          📚 {t('books.search')}
        </button>
        <button
          onClick={() => {
            setBooksTab('link');
            setShowBooks(true);
          }}
          disabled={busy}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/25 disabled:opacity-50"
        >
          🔗 {t('link.import')}
        </button>
      </div>

      {files.length > 0 && (
        <div className="glass mx-auto mt-5 max-w-xl p-4 text-left">
          <ul className="space-y-1 text-sm">
            {files.map((f, i) => {
              const bad = !ALLOWED.includes(extOf(f.name));
              return (
                <li key={f.name + i} className="flex items-center justify-between gap-3">
                  <span className={`truncate ${bad ? 'text-red-400' : 'text-slate-300'}`}>
                    {bad ? '⚠️' : '📄'} {f.name}
                    {bad && (
                      <span className="ml-1 text-xs text-red-400">
                        · {t('home.unsupported')}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 text-slate-500">
                    {humanSize(f.size)}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="hover:text-red-400"
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm">
            <span className={overLimit ? 'font-medium text-red-400' : 'text-slate-400'}>
              {humanSize(valid.reduce((s, f) => s + f.size, 0))} / {MAX_TOTAL_MB} MB
            </span>
            <button
              onClick={() => {
                setModalLang(lang);
                setAskLang(true);
              }}
              disabled={busy || !canStart}
              className="btn-glow rounded-lg px-5 py-2 font-medium disabled:opacity-50"
            >
              {busy ? t('home.working') : t('home.continue')}
            </button>
          </div>
          {overLimit && (
            <p className="mt-2 text-xs text-red-400">
              {t('home.over')}{' '}
              <a href={COMPRESS_URL} target="_blank" rel="noreferrer" className="underline">
                {t('home.compress')}
              </a>
            </p>
          )}
          {valid.length === 0 && (
            <p className="mt-2 text-xs text-red-400">{t('home.noValid')}</p>
          )}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <details className="mx-auto mt-6 max-w-xl text-left text-sm text-slate-400">
        <summary className="cursor-pointer select-none text-center text-xs text-slate-500 hover:text-slate-300">
          {t('home.tips.title')}
        </summary>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>{t('home.tips.1')}</li>
          <li>{t('home.tips.2')}</li>
          <li>{t('home.tips.3')}</li>
          <li>{t('home.tips.4', { mb: MAX_TOTAL_MB })}</li>
        </ul>
      </details>

      <HowItWorksDemo />

      <ReviewsSection />

      {showBooks && (
        <BookSearchModal
          initialTab={booksTab}
          onClose={() => setShowBooks(false)}
          onUse={pickSource}
          onOverview={pickOverview}
        />
      )}

      {/* language popup — shown before any import (files, book, or link) */}
      {askLang && (
        <Modal onClose={closeAskLang}>
          <div className="text-center">
            <p className="text-lg font-semibold">{t('home.notesLang')}</p>
            <p className="mt-1 text-sm text-slate-400">{t('home.notesLangHint')}</p>

            {pending && (
              <p className="mt-3 truncate rounded-lg bg-white/5 px-3 py-2 text-xs text-slate-300">
                📖 {pending.label}
              </p>
            )}

            {invalid.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left text-xs text-amber-200">
                ⚠️ {t('home.willSkip', { n: invalid.length })}
                <span className="text-amber-300/80"> {invalid.map((f) => f.name).join(', ')}</span>
              </div>
            )}

            <div className="mt-5 grid grid-cols-3 gap-3">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setModalLang(l.code)}
                  aria-pressed={modalLang === l.code}
                  className={`rounded-xl border px-4 py-4 text-lg font-bold transition hover:border-brand ${
                    modalLang === l.code
                      ? 'border-brand bg-brand/10 text-ink'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => submitWith(modalLang)}
              disabled={busy || (!pending && !canStart)}
              className="btn-glow mt-5 w-full rounded-lg px-5 py-3 font-medium disabled:opacity-50"
            >
              {busy
                ? t('home.working')
                : pending
                  ? t('home.start')
                  : invalid.length > 0
                    ? t('home.startWithout', { n: valid.length })
                    : t('home.start')}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
