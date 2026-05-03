'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Wrap children in a next-themes provider that mirrors the user's
 * profile.theme preference. Supports light / dark / system. Adds the
 * "dark" class on <html> automatically based on resolved theme.
 *
 * `defaultTheme` comes from the server (profile.theme) so the user's
 * choice is respected on first paint without a flash.
 */
export function ThemeProvider({
  defaultTheme,
  children,
}: {
  defaultTheme: 'light' | 'dark' | 'auto';
  children: ReactNode;
}) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme={defaultTheme === 'auto' ? 'system' : defaultTheme}
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemeProvider>
  );
}
