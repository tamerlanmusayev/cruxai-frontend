'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LANGS, useT } from '@/lib/i18n';
import { usePresence } from '@/lib/usePresence';
import DemoVideo from '@/components/DemoVideo';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { lang, setLang, t } = useT();
  const online = usePresence();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const links = [
    { href: '/library', label: t('nav.library') },
    { href: '/review', label: t('nav.review') },
    { href: '/progress', label: t('nav.progress') },
    { href: '/synthesis', label: t('nav.synthesis') },
    { href: '/stats', label: t('nav.stats') },
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-base/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 text-lg font-bold sm:text-xl"
          >
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm shadow-glow">
              ✦
            </span>
            <span className="grad-text">CruxAI</span>
          </Link>

          {/* desktop nav */}
          <nav className="hidden items-center gap-4 text-sm text-slate-400 md:flex">
            {online > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {online} online
              </span>
            )}
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? 'page' : undefined}
                className={
                  isActive(l.href)
                    ? 'font-medium text-ink'
                    : 'hover:text-ink'
                }
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com/tamerlanmusayev"
              target="_blank"
              rel="noreferrer"
              className="hover:text-ink"
            >
              GitHub
            </a>
            {LangSwitcher}
          </nav>

          {/* mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            {LangSwitcher}
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 text-slate-300"
            >
              {open ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* mobile dropdown */}
        {open && (
          <nav className="border-t border-white/10 bg-base/95 px-4 py-3 md:hidden">
            {online > 0 && (
              <p className="mb-2 flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {online} online
              </p>
            )}
            <div className="flex flex-col gap-1 text-slate-300">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(l.href) ? 'page' : undefined}
                  className={`rounded-lg px-2 py-2 hover:bg-white/5 ${
                    isActive(l.href)
                      ? 'bg-white/5 font-medium text-ink'
                      : ''
                  }`}
                >
                  {l.label}
                </Link>
              ))}
              <a
                href="https://github.com/tamerlanmusayev"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg px-2 py-2 hover:bg-white/5"
              >
                GitHub
              </a>
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-5 sm:py-10">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-4xl px-4 py-10 text-center text-xs text-slate-500 sm:px-5 sm:py-12">
        CruxAI · {t('footer.tagline')}
      </footer>
      <DemoVideo />
    </div>
  );
}
