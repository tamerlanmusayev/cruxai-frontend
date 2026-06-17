'use client';

import { useAiTokens } from '@/lib/socket';

const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

/**
 * Live token/credit counter for an in-flight AI request (fed by the socket
 * `ai:tokens` stream). Renders nothing when no AI op is running.
 */
export default function LiveTokens({ className = '' }: { className?: string }) {
  const live = useAiTokens();
  if (!live) return null;
  return (
    <p className={`text-xs tabular-nums text-[var(--text-muted)] ${className}`}>
      {k(live.outputTokens)} tokens · {k(live.credits)} cr
    </p>
  );
}
