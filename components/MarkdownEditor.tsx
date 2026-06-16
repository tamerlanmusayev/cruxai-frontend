'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

/**
 * WYSIWYG editor for the summary. Reads/writes Markdown (the storage format)
 * via tiptap-markdown, so editing stays rich while persistence is unchanged.
 */
export default function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (markdown: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // Next.js SSR-safe
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Markdown.configure({ html: false, linkify: true, transformPastedText: true }),
    ],
    content: value,
    onUpdate: ({ editor }) =>
      onChange(
        (editor.storage as unknown as { markdown: { getMarkdown: () => string } }).markdown.getMarkdown(),
      ),
    editorProps: {
      attributes: {
        class: 'prose-note max-w-none min-h-[360px] px-4 py-3 focus:outline-none',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const Btn = ({
    label,
    title,
    active,
    onClick,
  }: {
    label: string;
    title: string;
    active?: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep selection
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded px-1.5 text-sm transition ${
        active ? 'bg-brand/15 text-brand' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
      <Btn label="B" title="Bold" active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()} />
      <Btn label="I" title="Italic" active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()} />
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <Btn label="H2" title="Heading 2" active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
      <Btn label="H3" title="Heading 3" active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <Btn label="•" title="Bullet list" active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <Btn label="1." title="Numbered list" active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <Btn label="❝" title="Quote" active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <Btn label="</>" title="Code" active={editor.isActive('codeBlock')}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <Btn label="↶" title="Undo" onClick={() => editor.chain().focus().undo().run()} />
      <Btn label="↷" title="Redo" onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}
