'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Flashcard, generateFlashcards, reviewFlashcard } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import { useT } from '@/lib/i18n';
import FlashcardStudy from '@/components/FlashcardStudy';
import AiProgress from '@/components/AiProgress';

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
        <AiProgress steps={[t('prog.read'), t('prog.cards'), t('prog.almost')]} />
      )}

      {cards && <FlashcardStudy cards={cards} onGrade={handleGrade} />}
    </div>
  );
}
