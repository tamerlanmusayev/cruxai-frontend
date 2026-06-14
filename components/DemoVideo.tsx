'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';

/**
 * A tab that sticks out on the right edge; clicking it opens the demo /
 * how-to video in a popup. Drop the clip at web/public/demo.mp4.
 */
export default function DemoVideo() {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const src = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL ?? '/demo.mp4';
  const ytId = src.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
  )?.[1];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t('demo.button')}
        className="group fixed right-0 top-1/3 z-30 flex flex-col items-center gap-1 rounded-l-xl bg-gradient-to-b from-indigo-500 to-fuchsia-500 px-2.5 py-3 text-white shadow-glow transition hover:px-3"
      >
        <span className="text-base leading-none">▶</span>
        <span
          className="text-[11px] font-semibold tracking-wide"
          style={{ writingMode: 'vertical-rl' }}
        >
          {t('demo.button')}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass relative w-[92vw] max-w-5xl p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -top-3 -right-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-base text-slate-300 ring-1 ring-white/15 hover:text-ink"
            >
              ✕
            </button>
            <p className="px-2 py-2 text-sm font-medium text-slate-300">
              {t('demo.title')}
            </p>
            {ytId ? (
              <iframe
                className="aspect-video max-h-[78vh] w-full rounded-xl bg-black"
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                title={t('demo.title')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                className="max-h-[78vh] w-full rounded-xl bg-black"
                controls
                autoPlay
                playsInline
                preload="metadata"
              >
                <source src={src} type="video/mp4" />
              </video>
            )}
          </div>
        </div>
      )}
    </>
  );
}
