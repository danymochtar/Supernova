/**
 * Static SVG layout for the Human Design bodygraph. Renders into a
 * 320 × 550 viewBox — the canonical aspect ratio of the Jovian Archive
 * bodygraph. All coordinates here are pure data, no math at runtime.
 *
 * Coordinate system: (0, 0) is top-left. Y increases downward.
 *
 * Center positions and shapes follow the Jovian Archive layout. Gate-dot
 * positions sit on the perimeter of their owning center; channel lines
 * are straight line segments between the two gate dots that complete the
 * channel.
 *
 * The bodygraph reads top-to-bottom as the chakra system flipped onto
 * its side:
 *   Head (top)  →  Ajna  →  Throat  →  G  →  Sacral  →  Root (bottom)
 *   with Heart + Solar Plexus on the right, Spleen on the left.
 */

import type { HDCenter } from '@/lib/humanDesign/types';
import { CHANNELS } from '@/lib/humanDesign/channels';

export const BODYGRAPH_VIEWBOX = { width: 320, height: 550 } as const;

export type CenterShape = 'triangle-up' | 'triangle-down' | 'square' | 'diamond';

export interface CenterLayout {
  shape: CenterShape;
  /** Center of the shape in SVG coords. */
  cx: number;
  cy: number;
  /** Edge length (for squares + triangles) or diagonal (for diamond). */
  size: number;
  /** Tailwind color class applied to the SVG fill when the center is
   *  defined. Hard-coded canonical HD colors. */
  definedFill: string;
  /** Active-gate dots positioned on the perimeter of the shape. The
   *  number is the I Ching gate; (x, y) is the dot center in viewBox
   *  coords. */
  gates: Array<{ gate: number; x: number; y: number }>;
}

/**
 * Polygon path string for a center's outline. Used to draw the shape
 * outline (always) and the fill (when defined).
 */
export function centerPath(layout: CenterLayout): string {
  const { shape, cx, cy, size } = layout;
  const h = size;
  switch (shape) {
    case 'triangle-up': {
      // Equilateral triangle, apex up.
      const half = h / 2;
      const height = (h * Math.sqrt(3)) / 2;
      const apex = [cx, cy - (2 * height) / 3];
      const left = [cx - half, cy + height / 3];
      const right = [cx + half, cy + height / 3];
      return `M ${apex[0]} ${apex[1]} L ${left[0]} ${left[1]} L ${right[0]} ${right[1]} Z`;
    }
    case 'triangle-down': {
      const half = h / 2;
      const height = (h * Math.sqrt(3)) / 2;
      const apex = [cx, cy + (2 * height) / 3];
      const left = [cx - half, cy - height / 3];
      const right = [cx + half, cy - height / 3];
      return `M ${left[0]} ${left[1]} L ${right[0]} ${right[1]} L ${apex[0]} ${apex[1]} Z`;
    }
    case 'square': {
      const half = h / 2;
      return `M ${cx - half} ${cy - half} L ${cx + half} ${cy - half} L ${cx + half} ${cy + half} L ${cx - half} ${cy + half} Z`;
    }
    case 'diamond': {
      const half = h / 2;
      return `M ${cx} ${cy - half} L ${cx + half} ${cy} L ${cx} ${cy + half} L ${cx - half} ${cy} Z`;
    }
  }
}

/**
 * Center positions on a 320×550 board. Tuned for legibility on mobile.
 * Gate-dot positions sit on the perimeter and are placed to give the
 * 36 canonical channel lines clean geometry.
 */
