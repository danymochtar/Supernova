'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@/lib/auth/client';

export function SignOutButton({ label, locale }: { label: string; locale: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline disabled:opacity-50"
    >
      {label}
    </button>
  );
}
