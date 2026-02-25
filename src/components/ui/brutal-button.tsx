'use client';
import React from 'react';
import { cn } from '@/lib/utils';

type BrutalButtonVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'danger'
  | 'black'
  | 'purple'
  | 'teal'
  | 'orange'
  | 'yellow';

export const BrutalButton = ({
  children,
  onClick,
  className = '',
  variant = 'default',
  disabled = false,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: BrutalButtonVariant;
  disabled?: boolean;
  title?: string;
}) => {
  const variants: Record<BrutalButtonVariant, string> = {
    default: 'bg-white text-black hover:bg-gray-50',
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    black: 'bg-black text-white hover:bg-gray-800',
    purple: 'bg-purple-500 text-white hover:bg-purple-600',
    teal: 'bg-teal-500 text-white hover:bg-teal-600',
    orange: 'bg-orange-500 text-white hover:bg-orange-600',
    yellow: 'bg-yellow-400 text-black hover:bg-yellow-500',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-10 px-4 border-2 border-black rounded-xl font-black text-xs uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:active:translate-y-0',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};
