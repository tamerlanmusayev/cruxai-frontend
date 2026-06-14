'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Exam, ExamResult, createExam, createNewExam, submitExam } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useT } from '@/lib/i18n';

export default function ExamPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [left, setLeft] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      try {
        await ensureToken();
        const e = await createExam(id);
        if (!on) return;
        setExam(e);
        setAnswers(new Array(e.questions.length).fill(-1));
        setLeft(e.durationSec);
      } catch (err) {
        if (on) setError((err as Error).message);
      }
    })();
    return () => {
      on = false;
    };
  }, [id]);

  const submit = useCallback(async () => {
    if (!exam || result) return;
    try {
      const r = await submitExam(exam.id, answers);
      setResult(r);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError((err as Error).message);
    }
  }, [exam, answers, result]);

  async function newExam() {
    setError(null);
    setResult(null);
    setExam(null);
    try {
      await ensureToken();
      const e = await createNewExam(id);
      setExam(e);
      setAnswers(new Array(e.questions.length).fill(-1));
      setLeft(e.durationSec);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  // countdown
  useEffect(() => {
    if (!exam || result) return;
    if (left <= 0) {
      submit();
      return;
    }
    const id2 = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id2);
  }, [exam, left, result, submit]);

  if (error && !exam) {
    return (
      <div className="mt-20 text-center">
        <p className="text-red-400">{error}</p>
        <Link href={`/doc/${id}`} className="mt-4 inline-block text-brand hover:underline">
          {t('quiz.summary')}
        </Link>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="mt-20 text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-brand" />
        <p className="text-slate-400">{t('exam.building')}</p>
      </div>
    );
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div>
      <div className="sticky top-16 z-10 mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-base/80 px-4 py-2 backdrop-blur">
        <h1 className="text-xl font-bold">{t('exam.title')}</h1>
        {!result && (
          <span className={`font-mono text-lg ${left < 60 ? 'text-red-400' : 'text-slate-300'}`}>
            ⏱ {mm}:{ss}
          </span>
        )}
      </div>

      {result && (
        <div className="glass mb-6 p-6 text-center">
          <p className="text-4xl font-extrabold grad-text">{result.predicted}%</p>
          <p className="mt-1 text-slate-400">
            {result.score} / {result.total}
          </p>
          {result.weakReport.length > 0 && (
            <div className="mt-5 text-left">
              <p className="text-sm font-semibold text-amber-300">{t('exam.weak')}</p>
              <ul className="mt-2 space-y-2 text-sm text-slate-300">
                {result.weakReport.map((w, i) => (
                  <li key={i} className="rounded-lg bg-amber-500/10 p-3">
                    <p className="font-medium">{w.question}</p>
                    <p className="mt-1 text-slate-400">{w.explanation}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={newExam}
            className="btn-glow mt-5 rounded-lg px-6 py-3 font-medium"
          >
            {t('exam.new')}
          </button>
        </div>
      )}

      <ol className="space-y-5">
        {exam.questions.map((q, qi) => {
          const r = result?.answers[qi];
          return (
            <li key={qi} className="glass p-5">
              <p className="font-medium">{qi + 1}. {q.question}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi;
                  let cls = 'border-white/10 bg-white/[0.03]';
                  if (r) {
                    if (oi === r.correctIndex) cls = 'border-emerald-500/60 bg-emerald-500/10';
                    else if (oi === r.chosenIndex) cls = 'border-red-500/60 bg-red-500/10';
                    else cls = 'border-white/10 opacity-60';
                  } else if (chosen) cls = 'border-brand bg-brand/10';
                  return (
                    <label key={oi} className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 ${cls} ${result ? '' : 'cursor-pointer'}`}>
                      <input
                        type="radio" name={`q-${qi}`} className="accent-brand"
                        disabled={!!result} checked={chosen}
                        onChange={() => setAnswers((p) => { const n = [...p]; n[qi] = oi; return n; })}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="mt-8 flex justify-center">
          <button onClick={submit} className="btn-glow rounded-lg px-6 py-3 font-medium">
            {t('exam.finish')}
          </button>
        </div>
      )}
    </div>
  );
}
