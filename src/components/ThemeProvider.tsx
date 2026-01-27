'use client';

import * as React from 'react';

// For now, this is a simple pass-through.
// It can be expanded later to support light/dark themes.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
