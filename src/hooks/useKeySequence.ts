'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Hook: listens for any typed sequence ─────────────────────────────────────
export function useKeySequence(targetSequence: string, timeoutMs = 1500) {
  const [triggered, setTriggered] = useState(false);
  const [buffer, setBuffer] = useState('');

  const reset = useCallback(() => {
    setBuffer('');
    setTriggered(false);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const key = e.key.toLowerCase();
      if (key.length !== 1) return; // ignore Shift, Enter, etc.

      setBuffer((prev) => {
        const next = (prev + key).slice(-targetSequence.length);
        if (next === targetSequence.toLowerCase()) {
          setTriggered(true);
        }
        return next;
      });

      // Reset buffer after idle
      clearTimeout(timer);
      timer = setTimeout(() => setBuffer(''), timeoutMs);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearTimeout(timer);
    };
  }, [targetSequence, timeoutMs]);

  return { triggered, reset };
}