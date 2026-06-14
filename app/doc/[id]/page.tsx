'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DocumentDetail, getDocument } from '@/lib/api';
import SummaryActions from '@/components/SummaryActions';
import { useT } from '@/lib/i18n';

export default function DocPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const d = await getDocument(id);
        if (!active) return;
        setDoc(d);
        if (d.status === 'PROCESSING') {
          timer = setTimeout(poll, 2500);
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      }
    }
    poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [id]);

  if (error) {
    return <Notice tone="error" title="Something went wrong" body={error} />;
  }

  if (!doc || doc.status === 'PROCESSING') {
    return (
      <Notice tone="info" title={t('doc.reading')} body={t('doc.readingBody')} spinner />
    );
  }

  if (doc.status === 'FAILED') {
    return (
      <Notice
        tone="error"
        title="Could not process this document"
        body={doc.error ?? 'Unknown error.'}
      />
    );
  }

  return (
    <article>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-hand text-2xl text-slate-400">{t('doc.notes')}</span>
        {doc.language && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
            {doc.language}
          </span>
        )}
      </div>

      {doc.skipped?.length ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          ⚠️ {t('doc.skipped')}
          <ul className="mt-1 list-disc pl-5 text-amber-300/90">
            {doc.skipped.map((s, i) => (
              <li key={i}>
                {s.name} — {s.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="notebook">
        <h1 className="font-hand text-4xl text-brand">{doc.title}</h1>

        {doc.summary?.keyPoints?.length ? (
          <section className="mb-6 mt-4">
            <p className="font-hand text-2xl text-red-700">{t('doc.key')}</p>
            <ul className="mt-2 space-y-2">
              {doc.summary.keyPoints.map((k, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden>✏️</span>
                  <span className="marker">{k}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="prose-note">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {doc.summary?.contentMd ?? ''}
          </ReactMarkdown>
        </section>

        {doc.summary?.citations?.length ? (
          <section className="mt-8 border-t border-slate-300 pt-4">
            <p className="font-hand text-2xl text-slate-600">{t('doc.sources')}</p>
            <ol className="mt-2 space-y-1.5 text-sm text-slate-600">
              {doc.summary.citations.map((c) => (
                <li key={c.n} className="flex gap-2">
                  <span className="font-semibold text-brand">[{c.n}]</span>
                  <span>
                    {c.section ? <strong className="text-slate-700">{c.section}: </strong> : null}
                    <span className="italic">“{c.quote}”</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>

      {doc.summary && (
        <SummaryActions
          documentId={doc.id}
          title={doc.title}
          contentMd={doc.summary.contentMd}
          keyPoints={doc.summary.keyPoints}
          language={doc.language}
        />
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href={`/doc/${doc.id}/flashcards`}
          className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 hover:border-white/25"
        >
          {t('doc.flashcards')}
        </Link>
        <Link
          href={`/doc/${doc.id}/graph`}
          className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 hover:border-white/25"
        >
          {t('doc.graph')}
        </Link>
        <Link
          href={`/doc/${doc.id}/exam`}
          className="rounded-lg border border-white/10 bg-white/5 px-5 py-3 font-medium text-slate-200 hover:border-white/25"
        >
          {t('doc.exam')}
        </Link>
        <Link
          href={`/doc/${doc.id}/quiz`}
          className="btn-glow rounded-lg px-5 py-3 font-medium"
        >
          {t('doc.test')}
        </Link>
      </div>
    </article>
  );
}

function Notice({
  tone,
  title,
  body,
  spinner,
}: {
  tone: 'info' | 'error';
  title: string;
  body: string;
  spinner?: boolean;
}) {
  const { t } = useT();
  return (
    <div className="glass mx-auto mt-16 max-w-md p-8 text-center">
      {spinner && (
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-brand" />
      )}
      <h1
        className={`text-lg font-semibold ${
          tone === 'error' ? 'text-red-400' : 'text-ink'
        }`}
      >
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
      <Link href="/" className="mt-6 inline-block text-sm text-brand hover:underline">
        {t('doc.uploadAnother')}
      </Link>
    </div>
  );
}
