'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Flashcard, generateFlashcards, reviewFlashcard } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import FlashcardStudy from '@/components/FlashcardStudy';

export default function FlashcardsPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    generateFlashcards(id)
      .then((c) => active && setCards(c))
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, [id]);

  async function handleGrade(cardId: string, grade: number) {
    await ensureToken();
    reviewFlashcard(cardId, grade).catch(() => {});
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('fc.title')}</h1>
        <Link href={`/doc/${id}`} className="text-sm text-brand hover:underline">
          {t('quiz.summary')}
        </Link>
      </div>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {!cards && !error && (
        <div className="mt-20 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-brand" />
          <p className="text-slate-400">{t('fc.making')}</p>
        </div>
      )}

      {cards && <FlashcardStudy cards={cards} onGrade={handleGrade} />}
    </div>
  );
}
