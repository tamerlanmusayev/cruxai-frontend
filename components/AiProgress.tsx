'use client';

import { useEffect, useState } from 'react';
import { useAiTokens } from '@/lib/socket';

const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

/**
 * Staged "the AI is working" indicator: a progress ring that eases toward
 * ~95% while cycling through human-readable steps, so the user sees momentum
 * and roughly how much is left during the wait. The real result replaces it
 * when it arrives.
 */
export default function AiProgress({
  steps,
  estimate,
}: {
  steps: string[];
  /** Estimated tokens this AI request spends (shown to the user). */
  estimate?: number;
}) {
  const [pct, setPct] = useState(6);
  const live = useAiTokens();

  useEffect(() => {
    const iv = setInterval(() => {
      setPct((p) => {
        if (p >= 95) return 95;
        const inc = p < 55 ? 4 : p < 80 ? 2 : 0.7;
        return Math.min(95, p + inc);
      });
    }, 650);
    return () => clearInterval(iv);
  }, []);

  const idx = Math.min(steps.length - 1, Math.floor((pct / 100) * steps.length));
  const r = 30;
  const circ = 2 * Math.PI * r;

  return (
    <div className="mx-auto mt-16 flex max-w-xs flex-col items-center gap-4 text-center">
      <div className="relative h-20 w-20">
        <svg viewBox="0 0 72 72" className="h-20 w-20 -rotate-90">
          <circle cx="36" cy="36" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="6" />
          <circle
            cx="36"
            cy="36"
            r={r}
            fill="none"
            stroke="url(#aiProgressGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <defs>
            <linearGradient id="aiProgressGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 grid place-items-center text-lg font-bold">
          {Math.round(pct)}%
        </span>
      </div>
      <p className="font-medium transition-all duration-300">{steps[idx]}</p>
      {live ? (
        <p className="text-xs tabular-nums text-[var(--text-muted)]">
          {k(live.outputTokens)} tokens · {k(live.credits)} cr
        </p>
      ) : estimate ? (
        <p className="text-xs text-[var(--text-muted)]">≈ {k(estimate)} tokens</p>
      ) : null}
      <div className="flex gap-1.5">
        {steps.map((s, i) => (
          <span
            key={s}
            className={`h-1.5 w-1.5 rounded-full transition-colors ${
              i <= idx ? 'bg-brand' : 'bg-[var(--border-strong)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
