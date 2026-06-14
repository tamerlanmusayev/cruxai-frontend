'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DayCount, Stats, getStats } from '@/lib/api';
import { usePresence } from '@/lib/usePresence';
import { useT } from '@/lib/i18n';

function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-white/20 border-t-brand ${className}`}
    />
  );
}

export default function StatsPage() {
  const { t } = useT();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const online = usePresence();

  useEffect(() => {
    const load = () => getStats().then(setStats).catch((e) => setError((e as Error).message));
    load();
    const id = setInterval(load, 15000); // refresh aggregates
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <h1 className="text-4xl font-extrabold">
        CruxAI by the <span className="grad-text">numbers</span>
      </h1>
      <p className="mt-3 text-slate-400">{t('stats.sub')}</p>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      <div className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm text-emerald-300">
        {online > 0 ? (
          <>
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {online} {t('stats.onlineNow')}
          </>
        ) : (
          <>
            <Spinner className="h-3.5 w-3.5" />
            {t('stats.connecting')}
          </>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t('stats.today')} value={stats?.summariesToday} />
        <Stat label={t('stats.summaries')} value={stats?.summaries} />
        <Stat label={t('stats.quizzes')} value={stats?.quizzes} />
        <Stat label={t('stats.attempts')} value={stats?.attempts} />
      </div>

      <Chart
        title={t('stats.daily')}
        data={stats?.daily}
        loading={!stats}
        fmt={(d) => d.slice(5)}
      />
      <Chart
        title={t('stats.monthly')}
        data={stats?.monthly}
        loading={!stats}
        fmt={(d) => d}
      />

      {stats?.countries?.length ? (
        <div className="glass mt-8 p-5 text-left">
          <p className="mb-4 text-sm font-medium text-slate-300">{t('stats.countries')}</p>
          <div className="space-y-3">
            {stats.countries.map((c) => (
              <div key={c.code}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{c.name}</span>
                  <span className="text-slate-400">{c.pct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Link href="/" className="btn-glow mt-12 inline-block rounded-lg px-6 py-3 font-medium">
        {t('stats.try')}
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="glass flex flex-col items-center justify-center p-6 shadow-glow">
      <div className="flex h-10 items-center text-4xl font-extrabold grad-text">
        {value === undefined ? <Spinner className="h-6 w-6" /> : value.toLocaleString()}
      </div>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function Chart({
  title,
  data,
  loading,
  fmt,
}: {
  title: string;
  data?: DayCount[];
  loading?: boolean;
  fmt: (day: string) => string;
}) {
  const max = data?.length ? Math.max(1, ...data.map((d) => d.count)) : 1;
  return (
    <div className="glass mt-8 p-5">
      <p className="mb-4 text-left text-sm font-medium text-slate-300">{title}</p>
      <div className="flex h-40 items-end gap-2">
        {loading || !data ? (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner className="h-7 w-7" />
          </div>
        ) : (
          data.map((d) => (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-gradient-to-t from-indigo-500 to-fuchsia-500"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }}
                title={`${d.day}: ${d.count}`}
              />
              <span className="text-[10px] text-slate-500">{fmt(d.day)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
