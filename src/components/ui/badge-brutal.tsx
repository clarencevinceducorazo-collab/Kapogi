import React from 'react';
import { cn } from '@/lib/utils';

export const BrutalBadge = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      'px-2 py-0.5 border-2 border-black rounded font-black text-[9px] uppercase tracking-wider',
      className
    )}
  >
    {children}
  </span>
);
