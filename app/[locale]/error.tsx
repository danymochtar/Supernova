'use client';

import { useEffect } from 'react';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[locale-error-boundary]', error);
  }, [error]);

  return (
    <main className="container max-w-2xl py-12">
      <h1 className="text-xl font-semibold text-red-700 dark:text-red-300">Server-side error</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Digest: <code className="bg-surface-2 rounded px-1">{error.digest ?? '(none)'}</code>
      </p>
      <pre className="mt-4 whitespace-pre-wrap rounded bg-red-50 p-4 text-xs text-red-900 dark:bg-red-950/30 dark:text-red-200">
        {error.message || '(no message)'}
      </pre>
      {error.stack ? (
        <pre className="text-muted-foreground bg-surface-2 mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded p-4 text-[11px]">
          {error.stack}
        </pre>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="press bg-primary text-primary-foreground mt-6 rounded-full px-4 py-2 text-sm font-medium"
      >
        Try again
      </button>
    </main>
  );
}
