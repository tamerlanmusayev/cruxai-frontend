'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMachine } from '@xstate/react';
import { createExam, createNewExam, submitExam } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { examMachine, ExamContext } from '@/lib/examMachine';
import AiProgress from '@/components/AiProgress';
import { useT } from '@/lib/i18n';

export default function ExamPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();

  const [state, send] = useMachine(examMachine, {
    context: {
      id,
      fresh: false,
      exam: null,
      answers: [],
      left: 0,
      result: null,
      timedOut: false,
      error: null,
    } as ExamContext,
    services: {
      loadExam: async (ctx) => {
        await ensureToken();
        return ctx.fresh ? createNewExam(ctx.id) : createExam(ctx.id);
      },
      submit: async (ctx) => {
        if (!ctx.exam) throw new Error('No exam');
        return submitExam(ctx.exam.id, ctx.answers);
      },
    },
  });

  const { exam, answers, left, result, timedOut, error } = state.context;
  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (state.matches('failed')) {
    return (
      <div className="mt-20 text-center">
        <p className="text-red-400">{error}</p>
        <Link href={`/doc/${id}`} className="mt-4 inline-block text-brand hover:underline">
          {t('quiz.summary')}
        </Link>
      </div>
    );
  }

  if (state.matches('loading') || !exam) {
    return <AiProgress steps={[t('prog.read'), t('prog.examgen'), t('prog.almost')]} />;
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');

  return (
    <div>
      <div className="sticky top-0 z-20 mb-5 flex items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 shadow-lg">
        <h1 className="text-xl font-bold">{t('exam.title')}</h1>
        {!result && (
          <span
            className={`rounded-lg px-3 py-1 font-mono text-lg tabular-nums ${
              left < 60 ? 'bg-red-500/15 text-red-400' : 'bg-[var(--surface-2)]'
            }`}
          >
            ⏱ {mm}:{ss}
          </span>
        )}
      </div>

      {error && !result && (
        <p className="mb-4 text-center text-sm text-red-400">{error}</p>
      )}

      {result && (
        <div className="glass mb-6 p-6 text-center">
          {timedOut && (
            <p className="mb-3 inline-block rounded-lg bg-amber-500/15 px-3 py-1 text-sm font-medium text-amber-400">
              ⏰ {t('exam.timeUp')}
            </p>
          )}
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
            onClick={() => send({ type: 'NEW' })}
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
                        onChange={() => send({ type: 'ANSWER', qi, oi })}
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
          <button
            onClick={() => {
              send({ type: 'SUBMIT' });
              scrollTop();
            }}
            disabled={state.matches('submitting')}
            className="btn-glow rounded-lg px-6 py-3 font-medium disabled:opacity-50"
          >
            {state.matches('submitting') ? t('quiz.grading') : t('exam.finish')}
          </button>
        </div>
      )}
    </div>
  );
}
