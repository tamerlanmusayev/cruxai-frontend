'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LANGS, useT } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';
import { useOnline } from '@/lib/socket';
import { UsageStatus, getUsage } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import DemoVideo from '@/components/DemoVideo';

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ??
  'https://github.com/tamerlanmusayev/cruxai-frontend';
// Buy Me a Coffee page (claim the handle / override via env to your own).
const DONATE_URL =
  process.env.NEXT_PUBLIC_DONATE_URL ?? 'https://www.buymeacoffee.com/tamerlanmusayev';

/** Compact token count: 192000 → "192k". */
function fmtTokens(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}k` : String(n);
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useT();
  const { theme, toggle } = useTheme();
  const { user, signedIn, openLogin, logout } = useAuth();
  useOnline(); // keep the presence subscription alive (count shown on /stats)
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // Close the mobile drawer / language menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [pathname]);

  // While the full-screen drawer is open: close on Escape and lock page scroll
  // so only the drawer scrolls (not the page behind it).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Swipe-left to dismiss the full-screen drawer.
  const touchStartX = useRef<number | null>(null);

  // Refresh today's token budget on navigation AND on account change
  // (login / logout / account switch all change `user` → refetch for the
  // current userId, so the chip never shows another account's number).
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
  }, [pathname, user]);

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

      <div className="space-y-2 border-t border-[var(--border)] pt-3">
        {/* AI-token budget — thin line; full figure on hover */}
        {usage && (
          <div
            className="px-1 pb-0.5"
            title={`${t('usage.label')}: ${fmtTokens(usage.remaining)} / ${fmtTokens(usage.limit)}`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-muted)]">{t('usage.label')}</span>
              <span
                className={`tabular-nums ${
                  usage.remaining < usage.fullFlow
                    ? 'text-amber-400'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {fmtTokens(usage.remaining)}
              </span>
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--surface-2)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                style={{ width: `${Math.max(0, (usage.remaining / usage.limit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* buy me a coffee — the one bright accent, kept visible */}
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-400/15"
        >
          <span>☕</span>
          <span>{t('support.donate')}</span>
        </a>

        {/* account + a single "more" menu for everything secondary */}
        <div className="flex items-center gap-2">
          {signedIn && user ? (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
              {user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.picture}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 shrink-0 rounded-full"
                />
              ) : (
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)]">
                  {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="min-w-0 flex-1 truncate text-sm text-[var(--text)]">
                {user.name ?? user.email}
              </span>
              <button
                onClick={logout}
                aria-label={t('auth.signOut')}
                title={t('auth.signOut')}
                className="shrink-0 text-[var(--text-muted)] transition hover:text-[var(--text)]"
              >
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => openLogin()}
              className="flex min-w-0 flex-1 items-center justify-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--border-strong)]"
            >
              {/* neutral icon — the popup offers all methods (Google, Telegram, …) */}
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              {t('auth.signIn')}
            </button>
          )}

          {/* "more" — Stats, theme, language, GitHub, legal all live here */}
          <div className="relative shrink-0">
            <button
              onClick={() => setMoreOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={moreOpen}
              aria-label={t('more.menu')}
              title={t('more.menu')}
              className="grid h-[42px] w-10 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:border-[var(--border-strong)] hover:text-[var(--text)]"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="1.7" />
                <circle cx="12" cy="12" r="1.7" />
                <circle cx="19" cy="12" r="1.7" />
              </svg>
            </button>

            {moreOpen && (
              <>
                <button
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMoreOpen(false)}
                  className="fixed inset-0 z-20 cursor-default"
                />
                <div
                  role="menu"
                  className="absolute bottom-full right-0 z-30 mb-1 max-h-[70vh] w-60 max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1 shadow-2xl"
                >
                  <Link
                    href="/stats"
                    onClick={() => setMoreOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  >
                    <span aria-hidden>📊</span>
                    <span>{t('nav.stats')}</span>
                  </Link>
                  <button
                    onClick={toggle}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  >
                    <span aria-hidden>{theme === 'dark' ? '☀️' : '🌙'}</span>
                    <span>{theme === 'dark' ? t('theme.light') : t('theme.dark')}</span>
                  </button>

                  <div className="my-1 border-t border-[var(--border)]" />
                  <p className="px-3 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    {t('more.language')}
                  </p>
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setMoreOpen(false);
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

                  <div className="my-1 border-t border-[var(--border)]" />
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text)]"
                  >
                    <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
                    </svg>
                    <span>GitHub</span>
                  </a>
                  <p className="px-3 pb-1 pt-1.5 text-[11px] leading-relaxed text-[var(--text-muted)]">
                    <Link href="/privacy" className="hover:text-[var(--text)]">Privacy</Link>
                    {' · '}
                    <Link href="/terms" className="hover:text-[var(--text)]">Terms</Link>
                    {' · '}
                    {t('footer.tagline')}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
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

      {/* mobile drawer — full screen */}
      {open && (
        <div
          className="fixed inset-0 z-40 overflow-y-auto bg-[var(--bg)] px-4 py-6 animate-[fade-in_0.15s_ease] md:hidden"
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
          }}
          onTouchMove={(e) => {
            if (
              touchStartX.current !== null &&
              touchStartX.current - e.touches[0].clientX > 60
            ) {
              setOpen(false);
              touchStartX.current = null;
            }
          }}
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-lg text-[var(--text-muted)] transition hover:bg-white/10 hover:text-[var(--text)]"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          {SidebarBody}
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
