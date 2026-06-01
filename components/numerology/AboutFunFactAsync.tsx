import { Sparkles } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { getOrGenerateAboutFunFact } from '@/lib/ai/aboutFunFact';
import { Skeleton } from '@/components/layout/Skeleton';

/**
 * Tiny "pattern lately" line for the bio card. Renders nothing when the
 * user doesn't have enough journal material yet (<3 entries) or when the
 * AI call fails — keeps the card clean instead of showing a broken slot.
 */
export async function AboutFunFactAsync({ userId, locale }: { userId: string; locale: Locale }) {
  const text = await getOrGenerateAboutFunFact(userId, locale);
  if (!text) return null;
  return (
    <div className="border-border/60 mt-3 flex items-start gap-2 border-t pt-3 text-sm">
      <Sparkles className="text-accent mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <p className="text-muted-foreground leading-snug">{text}</p>
    </div>
  );
}

/** Lightweight skeleton — the bio card already has structure, this is just
 *  a hint that one more line is loading. */
export function AboutFunFactSkeleton() {
  return (
    <div className="border-border/60 mt-3 flex items-start gap-2 border-t pt-3">
      <Sparkles className="text-accent/40 mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <Skeleton className="h-4 w-3/4 rounded" />
    </div>
  );
}
