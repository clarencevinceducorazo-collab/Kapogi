'use client';

import { useKeySequence } from '@/hooks/useKeySequence';
import { TestModal } from '@/components/kapogian/modal';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const { triggered, reset } = useKeySequence('Developers');

  return (
    <>
      {triggered && <TestModal onClose={reset} />}
      {children}
    </>
  );
}