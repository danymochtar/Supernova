#!/usr/bin/env node
// Render public/icons/icon.svg to PNG variants for the manifest.
// Run after editing icon.svg: `pnpm icons:gen`.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = join(__dirname, '..', 'public', 'icons');

const SVG_SOURCE = readFileSync(join(ICONS_DIR, 'icon.svg'), 'utf8');

/**
 * Render at the given pixel size and write to disk.
 * @param {number} size square dimension in px
 * @param {string} filename relative to ICONS_DIR
 */
function render(size, filename) {
  const resvg = new Resvg(SVG_SOURCE, {
    fitTo: { mode: 'width', value: size },
    background: 'rgba(11, 10, 20, 1)',
  });
  const pngBuffer = resvg.render().asPng();
  writeFileSync(join(ICONS_DIR, filename), pngBuffer);
  console.log(`✓ ${filename}  ${size}×${size}  ${(pngBuffer.length / 1024).toFixed(1)}kB`);
}

// "any" purpose
render(192, 'icon-192.png');
render(512, 'icon-512.png');
// "maskable" — same source; the SVG's central content sits inside the 80%
// safe zone so it survives round/rounded-square mask shapes.
render(512, 'icon-maskable-512.png');
// iOS apple-touch-icon (180x180 is iOS preferred)
render(180, 'apple-touch-icon.png');
