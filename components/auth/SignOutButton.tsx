'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signOut } from '@/lib/auth/client';

// Wipe the PWA's runtime caches before redirecting. Without this, the
// next sign-in on the same browser (same user OR a different one on a
// shared device) could be served a stale dashboard / people page from
// the workbox NetworkFirst cache before the network resolves.
async function clearPwaCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter((n) => n.startsWith('supernova-'))
        .map((n) => caches.delete(n)),
    );
  } catch {
    // Best effort — a failed cache wipe shouldn't block sign-out.
  }
}

export function SignOutButton({ label, locale }: { label: string; locale: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    await signOut();
    await clearPwaCaches();
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
