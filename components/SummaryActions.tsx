'use client';

import { useRef, useState } from 'react';
import { toCanvas } from 'html-to-image';
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
  const [pdfBusy, setPdfBusy] = useState(false);
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

  // Rasterize the browser-rendered notes (so Cyrillic/Azerbaijani survive —
  // jsPDF's built-in fonts are Latin-1 only), then slice it across A4 pages
  // WITH margins and page numbers, cropping each page so nothing is cut flush
  // to the edge.
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
      const margin = 40;
      const footer = 24; // space reserved for the page number
      const contentW = pw - margin * 2;
      const contentH = ph - margin * 2 - footer;
      const pxPerPt = canvas.width / contentW; // device px per PDF point
      const sliceHpx = Math.floor(contentH * pxPerPt);
      const pages = Math.max(1, Math.ceil(canvas.height / sliceHpx));

      const slice = document.createElement('canvas');
      const ctx = slice.getContext('2d')!;

      for (let p = 0; p < pages; p++) {
        const sy = p * sliceHpx;
        const hpx = Math.min(sliceHpx, canvas.height - sy);
        slice.width = canvas.width;
        slice.height = hpx;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, slice.height);
        ctx.drawImage(canvas, 0, sy, canvas.width, hpx, 0, 0, canvas.width, hpx);

        if (p > 0) pdf.addPage();
        pdf.addImage(
          slice.toDataURL('image/png'),
          'PNG',
          margin,
          margin,
          contentW,
          hpx / pxPerPt,
        );
        pdf.setFontSize(9);
        pdf.setTextColor(150);
        pdf.text(`${p + 1} / ${pages}`, pw / 2, ph - margin / 2, { align: 'center' });
      }
      pdf.save(`${safeName(title)}.pdf`);
    } finally {
      setPdfBusy(false);
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
      </div>

      {/* Off-screen notes document rasterized into the downloadable PDF */}
      <div className="pointer-events-none fixed -left-[9999px] top-0">
        <div
          ref={notesRef}
          style={{ width: 760, color: '#1a1a2e', background: '#ffffff' }}
          className="px-14 py-12"
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
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
    </>
  );
}
