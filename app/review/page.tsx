'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Flashcard, getDueFlashcards, reviewFlashcard } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import FlashcardStudy from '@/components/FlashcardStudy';

export default function ReviewPage() {
  const { t } = useT();
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureToken()
      .then(getDueFlashcards)
      .then(setCards)
      .catch((e) => setError((e as Error).message));
  }, []);

  async function handleGrade(cardId: string, grade: number) {
    await ensureToken();
    reviewFlashcard(cardId, grade).catch(() => {});
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold">{t('fc.review')}</h1>
      <p className="mt-2 text-slate-400">{t('fc.reviewSub')}</p>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {cards && cards.length === 0 && (
        <div className="glass mt-8 p-10 text-center">
          <p className="text-slate-400">{t('fc.noDue')}</p>
          <Link href="/library" className="btn-glow mt-5 inline-block rounded-lg px-6 py-3 font-medium">
            {t('nav.library')}
          </Link>
        </div>
      )}

      {cards && cards.length > 0 && (
        <FlashcardStudy cards={cards} onGrade={handleGrade} />
      )}
    </div>
  );
}
