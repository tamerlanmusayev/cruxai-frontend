'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LANGS, useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useOnline } from '@/lib/socket';
import { UsageStatus, getUsage } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import DemoVideo from '@/components/DemoVideo';

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ??
  'https://github.com/tamerlanmusayev/cruxai-frontend';
// Buy Me a Coffee page (claim the handle / override via env to your own).
const DONATE_URL =
  process.env.NEXT_PUBLIC_DONATE_URL ?? 'https://www.buymeacoffee.com/tamerlanmusayev';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useT();
  const { theme, toggle } = useTheme();
  const online = useOnline();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);
  const currentLang = LANGS.find((l) => l.code === lang) ?? LANGS[2];

  // Close the mobile drawer / language menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
    setLangOpen(false);
  }, [pathname]);

  // Refresh today's generation quota on every navigation (cheap; reflects a
  // just-created note when the user lands on /doc/:id or /library).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await ensureToken();
        const u = await getUsage();
        if (!cancelled) setUsage(u);
      } catch {
        /* non-critical — quota chip just stays hidden */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  // Keep the browser tab title in sync with the current page.
  useEffect(() => {
    const map: Record<string, string> = {
      '/library': t('lib.title'),
      '/review': t('fc.review'),
      '/progress': t('progress.title'),
      '/synthesis': t('syn.title'),
      '/stats': t('nav.stats'),
      '/privacy': 'Privacy',
      '/terms': 'Terms',
    };
    let section: string | undefined;
    if (pathname === '/') section = undefined;
    else if (pathname.startsWith('/doc')) section = t('doc.notes');
    else section = map[pathname];
    document.title = section
      ? `${section} · CruxAI`
      : 'CruxAI — master any book with AI';
  }, [pathname, lang, t]);

  // Primary navigation (the core flow). Stats lives separately at the bottom.
  const mainLinks = [
    { href: '/library', label: t('nav.library'), icon: '📚' },
    { href: '/review', label: t('nav.review'), icon: '🔁' },
    { href: '/progress', label: t('nav.progress'), icon: '📈' },
    { href: '/synthesis', label: t('nav.synthesis'), icon: '🧬' },
  ];

  const navLinkClass = (href: string) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
      isActive(href)
        ? 'bg-[var(--surface-2)] font-semibold text-[var(--text)]'
        : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
    }`;

  // Shared sidebar body (logo → CTA → nav → Stats → footer).
  const SidebarBody = (
    <div className="flex min-h-full flex-col">
      <Link href="/" className="flex items-center gap-2 px-3 text-xl font-bold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm shadow-glow">
          ✦
        </span>
        <span className="grad-text">CruxAI</span>
      </Link>

      {online > 0 && (
        <span className="mt-3 flex items-center gap-1.5 px-3 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          {online} online
        </span>
      )}

      <Link
        href="/"
        className="btn-glow mt-6 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold"
      >
        <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M10 4v12M4 10h12" />
        </svg>
        <span>{t('nav.new')}</span>
      </Link>

      <nav className="mt-4 flex flex-1 flex-col gap-1">
        {mainLinks.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            aria-current={isActive(l.href) ? 'page' : undefined}
            className={navLinkClass(l.href)}
          >
            <span aria-hidden className="text-base">{l.icon}</span>
            <span>{l.label}</span>
          </Link>
        ))}
      </nav>

      {/* secondary — not part of the main flow */}
      <Link
        href="/stats"
        aria-current={isActive('/stats') ? 'page' : undefined}
        className={`mb-3 ${navLinkClass('/stats')}`}
      >
        <span aria-hidden className="text-base">📊</span>
        <span>{t('nav.stats')}</span>
      </Link>

      {usage && (
        <div className="mb-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">{t('usage.label')}</span>
            <span
              className={`font-semibold tabular-nums ${
                usage.remaining <= 3 ? 'text-amber-400' : 'text-[var(--text)]'
              }`}
            >
              {usage.remaining}/{usage.limit}
            </span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
              style={{ width: `${Math.max(0, (usage.remaining / usage.limit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2 border-t border-[var(--border)] pt-3">
        {/* language dropdown */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={langOpen}
            className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
          >
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
            </svg>
            <span className="text-[var(--text)]">{currentLang.native}</span>
            <span className={`ml-auto text-xs transition ${langOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {langOpen && (
            <div
              role="listbox"
              className="absolute bottom-full left-0 right-0 z-20 mb-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1 shadow-2xl"
            >
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  role="option"
                  aria-selected={lang === l.code}
                  onClick={() => {
                    setLang(l.code);
                    setLangOpen(false);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                    lang === l.code
                      ? 'bg-[var(--surface-2)] font-semibold text-[var(--text)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]'
                  }`}
                >
                  <span className="w-7 text-xs font-semibold opacity-70">{l.label}</span>
                  <span>{l.native}</span>
                  {lang === l.code && <span className="ml-auto text-brand">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* buy me a coffee — the one accent action */}
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-400/15"
        >
          <span>☕</span>
          <span>{t('support.donate')}</span>
        </a>

        {/* compact icon row: theme + GitHub */}
        <div className="flex gap-2">
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            className="grid h-9 flex-1 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
          >
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
              </svg>
            )}
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
            title="GitHub"
            className="grid h-9 flex-1 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
          >
            <svg viewBox="0 0 16 16" width="17" height="17" fill="currentColor" aria-hidden>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>

        {/* tagline + legal — one quiet line */}
        <p className="px-1 pt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
          <Link href="/privacy" className="hover:text-[var(--text)]">Privacy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-[var(--text)]">Terms</Link>
          {' · '}
          {t('footer.tagline')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)]/80 px-3 py-6 backdrop-blur-xl md:block">
        {SidebarBody}
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--bg)]/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm shadow-glow">
            ✦
          </span>
          <span className="grad-text">CruxAI</span>
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-muted)]"
        >
          {open ? '✕' : '☰'}
        </button>
      </header>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto border-r border-[var(--border)] bg-[var(--bg)] px-3 py-6">
            {SidebarBody}
          </aside>
        </div>
      )}

      <main
        key={pathname}
        className="page-enter mx-auto w-full max-w-4xl px-4 pb-6 pt-8 sm:px-5 sm:pt-10"
      >
        {children}
      </main>
      <DemoVideo />
    </div>
  );
}
