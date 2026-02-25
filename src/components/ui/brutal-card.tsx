import React from 'react';

export const BrutalCard = ({
  children,
  className = '',
  noPadding = false,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) => (
  <div
    className={`bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden ${className}`}
  >
    <div className={noPadding ? '' : 'p-6'}>{children}</div>
  </div>
);
