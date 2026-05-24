'use client';

import Link from 'next/link';
import { Compass, Sparkles } from 'lucide-react';

export type KehidupanTab = 'tentang' | 'perjalanan';

interface Props {
  /** Current active tab. */
  active: KehidupanTab;
  /** Base path without query, e.g. "/id/kehidupan". */
  basePath: string;
  labels: { tentang: string; perjalanan: string };
}

/**
 * Segmented control switching between the two Kehidupan sub-views. Uses
 * <Link> + a `?tab=` query param (not client state) so each view is its
 * own server render — deep-linkable, and only the active view's AI runs.
 * Mirrors the calendar/list toggle styling in JournalView.
 */
export function KehidupanTabs({ active, basePath, labels }: Props) {
  const items: { key: KehidupanTab; label: string; icon: typeof Sparkles }[] = [
    { key: 'tentang', label: labels.tentang, icon: Sparkles },
    { key: 'perjalanan', label: labels.perjalanan, icon: Compass },
  ];
  return (
    <div className="border-border bg-surface-1 inline-flex rounded-full border p-1">
      {items.map(({ key, label, icon: Icon }) => {
        const isActive = key === active;
        return (
          <Link
            key={key}
            href={key === 'tentang' ? basePath : `${basePath}?tab=${key}`}
            scroll={false}
            aria-current={isActive ? 'page' : undefined}
            className={`press-soft inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
