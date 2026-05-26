import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import type { Category } from '@/lib/curhat/categories';
import type { Locale } from '@/lib/i18n/config';

/**
 * Floating "curhat" button — one per capability page. A fixed chat-icon FAB
 * that deep-links to the Curhat tab pre-tagged with a category (and an
 * optional person to focus on), so the chat opens with a topic chip and the
 * resulting journal entry inherits the category. Plain server Link (no client
 * JS). `className` overrides position — used on the person page to stack this
 * above the Vibes FAB instead of overlapping it.
 */
export function CurhatShortcut({
  locale,
  topic,
  personId,
  label,
  className = 'bottom-24 right-4',
}: {
  locale: Locale;
  topic: Category;
  personId?: string;
  /** Accessible label (also the screen-reader description of the icon). */
  label: string;
  className?: string;
}) {
  const params = new URLSearchParams({ topic });
  if (topic === 'relationship' && personId) params.set('personId', personId);
  const href = `/${locale}/ask?${params.toString()}`;

  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className={`from-primary to-accent text-primary-foreground press fixed z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br shadow-lg ${className}`}
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </Link>
  );
}
