import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import type { Category } from '@/lib/curhat/categories';
import type { Locale } from '@/lib/i18n/config';

/**
 * Subtle "Curhat soal ini" shortcut — one per capability page. Deep-links to
 * the Curhat tab pre-tagged with a category (and an optional person to focus
 * on), so the chat opens with a topic chip and the resulting journal entry
 * inherits the category. Server component (plain Link), no client JS.
 */
export function CurhatShortcut({
  locale,
  topic,
  personId,
  label,
  className = '',
}: {
  locale: Locale;
  topic: Category;
  personId?: string;
  label: string;
  className?: string;
}) {
  const params = new URLSearchParams({ topic });
  if (topic === 'relationship' && personId) params.set('personId', personId);
  const href = `/${locale}/ask?${params.toString()}`;

  return (
    <Link
      href={href}
      className={`press-soft border-border text-primary hover:bg-muted/40 inline-flex items-center gap-1.5 rounded-full border bg-surface-1 px-3 py-1.5 text-xs font-medium transition-colors ${className}`}
    >
      <MessageCircle className="h-3.5 w-3.5" aria-hidden />
      {label}
    </Link>
  );
}
