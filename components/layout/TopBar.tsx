import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

/**
 * Lightweight top app bar for sub-pages. Optional back arrow and a centered
 * title. Use on any page that isn't a primary tab destination.
 */
export function TopBar({
  title,
  backHref,
  trailing,
}: {
  title: string;
  backHref?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <header
      className="border-border bg-background/95 sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-2 border-b px-4 backdrop-blur sm:-mx-6 sm:px-6 supports-[backdrop-filter]:bg-background/80"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        minHeight: 'calc(3.5rem + env(safe-area-inset-top))',
      }}
    >
      {backHref ? (
        <Link
          href={backHref}
          aria-label="Back"
          className="hover:bg-muted/40 -ml-2 flex h-9 w-9 items-center justify-center rounded-full"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
      ) : (
        <span className="w-9" aria-hidden />
      )}
      <h1 className="flex-1 truncate text-center text-base font-semibold tracking-tight">
        {title}
      </h1>
      <div className="flex h-9 w-9 items-center justify-end">{trailing}</div>
    </header>
  );
}
