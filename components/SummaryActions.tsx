'use client';

import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { mdToPlainText, speechLang } from '@/lib/text';
import { API_URL } from '@/lib/api';
import { useT } from '@/lib/i18n';

interface Props {
  documentId: string;
  title: string;
  contentMd: string;
  keyPoints: string[];
  language: string | null;
}

function safeName(title: string) {
  return title.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'notes';
}

export default function SummaryActions({
  documentId,
  title,
  contentMd,
  keyPoints,
  language,
}: Props) {
  const { t } = useT();
  const [speaking, setSpeaking] = useState(false);
  const [cardBusy, setCardBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function browserSpeak() {
    const synth = window.speechSynthesis;
    if (!synth) {
      alert('Audio is not supported in this browser.');
      return;
    }
    const text = `${title}. ${mdToPlainText(contentMd)}`;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = speechLang(language);
    const voice = synth
      .getVoices()
      .find((v) => v.lang.toLowerCase().startsWith(u.lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.cancel();
    synth.speak(u);
    setSpeaking(true);
  }

  function stop() {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }

  async function toggleSpeech() {
    if (speaking) {
      stop();
      return;
    }
    setSpeaking(true);
    try {
      // Prefer premium server audio when configured; else fall back to browser.
      const res = await fetch(`${API_URL}/documents/${documentId}/audio`, {
        method: 'POST',
      });
      const type = res.headers.get('content-type') ?? '';
      if (res.ok && type.startsWith('audio/')) {
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        await audio.play();
        return;
      }
    } catch {
      /* fall through to browser TTS */
    }
    browserSpeak();
  }

  function downloadNotes() {
    const body =
      `# ${title}\n\n## Key takeaways\n` +
      keyPoints.map((k) => `- ${k}`).join('\n') +
      `\n\n${contentMd}\n`;
    const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName(title)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadCard() {
    if (!cardRef.current) return;
    setCardBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${safeName(title)}-card.png`;
      a.click();
    } finally {
      setCardBusy(false);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={toggleSpeech}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/25"
        >
          {speaking ? t('doc.stop') : t('doc.listen')}
        </button>
        <button
          onClick={downloadNotes}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/25"
        >
          {t('doc.downloadNotes')}
        </button>
        <button
          onClick={downloadCard}
          disabled={cardBusy}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/25 disabled:opacity-50"
        >
          {cardBusy ? '…' : t('doc.downloadCard')}
        </button>
      </div>

      {/* Off-screen shareable card captured to PNG */}
      <div className="pointer-events-none fixed -left-[9999px] top-0">
        <div
          ref={cardRef}
          style={{ width: 1080, height: 1080 }}
          className="flex flex-col justify-between bg-[#fffdf5] p-16"
        >
          <div>
            <p className="font-hand text-5xl text-brand">{title}</p>
            <p className="mt-2 text-2xl text-slate-400">★ Key takeaways</p>
            <ul className="mt-6 space-y-4">
              {keyPoints.slice(0, 5).map((k, i) => (
                <li key={i} className="flex gap-3 text-3xl leading-snug text-ink">
                  <span>✏️</span>
                  <span>{k}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between text-2xl text-slate-400">
            <span className="font-hand text-4xl text-brand">CruxAI</span>
            <span>made with AI · cruxai</span>
          </div>
        </div>
      </div>
    </>
  );
}
