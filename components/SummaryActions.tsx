'use client';

import { useRef, useState } from 'react';
import { toPng, toCanvas } from 'html-to-image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { jsPDF } from 'jspdf';
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
  const [pdfBusy, setPdfBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
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

  // Render the notes node to a canvas, then slice it across A4 pages.
  // We rasterize the browser-rendered DOM so Cyrillic / Azerbaijani glyphs
  // survive — jsPDF's built-in fonts only cover Latin-1.
  async function downloadNotes() {
    if (!notesRef.current || pdfBusy) return;
    setPdfBusy(true);
    try {
      const canvas = await toCanvas(notesRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const imgW = pw;
      const imgH = (canvas.height * pw) / canvas.width;
      const img = canvas.toDataURL('image/png');
      let heightLeft = imgH;
      let position = 0;
      pdf.addImage(img, 'PNG', 0, position, imgW, imgH);
      heightLeft -= ph;
      while (heightLeft > 0) {
        position -= ph;
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, position, imgW, imgH);
        heightLeft -= ph;
      }
      pdf.save(`${safeName(title)}.pdf`);
    } finally {
      setPdfBusy(false);
    }
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
          disabled={pdfBusy}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/25 disabled:opacity-50"
        >
          {pdfBusy ? '…' : t('doc.downloadNotes')}
        </button>
        <button
          onClick={downloadCard}
          disabled={cardBusy}
          className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 hover:border-white/25 disabled:opacity-50"
        >
          {cardBusy ? '…' : t('doc.downloadCard')}
        </button>
      </div>

      {/* Off-screen notes document rasterized into the downloadable PDF */}
      <div className="pointer-events-none fixed -left-[9999px] top-0">
        <div
          ref={notesRef}
          style={{ width: 760, color: '#1a1a2e', background: '#ffffff' }}
          className="px-14 py-12"
        >
          <h1 className="font-hand text-4xl text-brand">{title}</h1>
          {keyPoints.length > 0 && (
            <>
              <p className="mt-6 text-lg font-semibold">★ Key takeaways</p>
              <ul className="mt-3 list-disc space-y-1.5 pl-6 text-[15px] leading-relaxed">
                {keyPoints.map((k, i) => (
                  <li key={i}>{k}</li>
                ))}
              </ul>
            </>
          )}
          <div className="prose-note mt-8 text-[15px] leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentMd}</ReactMarkdown>
          </div>
          <p className="mt-10 text-xs text-slate-400">made with CruxAI · cruxai.az</p>
        </div>
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
