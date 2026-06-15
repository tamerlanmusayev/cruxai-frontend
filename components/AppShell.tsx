'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LANGS, useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useOnline } from '@/lib/socket';
import DemoVideo from '@/components/DemoVideo';

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ??
  'https://github.com/tamerlanmusayev/cruxai-frontend';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useT();
  const { theme, toggle } = useTheme();
  const online = useOnline();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  // Keep the browser tab title in sync with the current page.
  useEffect(() => {
    const map: Record<string, string> = {
      '/library': t('lib.title'),
      '/review': t('fc.review'),
      '/progress': t('progress.title'),
      '/synthesis': t('syn.title'),
      '/stats': t('nav.stats'),
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

  const LangSwitcher = (
    <div className="inline-flex w-fit overflow-hidden rounded-lg border border-[var(--border)]">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 text-xs font-medium transition ${
            lang === l.code
              ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  // Shared sidebar body (logo → CTA → nav → Stats → footer).
  const SidebarBody = (
    <div className="flex h-full flex-col">
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

      <div className="space-y-2.5 border-t border-[var(--border)] pt-4">
        {/* language segmented control */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                lang === l.code
                  ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-glow'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* theme toggle */}
        <button
          onClick={toggle}
          className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
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
          <span>{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>
        </button>

        {/* GitHub */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        >
          <svg viewBox="0 0 16 16" width="17" height="17" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span>GitHub</span>
          <span className="ml-auto text-[var(--text-muted)] transition group-hover:text-[var(--text)]">↗</span>
        </a>

        {/* tagline */}
        <p className="px-1 pt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
          <span className="grad-text font-semibold">CruxAI</span> · {t('footer.tagline')}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--border)] bg-[var(--bg)]/80 px-3 py-6 backdrop-blur-xl md:block">
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
        <div className="flex items-center gap-2">
          {LangSwitcher}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-muted)]"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-[var(--border)] bg-[var(--bg)] px-3 py-6">
            {SidebarBody}
          </aside>
        </div>
      )}

      <main
        key={pathname}
        className="page-enter mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-5 sm:py-10"
      >
        {children}
      </main>
      <DemoVideo />
    </div>
  );
}
