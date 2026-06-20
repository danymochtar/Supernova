'use client';

import { useEffect, useRef, useState } from 'react';

interface CityHit {
  name: string;
  label: string;
  lat: number;
  lon: number;
  timezone: string;
}

interface Props {
  /** The hidden form fields submit `birthCity`, `birthLat`, `birthLon`,
   *  `birthTimezone`. These names match the server-action read paths. */
  fieldPrefix?: string;
  /** Initial display value when editing an existing row. */
  defaultLabel?: string | null;
  /** Initial hidden values — used to pre-fill the form when the row
   *  already has a city saved. */
  defaultLat?: number | null;
  defaultLon?: number | null;
  defaultTimezone?: string | null;
  /** Label / placeholder strings (i18n). */
  label: string;
  placeholder: string;
  /** Hint shown under the input when no city is selected. */
  hint: string;
  /** "Tidak ada hasil" empty-state message. */
  emptyText: string;
}

/**
 * Birth-place combobox — typeahead over the `city-timezones` dataset.
 * Hits `/api/zodiac/cities?q=` with a 250ms debounce, renders the top
 * 10 matches, and writes the chosen city's label + lat / lon /
 * timezone into hidden form fields so the parent form's submit handler
 * picks them up via FormData.
 *
 * If the user clears the input, all four hidden fields go blank — the
 * server action treats that as "no birth city set" and falls back to
 * the timezone-center approximation in `lib/zodiac/birthChart.ts`.
 */
export function BirthCityCombobox({
  defaultLabel,
  defaultLat,
  defaultLon,
  defaultTimezone,
  label,
  placeholder,
  hint,
  emptyText,
}: Props) {
  const [query, setQuery] = useState(defaultLabel ?? '');
  const [hits, setHits] = useState<CityHit[]>([]);
  const [selected, setSelected] = useState<CityHit | null>(
    defaultLabel && defaultLat != null && defaultLon != null && defaultTimezone
      ? {
          name: defaultLabel.split(',')[0]?.trim() ?? defaultLabel,
          label: defaultLabel,
          lat: defaultLat,
          lon: defaultLon,
          timezone: defaultTimezone,
        }
      : null,
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch matches when the query changes (debounced).
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2 || (selected && query === selected.label)) {
      setHits([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`/api/zodiac/cities?q=${encodeURIComponent(query.trim())}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) {
          setHits([]);
          return;
        }
        const json = (await res.json()) as { results: CityHit[] };
        setHits(json.results);
      } catch {
        // Abort or network error — leave hits alone.
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  function pick(hit: CityHit) {
    setSelected(hit);
    setQuery(hit.label);
    setOpen(false);
    setHits([]);
  }

  function onChangeQuery(value: string) {
    setQuery(value);
    setOpen(true);
    // Clear the selection only if the user typed something that
    // doesn't match the current selection's label.
    if (selected && value !== selected.label) setSelected(null);
  }

  return (
    <div className="space-y-1">
      <label
        htmlFor="birthCity"
        className="text-muted-foreground text-xs font-medium uppercase tracking-wider"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id="birthCity"
          name="birthCity"
          type="text"
          autoComplete="off"
          value={query}
          onChange={(e) => onChangeQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
        />
        {open && (hits.length > 0 || (query.trim().length >= 2 && !loading)) ? (
          <ul className="border-border absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border bg-surface-1 shadow-lg">
            {hits.length === 0 && !loading ? (
              <li className="text-muted-foreground px-3 py-2 text-xs italic">
                {emptyText}
              </li>
            ) : (
              hits.map((hit) => (
                <li key={`${hit.label}:${hit.lat}:${hit.lon}`}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault(); // prevent input blur
                      pick(hit);
                    }}
                    className="hover:bg-muted/60 block w-full px-3 py-2 text-left text-sm"
                  >
                    <span className="font-medium">{hit.name}</span>
                    {hit.label !== hit.name ? (
                      <span className="text-muted-foreground ml-1.5 text-xs">
                        {hit.label.slice(hit.name.length + 2)}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
      {!selected ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {/* Hidden coords that travel with the form. The visible input
       *  named `birthCity` already carries the display label. */}
      <input type="hidden" name="birthLat" value={selected ? String(selected.lat) : ''} />
      <input type="hidden" name="birthLon" value={selected ? String(selected.lon) : ''} />
      <input
        type="hidden"
        name="birthTimezone"
        value={selected ? selected.timezone : ''}
      />
    </div>
  );
}
