'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  AttemptResult,
  Quiz,
  generateQuiz,
  submitAttempt,
} from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useT } from '@/lib/i18n';

export default function QuizPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await ensureToken();
        const q = await generateQuiz(id);
        if (!active) return;
        setQuiz(q);
        setAnswers(new Array(q.questions.length).fill(-1));
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  async function handleSubmit() {
    if (!quiz) return;
    setGrading(true);
    setError(null);
    try {
      const r = await submitAttempt(quiz.id, answers);
      setResult(r);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGrading(false);
    }
  }

  if (loading) {
    return (
      <Centered>
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-brand" />
        <p className="text-slate-400">{t('quiz.writing')}</p>
      </Centered>
    );
  }

  if (error && !quiz) {
    return (
      <Centered>
        <p className="text-red-400">{error}</p>
        <Link href={`/doc/${id}`} className="mt-4 inline-block text-brand hover:underline">
          {t('quiz.summary')}
        </Link>
      </Centered>
    );
  }

  if (!quiz) return null;

  const allAnswered = answers.every((a) => a >= 0);
  const fb = (i: number) => result?.feedback.find((f) => f.index === i);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('quiz.title')}</h1>
        <Link href={`/doc/${id}`} className="text-sm text-brand hover:underline">
          {t('quiz.summary')}
        </Link>
      </div>

      {quiz.adaptive && (
        <div className="mt-3 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-4 py-2 text-sm text-fuchsia-200">
          🎯 {t('quiz.adaptive')}
          {quiz.focusedOn.length > 0 && (
            <span className="text-fuchsia-300/80"> {quiz.focusedOn.join(', ')}</span>
          )}
        </div>
      )}

      {result && (
        <div className="glass mt-4 p-6 text-center">
          <p className="text-4xl font-extrabold grad-text">
            {result.score} / {result.total}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {result.score === result.total ? t('quiz.perfect') : t('quiz.review')}
          </p>
        </div>
      )}

      <ol className="mt-6 space-y-5">
        {quiz.questions.map((q, qi) => {
          const f = fb(qi);
          return (
            <li key={qi} className="glass p-5">
              <p className="font-medium text-ink">
                {qi + 1}. {q.question}
              </p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const chosen = answers[qi] === oi;
                  let cls = 'border-white/10 bg-white/[0.03] hover:border-white/25';
                  if (f) {
                    if (oi === f.correctIndex)
                      cls = 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200';
                    else if (chosen)
                      cls = 'border-red-500/60 bg-red-500/10 text-red-200';
                    else cls = 'border-white/10 opacity-60';
                  } else if (chosen) {
                    cls = 'border-brand bg-brand/10';
                  }
                  return (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-slate-200 ${cls} ${
                        result ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${qi}`}
                        className="accent-brand"
                        disabled={!!result}
                        checked={chosen}
                        onChange={() =>
                          setAnswers((prev) => {
                            const next = [...prev];
                            next[qi] = oi;
                            return next;
                          })
                        }
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
              {f && (
                <p
                  className={`mt-3 rounded-lg p-3 text-sm ${
                    f.correct
                      ? 'bg-emerald-500/10 text-emerald-200'
                      : 'bg-amber-500/10 text-amber-200'
                  }`}
                >
                  {f.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>

      {error && quiz && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {!result ? (
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-sm text-slate-400">
            {t('quiz.answered', {
              a: answers.filter((x) => x >= 0).length,
              n: quiz.questions.length,
            })}
          </p>
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || grading}
            className="btn-glow rounded-lg px-6 py-3 font-medium disabled:opacity-50"
          >
            {grading ? t('quiz.grading') : t('quiz.submit')}
          </button>
        </div>
      ) : (
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 font-medium text-slate-200 hover:border-white/25"
          >
            {t('quiz.another')}
          </Link>
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mt-20 text-center">{children}</div>;
}
