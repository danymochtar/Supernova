'use client';

import Link from 'next/link';
import { Compass, Heart, Moon, Network, Sparkles, Wallet } from 'lucide-react';

export type KehidupanTab =
  | 'tentang'
  | 'perjalanan'
  | 'percintaan'
  | 'keuangan'
  | 'zodiak'
  | 'desainManusia';

interface Props {
  /** Current active tab. */
  active: KehidupanTab;
  /** Base path without query, e.g. "/id/kehidupan". */
  basePath: string;
  labels: Record<KehidupanTab, string>;
}

/**
 * Segmented control switching between the Kehidupan sub-views. Uses
 * <Link> + a `?tab=` query param (not client state) so each view is its
 * own server render — deep-linkable, and only the active view's AI runs.
 * Horizontally scrollable since five labels overflow a mobile row.
 */
export function KehidupanTabs({ active, basePath, labels }: Props) {
  const items: { key: KehidupanTab; icon: typeof Sparkles }[] = [
    { key: 'tentang', icon: Sparkles },
    { key: 'perjalanan', icon: Compass },
    { key: 'percintaan', icon: Heart },
    { key: 'keuangan', icon: Wallet },
    { key: 'zodiak', icon: Moon },
    { key: 'desainManusia', icon: Network },
  ];
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="border-border bg-surface-1 inline-flex shrink-0 rounded-full border p-1">
        {items.map(({ key, icon: Icon }) => {
          const isActive = key === active;
          return (
            <Link
              key={key}
              href={key === 'tentang' ? basePath : `${basePath}?tab=${key}`}
              scroll={false}
              aria-current={isActive ? 'page' : undefined}
              className={`press-soft inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {labels[key]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
