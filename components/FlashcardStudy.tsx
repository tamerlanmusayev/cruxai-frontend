'use client';

import { useState } from 'react';
import { Flashcard } from '@/lib/api';
import { useT } from '@/lib/i18n';

const GRADES = [
  { label: 'Again', grade: 1, cls: 'border-red-500/50 text-red-300' },
  { label: 'Hard', grade: 3, cls: 'border-amber-500/50 text-amber-300' },
  { label: 'Good', grade: 4, cls: 'border-sky-500/50 text-sky-300' },
  { label: 'Easy', grade: 5, cls: 'border-emerald-500/50 text-emerald-300' },
];

export default function FlashcardStudy({
  cards,
  onGrade,
}: {
  cards: Flashcard[];
  onGrade?: (id: string, grade: number) => void;
}) {
  const { t } = useT();
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (i >= cards.length) {
    return (
      <div className="glass mt-8 p-10 text-center">
        <p className="text-2xl">🎉</p>
        <p className="mt-2 text-slate-300">{t('fc.done')}</p>
      </div>
    );
  }

  const card = cards[i];

  function next(grade: number) {
    onGrade?.(card.id, grade);
    setFlipped(false);
    setI((n) => n + 1);
  }

  return (
    <div className="mt-8">
      <p className="mb-3 text-center text-sm text-slate-500">
        {i + 1} / {cards.length}
      </p>

      <div
        onClick={() => setFlipped((f) => !f)}
        className="glass mx-auto flex min-h-[220px] max-w-xl cursor-pointer flex-col items-center justify-center p-8 text-center"
      >
        <p className="text-xs uppercase tracking-wide text-slate-500">
          {flipped ? t('fc.answer') : t('fc.question')}
        </p>
        <p className="mt-3 text-lg text-ink">{flipped ? card.back : card.front}</p>
        {!flipped && (
          <p className="mt-6 text-xs text-slate-500">{t('fc.tapReveal')}</p>
        )}
      </div>

      {flipped && (
        <div className="mx-auto mt-5 flex max-w-xl justify-center gap-2">
          {GRADES.map((g) => (
            <button
              key={g.grade}
              onClick={() => next(g.grade)}
              className={`flex-1 rounded-lg border bg-white/5 px-3 py-2.5 text-sm font-medium hover:bg-white/10 ${g.cls}`}
            >
              {t(`fc.${g.label.toLowerCase()}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
