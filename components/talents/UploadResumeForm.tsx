'use client';

import { useRef, useState, useTransition } from 'react';
import { FileUp, Loader2 } from 'lucide-react';
import type { UploadResumeResult } from '@/app/[locale]/talents/career/actions';

interface Props {
  action: (formData: FormData) => Promise<UploadResumeResult>;
  labels: {
    cta: string;
    parsing: string;
    success: string;
    errorNoFile: string;
    errorWrongType: string;
    errorTooLarge: string;
    errorParseFailed: string;
    errorNoRoles: string;
    errorGeneric: string;
  };
}

// Vercel's serverless function body limit is 4.5 MB even when Next's
// serverActions.bodySizeLimit is set higher — the platform rejects the
// upload before the action runs, which would surface as a React render
// crash rather than a clean error. Cap the client a hair below that.
const CLIENT_MAX_BYTES = 4 * 1024 * 1024;

const ERROR_KEY: Record<Exclude<UploadResumeResult, { ok: true }>['error'], keyof Props['labels']> = {
  unauth: 'errorGeneric',
  no_profile: 'errorGeneric',
  no_file: 'errorNoFile',
  wrong_type: 'errorWrongType',
  too_large: 'errorTooLarge',
  parse_failed: 'errorParseFailed',
  no_roles: 'errorNoRoles',
  generic: 'errorGeneric',
};

export function UploadResumeForm({ action, labels }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > CLIENT_MAX_BYTES) {
      setError(labels.errorTooLarge);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    const fd = new FormData();
    fd.append('resume', file);
    start(async () => {
      try {
        const res = await action(fd);
        if (!res.ok) {
          setError(labels[ERROR_KEY[res.error]]);
          if (inputRef.current) inputRef.current.value = '';
        }
      } catch (err) {
        // Network/platform-layer failures (e.g., Vercel rejecting the body
        // before the action runs) throw rather than returning a result.
        // Catch so we render a clean message instead of triggering the
        // root error boundary.
        console.error('[upload] action threw', err);
        setError(labels.errorGeneric);
        if (inputRef.current) inputRef.current.value = '';
      }
    });
  }

  return (
    <div className="space-y-2">
      <label
        className={`border-border press-soft hover:bg-muted/40 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white/40 px-6 py-5 text-sm font-medium transition dark:bg-neutral-900/40 ${
          pending ? 'pointer-events-none opacity-60' : ''
        }`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <FileUp className="h-4 w-4" aria-hidden />
        )}
        <span>{pending ? labels.parsing : labels.cta}</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          onChange={onChange}
          disabled={pending}
          className="hidden"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
