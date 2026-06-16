'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { DocumentDetail, getDocument, updateSummary } from '@/lib/api';
import SummaryActions from '@/components/SummaryActions';
import AiProgress from '@/components/AiProgress';
import MarkdownEditor from '@/components/MarkdownEditor';
import { useT } from '@/lib/i18n';

export default function DocPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // inline editing of the generated summary
  const [editing, setEditing] = useState(false);
  const [draftContent, setDraftContent] = useState('');
  const [draftKeys, setDraftKeys] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  function startEdit() {
    if (!doc?.summary) return;
    setDraftContent(doc.summary.contentMd);
    setDraftKeys(doc.summary.keyPoints.length ? doc.summary.keyPoints : ['']);
    setSaveErr(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setSaveErr(null);
    try {
      const keyPoints = draftKeys.map((k) => k.trim()).filter(Boolean);
      const updated = await updateSummary(id, {
        contentMd: draftContent,
        keyPoints,
      });
      setDoc(updated);
      setEditing(false);
    } catch (e) {
      setSaveErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const d = await getDocument(id);
        if (!active) return;
        setDoc(d);
        if (d.status === 'PROCESSING' || d.status === 'QUEUED') {
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

  if (!doc || doc.status === 'PROCESSING' || doc.status === 'QUEUED') {
    return (
      <AiProgress
        steps={[t('prog.collect'), t('prog.read'), t('prog.summarize'), t('prog.almost')]}
      />
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-medium uppercase tracking-wide text-slate-400">
          {t('doc.notes')}
        </span>
        <div className="flex items-center gap-2">
          {doc.language && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
              {doc.language}
            </span>
          )}
          {doc.summary && !editing && !doc.isExample && (
            <button
              onClick={startEdit}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-200 hover:border-white/25"
            >
              {t('doc.edit')}
            </button>
          )}
          {editing && (
            <>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-300 hover:border-white/25 disabled:opacity-50"
              >
                {t('doc.cancel')}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="btn-glow rounded-lg px-4 py-1.5 text-sm font-medium disabled:opacity-50"
              >
                {saving ? t('doc.saving') : t('doc.save')}
              </button>
            </>
          )}
        </div>
      </div>

      {saveErr && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {saveErr}
        </div>
      )}

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

      <div className="reader">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{doc.title}</h1>

        {editing ? (
          <section className="mt-6">
            <p className="mb-2 text-sm font-semibold text-slate-500">{t('doc.key')}</p>
            <div className="space-y-2">
              {draftKeys.map((k, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={k}
                    onChange={(e) =>
                      setDraftKeys((p) => p.map((x, j) => (j === i ? e.target.value : x)))
                    }
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-[15px] text-slate-900 outline-none focus:border-brand"
                  />
                  <button
                    onClick={() => setDraftKeys((p) => p.filter((_, j) => j !== i))}
                    className="rounded-lg border border-slate-300 px-3 text-slate-500 hover:bg-slate-100"
                    aria-label="remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => setDraftKeys((p) => [...p, ''])}
              className="mt-2 text-sm font-medium text-brand hover:underline"
            >
              + {t('doc.addPoint')}
            </button>

            <p className="mb-2 mt-6 text-sm font-semibold text-slate-500">{t('doc.notes')}</p>
            <MarkdownEditor value={draftContent} onChange={setDraftContent} />
          </section>
        ) : (
          <>
            {doc.summary?.keyPoints?.length ? (
              <section className="takeaways mt-6">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">
                  {t('doc.key')}
                </p>
                <ul className="space-y-1.5 text-[15px] text-slate-700">
                  {doc.summary.keyPoints.map((k, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                      <span>{k}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="prose-note mt-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {doc.summary?.contentMd ?? ''}
              </ReactMarkdown>
            </section>

            {doc.summary?.citations?.length ? (
              <section className="mt-8 border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  {t('doc.sources')}
                </p>
                <ol className="mt-2 space-y-1.5 text-sm text-slate-500">
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
          </>
        )}
      </div>

      {doc.summary && !editing && (
        <SummaryActions
          documentId={doc.id}
          title={doc.title}
          contentMd={doc.summary.contentMd}
          keyPoints={doc.summary.keyPoints}
          language={doc.language}
        />
      )}

      {doc.isExample ? (
        // Examples are a public, summary-only showcase — the quiz/flashcards/
        // exam/graph are owner-scoped, so nudge visitors to make their own.
        <div className="glass mt-10 p-6 text-center">
          <p className="text-sm text-slate-400">{t('doc.exampleNote')}</p>
          <Link href="/" className="btn-glow mt-4 inline-block rounded-lg px-6 py-3 font-medium">
            {t('doc.exampleCta')}
          </Link>
        </div>
      ) : (
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
      )}
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
