'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LANGS, useT } from '@/lib/i18n';
import { usePresence } from '@/lib/usePresence';
import DemoVideo from '@/components/DemoVideo';

const GITHUB_URL =
  process.env.NEXT_PUBLIC_GITHUB_URL ??
  'https://github.com/tamerlanmusayev/cruxai-frontend';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useT();
  const online = usePresence();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: '/library', label: t('nav.library'), icon: '📚' },
    { href: '/review', label: t('nav.review'), icon: '🔁' },
    { href: '/progress', label: t('nav.progress'), icon: '📈' },
    { href: '/synthesis', label: t('nav.synthesis'), icon: '🧬' },
    { href: '/stats', label: t('nav.stats'), icon: '📊' },
  ];

  const LangSwitcher = (
    <div className="flex overflow-hidden rounded-lg border border-white/10">
      {LANGS.map((l) => (
        <button
          key={l.code}
          onClick={() => setLang(l.code)}
          className={`px-2.5 py-1 text-xs font-medium transition ${
            lang === l.code
              ? 'bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white'
              : 'text-slate-400 hover:text-ink'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );

  const NavLinks = (
    <nav className="flex flex-col gap-1">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={isActive(l.href) ? 'page' : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
            isActive(l.href)
              ? 'bg-white/10 font-semibold text-ink'
              : 'text-slate-400 hover:bg-white/5 hover:text-ink'
          }`}
        >
          <span aria-hidden className="text-base">{l.icon}</span>
          <span>{l.label}</span>
        </Link>
      ))}
    </nav>
  );

  // Shared sidebar body (logo → nav → footer with GitHub).
  const SidebarBody = (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="flex items-center gap-2 px-3 text-xl font-bold"
      >
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
        <span aria-hidden className="text-base">＋</span>
        <span>{t('nav.new')}</span>
      </Link>

      <div className="mt-4 flex-1">{NavLinks}</div>

      <div className="mt-6 space-y-3 border-t border-white/10 px-3 pt-4">
        {LangSwitcher}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-ink"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          GitHub
        </a>
        <p className="text-xs text-slate-500">CruxAI · {t('footer.tagline')}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen md:pl-64">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-base/70 px-3 py-6 backdrop-blur-xl md:block">
        {SidebarBody}
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-base/70 px-4 py-3 backdrop-blur-xl md:hidden">
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
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] border-r border-white/10 bg-base px-3 py-6">
            {SidebarBody}
          </aside>
        </div>
      )}

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-5 sm:py-10">
        {children}
      </main>
      <DemoVideo />
    </div>
  );
}
