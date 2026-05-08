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
    const fd = new FormData();
    fd.append('resume', file);
    start(async () => {
      const res = await action(fd);
      if (!res.ok) {
        setError(labels[ERROR_KEY[res.error]]);
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
