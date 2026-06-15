'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Graph, GraphNode, getGraph } from '@/lib/api';
import AiProgress from '@/components/AiProgress';
import { useT } from '@/lib/i18n';

const DIFF_COLOR: Record<string, string> = {
  EASY: '#34d399',
  MEDIUM: '#818cf8',
  HARD: '#f472b6',
};

export default function GraphPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const [graph, setGraph] = useState<Graph | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<GraphNode | null>(null);

  useEffect(() => {
    let on = true;
    getGraph(id)
      .then((g) => on && setGraph(g))
      .catch((e) => on && setError((e as Error).message));
    return () => {
      on = false;
    };
  }, [id]);

  const layout = useMemo(() => {
    if (!graph) return null;
    const W = 720, H = 520, cx = W / 2, cy = H / 2;
    const R = Math.min(cx, cy) - 70;
    const pos = new Map<string, { x: number; y: number }>();
    graph.nodes.forEach((n, i) => {
      const a = (i / graph.nodes.length) * Math.PI * 2 - Math.PI / 2;
      pos.set(n.id, { x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) });
    });
    return { W, H, pos };
  }, [graph]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('graph.title')}</h1>
        <Link href={`/doc/${id}`} className="text-sm text-brand hover:underline">
          {t('quiz.summary')}
        </Link>
      </div>

      {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

      {!graph && !error && (
        <AiProgress steps={[t('prog.read'), t('prog.map'), t('prog.almost')]} />
      )}

      {graph && layout && (
        <div className="glass mt-6 overflow-hidden p-2">
          <svg viewBox={`0 0 ${layout.W} ${layout.H}`} className="w-full">
            {graph.edges.map((e, i) => {
              const a = layout.pos.get(e.from);
              const b = layout.pos.get(e.to);
              if (!a || !b) return null;
              return (
                <line
                  key={i}
                  x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                />
              );
            })}
            {graph.nodes.map((n) => {
              const p = layout.pos.get(n.id)!;
              return (
                <g
                  key={n.id}
                  className="cursor-pointer"
                  onClick={() => setActive(n)}
                >
                  <circle
                    cx={p.x} cy={p.y} r={active?.id === n.id ? 13 : 9}
                    fill={DIFF_COLOR[n.difficulty] ?? '#818cf8'}
                  />
                  <text
                    x={p.x} y={p.y - 16}
                    textAnchor="middle"
                    className="fill-slate-200"
                    style={{ fontSize: 11 }}
                  >
                    {n.name.length > 22 ? n.name.slice(0, 21) + '…' : n.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {active && (
        <div className="glass mt-4 p-5">
          <p className="font-semibold text-ink">{active.name}</p>
          <p className="mt-1 text-sm text-slate-400">{active.summary}</p>
        </div>
      )}
    </div>
  );
}
