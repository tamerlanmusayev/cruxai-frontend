'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LibraryItem, Synthesis, getLibrary, runSynthesis } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import AiProgress from '@/components/AiProgress';
import { useT } from '@/lib/i18n';

export default function SynthesisPage() {
  const { t } = useT();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<Synthesis | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureToken()
      .then(() => getLibrary(0, 50))
      .then((l) => setItems(l.filter((d) => d.status === 'READY')))
      .catch((e) => setError((e as Error).message));
  }, []);

  function toggle(id: string) {
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      await ensureToken();
      setResult(await runSynthesis(picked, query));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const canRun = picked.length >= 2 && picked.length <= 5 && query.trim().length > 0 && !busy;

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{t('syn.title')}</h1>
      <p className="mt-2 text-slate-400">{t('syn.sub')}</p>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      <div className="glass mt-6 p-5">
        <p className="mb-2 text-sm text-slate-400">{t('syn.pick')}</p>
        <div className="space-y-2">
          {items.map((d) => (
            <label key={d.id} className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                className="accent-brand"
                checked={picked.includes(d.id)}
                onChange={() => toggle(d.id)}
              />
              <span className="text-slate-200">{d.title}</span>
            </label>
          ))}
          {items.length === 0 && <p className="text-sm text-slate-500">{t('syn.none')}</p>}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('syn.placeholder')}
          className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-ink outline-none focus:border-brand"
        />
        <button
          onClick={run}
          disabled={!canRun}
          className="btn-glow mt-3 rounded-lg px-5 py-2.5 font-medium disabled:opacity-50"
        >
          {busy ? t('syn.working') : t('syn.run')}
        </button>
      </div>

      {busy && !result && (
        <AiProgress steps={[t('prog.collect'), t('prog.compare'), t('prog.synth'), t('prog.almost')]} />
      )}

      {result && (
        <div className="mt-6 space-y-6">
          <div className="glass p-6">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              {t('syn.consensus')}
            </p>
            <div className="prose-note rounded-lg bg-paper p-5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.consensus}</ReactMarkdown>
            </div>
          </div>
          {result.differences.length > 0 && (
            <div className="glass p-6">
              <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t('syn.diff')}
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                {result.differences.map((d, i) => (
                  <li key={i} className="rounded-lg bg-white/5 p-3">
                    <p>{d.point}</p>
                    <p className="mt-1 text-xs text-slate-500">{d.sources.join(' · ')}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
