/**
 * Decorative starfield backdrop. Pure SVG, fully presentational, intended
 * to layer behind hero content. Stars are statically placed (no random
 * jitter) so SSR and client hydration match.
 */
export function Starfield({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 400 300"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <g fill="currentColor">
        {[
          [40, 50, 1.2, 0.5],
          [120, 80, 0.9, 0.4],
          [200, 30, 1.5, 0.7],
          [280, 70, 1.1, 0.5],
          [350, 40, 0.8, 0.4],
          [60, 150, 1, 0.45],
          [180, 200, 1.3, 0.6],
          [320, 180, 0.9, 0.4],
          [380, 240, 1.1, 0.5],
          [100, 250, 1.2, 0.55],
          [240, 260, 1, 0.45],
          [30, 220, 0.9, 0.4],
          [160, 110, 0.7, 0.35],
          [260, 140, 1.4, 0.6],
        ].map(([cx, cy, r, op], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} opacity={op} />
        ))}
      </g>
    </svg>
  );
}
