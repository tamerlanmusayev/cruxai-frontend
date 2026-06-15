'use client';

import { useEffect, useState } from 'react';
import { ReviewsSummary, createReview, getReviews } from '@/lib/api';
import { ensureToken } from '@/lib/auth';
import Modal from '@/components/Modal';
import { useT } from '@/lib/i18n';

const MIN_COMMENT = 5;

function Stars({ value, size = 'text-base' }: { value: number; size?: string }) {
  return (
    <span className={`${size} tracking-tight text-amber-400`} aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? '' : 'opacity-25'}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function ReviewsSection() {
  const { t } = useT();
  const [data, setData] = useState<ReviewsSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => getReviews().then(setData).catch(() => {});
  useEffect(() => {
    load();
  }, []);

  const trimmedComment = comment.trim();
  const canSend = trimmedComment.length >= MIN_COMMENT && !busy;

  async function send() {
    if (!canSend) return;
    setBusy(true);
    try {
      const token = await ensureToken();
      const saved = await createReview(
        { rating, comment: trimmedComment, name: name.trim() || undefined },
        token,
      );
      // Optimistically reflect it right away (and correctly even in demo mode,
      // where the list endpoint returns synthetic data).
      setData((prev) => {
        const base = prev ?? { average: 0, count: 0, items: [] };
        const count = base.count + 1;
        const average = Math.round(((base.average * base.count + rating) / count) * 10) / 10;
        return { average, count, items: [saved, ...base.items] };
      });
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto mt-12 max-w-xl text-left">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{t('reviews.title')}</h2>
        <button
          onClick={() => {
            setSent(false);
            setOpen(true);
          }}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium hover:border-white/25"
        >
          {t('reviews.leave')}
        </button>
      </div>

      {data && data.count > 0 ? (
        <div className="mb-4 flex items-center gap-3">
          <span className="text-3xl font-extrabold grad-text">{data.average.toFixed(1)}</span>
          <div>
            <Stars value={data.average} />
            <p className="text-xs text-[var(--text-muted)]">{t('rating.count', { n: data.count })}</p>
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-[var(--text-muted)]">{t('reviews.empty')}</p>
      )}

      <div className="space-y-2">
        {data?.items.map((r) => (
          <div key={r.id} className="glass p-3">
            <div className="flex items-center justify-between">
              <Stars value={r.rating} size="text-sm" />
              <span className="text-xs text-[var(--text-muted)]">{r.name || 'Anonymous'}</span>
            </div>
            {r.comment && <p className="mt-1.5 text-sm">{r.comment}</p>}
          </div>
        ))}
      </div>

      {open && (
        <Modal onClose={() => setOpen(false)}>
          {sent ? (
            <div className="text-center">
              <p className="text-3xl">🎉</p>
              <p className="mt-2 font-medium">{t('reviews.thanks')}</p>
              <button onClick={() => setOpen(false)} className="btn-glow mt-4 rounded-lg px-5 py-2 text-sm font-medium">
                OK
              </button>
            </div>
          ) : (
            <>
              <p className="text-lg font-semibold">{t('reviews.leave')}</p>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{t('reviews.your')}</p>
              <div className="mt-1 text-3xl" onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHover(n)}
                    className={`transition-transform hover:scale-110 ${
                      n <= (hover || rating) ? 'text-amber-400' : 'text-[var(--border-strong)]'
                    }`}
                    aria-label={`${n} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('reviews.comment')}
                rows={3}
                className="mt-3 w-full rounded-lg border border-[var(--border)] bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {t('reviews.minHint', { n: MIN_COMMENT })}
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('reviews.name')}
                className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white/5 px-3 py-2 text-sm outline-none focus:border-brand"
              />
              <button
                onClick={send}
                disabled={!canSend}
                className="btn-glow mt-4 w-full rounded-lg px-5 py-2.5 font-medium disabled:opacity-50"
              >
                {busy ? '…' : t('reviews.send')}
              </button>
            </>
          )}
        </Modal>
      )}
    </section>
  );
}
