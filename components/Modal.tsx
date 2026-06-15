'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * App-wide modal: renders through a portal to <body> so the full-screen
 * blurred backdrop always covers the whole site (immune to ancestor
 * transforms like the page-enter animation). Closes on backdrop click / Esc.
 */
export default function Modal({
  onClose,
  children,
  className = 'max-w-sm',
}: {
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm animate-[fade-in_0.2s_ease] sm:items-center sm:p-8"
      onClick={onClose}
    >
      <div
        className={`glass relative my-auto w-full p-6 shadow-2xl animate-[hiw-rise_0.25s_ease-out] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
