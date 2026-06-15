'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';

const STEPS = 4;

/**
 * Self-running, looping walkthrough of the product (drop → read → notes →
 * quiz). Built as animated DOM (not a recorded GIF) so it stays crisp,
 * theme-aware and localized.
 */
export default function HowItWorksDemo() {
  const { t } = useT();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setStep((s) => (s + 1) % STEPS), 2600);
    return () => clearInterval(iv);
  }, []);

  const captions = [t('hiw.upload'), t('hiw.read'), t('hiw.notes'), t('hiw.quiz')];

  return (
    <div className="glass mx-auto mt-8 max-w-xl overflow-hidden p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {t('hiw.title')}
      </p>

      <div className="relative h-44 overflow-hidden rounded-xl bg-[var(--surface-2)]">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`absolute inset-0 flex items-center justify-center p-5 transition-all duration-700 ${
              step === i
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-3 opacity-0'
            }`}
          >
            <Frame index={i} active={step === i} />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {captions.map((c, i) => (
          <span
            key={c}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              step === i ? 'w-6 bg-brand' : 'w-1.5 bg-[var(--border-strong)]'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-sm font-medium">
        <span className="text-[var(--text-muted)]">{step + 1}/4 · </span>
        {captions[step]}
      </p>
    </div>
  );
}

function Bar({ w, c = 'bg-[var(--border-strong)]' }: { w: string; c?: string }) {
  return <div className={`h-2 rounded ${c}`} style={{ width: w }} />;
}

function Frame({ index, active }: { index: number; active: boolean }) {
  if (index === 0) {
    // Upload
    return (
      <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-xl border-2 border-dashed border-brand/50 py-6">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl text-white shadow-glow animate-bounce">
          ⬆
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[var(--surface)] px-3 py-1.5 text-xs">
          <span>📄</span>
          <span className="font-medium">book.pdf</span>
        </div>
      </div>
    );
  }
  if (index === 1) {
    // Reading — scan line sweeping over text
    return (
      <div className="relative w-full max-w-xs space-y-2 overflow-hidden rounded-lg bg-[var(--surface)] p-4">
        {['90%', '100%', '75%', '95%', '60%'].map((w, i) => (
          <Bar key={i} w={w} />
        ))}
        {active && (
          <div className="pointer-events-none absolute inset-x-3 top-3 h-6 rounded bg-brand/25 blur-[1px] animate-[hiw-scan_1.6s_ease-in-out_infinite_alternate]" />
        )}
      </div>
    );
  }
  if (index === 2) {
    // Notes ready — title + highlighted lines
    return (
      <div className="w-full max-w-xs space-y-2 rounded-lg bg-white p-4 text-[#1a1a2e]">
        <div className="h-3 w-1/2 rounded bg-indigo-500" />
        <div className="h-2 w-full rounded bg-slate-200" />
        <div className="h-2 w-full rounded bg-yellow-300" />
        <div className="h-2 w-5/6 rounded bg-slate-200" />
        <div className="h-2 w-2/3 rounded bg-slate-200" />
      </div>
    );
  }
  // Quiz — question + options, correct one turns green
  return (
    <div className="w-full max-w-xs space-y-2 rounded-lg bg-[var(--surface)] p-4">
      <Bar w="80%" />
      <div className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs">
        <span className="h-3 w-3 rounded-full border border-[var(--border-strong)]" /> A
      </div>
      <div
        className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs transition-colors duration-500 ${
          active
            ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-500'
            : 'border-[var(--border)]'
        }`}
      >
        <span className="grid h-3 w-3 place-items-center rounded-full bg-emerald-500 text-[8px] text-white">
          ✓
        </span>{' '}
        B
      </div>
      <div className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-1.5 text-xs">
        <span className="h-3 w-3 rounded-full border border-[var(--border-strong)]" /> C
      </div>
    </div>
  );
}