export const CENTER_LAYOUT: Record<HDCenter, CenterLayout> = {
  HEAD: {
    shape: 'triangle-up',
    cx: 160,
    cy: 50,
    size: 70,
    definedFill: '#fde047', // yellow
    gates: [
      { gate: 64, x: 138, y: 70 },
      { gate: 61, x: 160, y: 22 },
      { gate: 63, x: 182, y: 70 },
    ],
  },
  AJNA: {
    shape: 'triangle-down',
    cx: 160,
    cy: 130,
    size: 70,
    definedFill: '#86efac', // green
    gates: [
      { gate: 47, x: 138, y: 110 },
      { gate: 24, x: 152, y: 110 },
      { gate: 4, x: 168, y: 110 },
      { gate: 17, x: 182, y: 110 },
      { gate: 43, x: 145, y: 150 },
      { gate: 11, x: 175, y: 150 },
    ],
  },
  THROAT: {
    shape: 'square',
    cx: 160,
    cy: 215,
    size: 80,
    definedFill: '#a16207', // brown-700
    gates: [
      { gate: 62, x: 128, y: 188 },
      { gate: 23, x: 145, y: 180 },
      { gate: 56, x: 175, y: 180 },
      { gate: 35, x: 192, y: 188 },
      { gate: 12, x: 200, y: 215 },
      { gate: 45, x: 120, y: 215 },
      { gate: 33, x: 192, y: 230 },
      { gate: 8, x: 145, y: 250 },
      { gate: 31, x: 160, y: 254 },
      { gate: 7, x: 175, y: 250 },
      { gate: 1, x: 130, y: 250 },
      { gate: 13, x: 190, y: 250 },
      { gate: 20, x: 160, y: 180 },
      { gate: 16, x: 128, y: 240 },
    ],
  },
  G: {
    shape: 'diamond',
    cx: 160,
    cy: 320,
    size: 80,
    definedFill: '#facc15', // amber-400
    gates: [
      { gate: 25, x: 160, y: 282 },
      { gate: 46, x: 195, y: 320 },
      { gate: 22, x: 178, y: 302 },
      { gate: 36, x: 178, y: 338 },
      { gate: 2, x: 142, y: 302 },
      { gate: 15, x: 142, y: 338 },
      { gate: 5, x: 160, y: 358 },
      { gate: 14, x: 130, y: 320 },
      { gate: 10, x: 178, y: 320 },
    ],
  },
  HEART: {
    shape: 'triangle-down',
    cx: 230,
    cy: 290,
    size: 50,
    definedFill: '#ef4444', // red-500
    gates: [
      { gate: 21, x: 215, y: 275 },
      { gate: 40, x: 245, y: 275 },
      { gate: 26, x: 215, y: 305 },
      { gate: 51, x: 245, y: 305 },
    ],
  },
  SACRAL: {
    shape: 'square',
    cx: 160,
    cy: 420,
    size: 76,
    definedFill: '#ef4444', // red-500
    gates: [
      { gate: 34, x: 128, y: 390 },
      { gate: 5, x: 145, y: 385 },
      { gate: 14, x: 175, y: 385 },
      { gate: 29, x: 195, y: 390 },
      { gate: 59, x: 130, y: 420 },
      { gate: 9, x: 195, y: 420 },
      { gate: 3, x: 145, y: 455 },
      { gate: 42, x: 175, y: 455 },
      { gate: 27, x: 160, y: 458 },
    ],
  },
  SOLAR_PLEXUS: {
    shape: 'triangle-down',
    cx: 250,
    cy: 400,
    size: 60,
    definedFill: '#a16207', // brown-700
    gates: [
      { gate: 36, x: 232, y: 382 },
      { gate: 22, x: 268, y: 382 },
      { gate: 37, x: 232, y: 418 },
      { gate: 6, x: 250, y: 422 },
      { gate: 49, x: 268, y: 418 },
      { gate: 55, x: 240, y: 430 },
      { gate: 30, x: 260, y: 430 },
    ],
  },
  SPLEEN: {
    shape: 'triangle-down',
    cx: 70,
    cy: 400,
    size: 60,
    definedFill: '#92400e', // amber-800
    gates: [
      { gate: 48, x: 52, y: 382 },
      { gate: 57, x: 70, y: 386 },
      { gate: 44, x: 88, y: 382 },
      { gate: 50, x: 90, y: 415 },
      { gate: 32, x: 88, y: 425 },
      { gate: 28, x: 52, y: 415 },
      { gate: 18, x: 52, y: 425 },
    ],
  },
  ROOT: {
    shape: 'square',
    cx: 160,
    cy: 510,
    size: 88,
    definedFill: '#a16207', // brown-700
    gates: [
      { gate: 58, x: 128, y: 485 },
      { gate: 38, x: 145, y: 478 },
      { gate: 54, x: 175, y: 478 },
      { gate: 53, x: 192, y: 485 },
      { gate: 60, x: 200, y: 510 },
      { gate: 52, x: 120, y: 510 },
      { gate: 19, x: 130, y: 540 },
      { gate: 39, x: 190, y: 540 },
      { gate: 41, x: 160, y: 545 },
    ],
  },
};

export interface ChannelLayout {
  channelIndex: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Resolve the two endpoint coordinates for a channel by looking up its
 * gates in the center layout. When a gate is dual-anchored (appears on
 * two centers in CENTER_LAYOUT.gates), we use whichever entry the
 * iteration hits first — adequate for v1 since the rendered line stays
 * inside the bodygraph either way.
 */
function lineForChannel(channelIndex: number): ChannelLayout | null {
  const ch = CHANNELS[channelIndex];
  if (!ch) return null;
  let p1: { x: number; y: number } | null = null;
  let p2: { x: number; y: number } | null = null;
  for (const center of Object.values(CENTER_LAYOUT)) {
    for (const g of center.gates) {
      if (g.gate === ch.gates[0] && !p1) p1 = { x: g.x, y: g.y };
      if (g.gate === ch.gates[1] && !p2) p2 = { x: g.x, y: g.y };
    }
  }
  if (!p1 || !p2) return null;
  return { channelIndex, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}

/** All 36 channel line endpoints. Some channels share gate numbers, so
 *  a given gate may appear in multiple channels — the iteration order
 *  in `CENTER_LAYOUT` decides which anchor is picked for the endpoint. */
export const CHANNEL_LAYOUT: readonly ChannelLayout[] = CHANNELS.map((_, i) => lineForChannel(i)).filter(
  (x): x is ChannelLayout => x !== null,
);
