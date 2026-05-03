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
      <h1 className="text-xl font-semibold text-red-700">Server-side error</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Digest: <code className="rounded bg-neutral-100 px-1">{error.digest ?? '(none)'}</code>
      </p>
      <pre className="mt-4 whitespace-pre-wrap rounded bg-red-50 p-4 text-xs text-red-900">
        {error.message || '(no message)'}
      </pre>
      {error.stack ? (
        <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded bg-neutral-100 p-4 text-[11px] text-neutral-700">
          {error.stack}
        </pre>
      ) : null}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
