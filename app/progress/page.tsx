'use client';

import { useEffect, useState } from 'react';
import { ProgressItem, getProgress } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { useT } from '@/lib/i18n';

export default function ProgressPage() {
  const { t } = useT();
  const { signedIn, openLogin } = useAuth();
  const [items, setItems] = useState<ProgressItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    ensureToken()
      .then(getProgress)
      .then(setItems)
      .catch((e) => setError((e as Error).message));
  }, [signedIn]);

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{t('progress.title')}</h1>
      <p className="mt-2 text-slate-400">{t('progress.sub')}</p>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {!signedIn ? (
        <div className="glass mt-8 p-10 text-center">
          <p className="text-slate-400">{t('auth.title')}</p>
          <button
            onClick={() => openLogin()}
            className="btn-glow mt-5 inline-block rounded-lg px-6 py-3 font-medium"
          >
            {t('auth.signIn')}
          </button>
        </div>
      ) : (
        <>
          {!items && !error && (
            <div className="glass mt-8 flex items-center justify-center gap-3 p-10 text-sm text-slate-400">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/10 border-t-brand" />
              {t('common.loading')}
            </div>
          )}

          {items && items.length === 0 && (
            <div className="glass mt-8 p-10 text-center text-slate-400">
              {t('progress.empty')}
            </div>
          )}

          <ul className="mt-8 space-y-3">
            {items?.map((it, i) => {
          const pct = Math.round(it.mastery * 100);
          const color =
            pct >= 70 ? 'from-emerald-500 to-emerald-400'
            : pct >= 40 ? 'from-amber-500 to-amber-400'
            : 'from-red-500 to-red-400';
          return (
            <li key={i} className="glass p-4">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-ink">{it.concept}</span>
                <span className="text-slate-400">
                  {pct}% · {it.correct}/{it.seen}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
