/**
 * Prompt builders for the "Your Design Story" surface — a one-shot
 * AI synthesis of the user's Human Design read in plain conversational
 * language. Caches one row per (userId, locale) in the `design_story`
 * table; regenerates when the underlying HD chart changes (chartHash).
 *
 * Voice inherits the plain-language rule from commit `0f6f15c`: no
 * literary analogies, no "kayak…/like…/imagine…" patterns. The output
 * should read like a friend describing how this person operates.
 */

import type { Locale } from '@/lib/i18n/config';
import type {
  HDAuthority,
  HDDefinition,
  HDStrategy,
  HDType,
} from '@/lib/humanDesign/types';
import { localizeEnglishPrompt } from './_localize';
import { VOICE_ID, VOICE_EN } from './_voice';

export interface DesignStoryInput {
  locale: Locale;
  firstName: string;
  type: HDType;
  strategy: HDStrategy;
  authority: HDAuthority;
  profileConscious: number;
  profileUnconscious: number;
  definition: HDDefinition;
  incarnationCrossName: string | null;
  /** Active gates across personality + design — gives the model some
   *  per-chart specificity beyond the 5 user-facing fields. */
  activeGates: number[];
  /** Defined-center names (e.g., ['SACRAL', 'SPLEEN']) — drives "what
   *  in your design is stable and reliable" framing. */
  definedCenters: string[];
}

/**
 * Version tag baked into the generated story's `chartHash`. Bump when
 * the system prompt changes substantively so all cached stories
 * invalidate on next read.
 */
export const DESIGN_STORY_PROMPT_VERSION = 'v1';

export function buildDesignStorySystem(locale: Locale): string {
  if (locale === 'id') {
    return `Kamu lagi nulis "Your Design Story" buat seorang user di app numerologi Supernova. Sumbernya: Human Design (sistem Ra Uru Hu) — sintesis dari I Ching, astrologi, Kabbalah, dan chakra system.

Tujuannya: jelasin ke user gimana desain mereka muncul di kehidupan sehari-hari. BUKAN kuliah numerologi. BUKAN list term HD. Gaya: temen yang ngerti kamu, lagi cerita gimana kamu beroperasi.

ATURAN:
- 2-3 paragraf, total 180-260 kata.
- TIDAK menyebut istilah HD literal di tubuh tulisan (Generator, Manifestor, Strategy, Authority, Sacral, dst.). Lebur jadi instinct sehari-hari.
- TIDAK pake metafora literer ("kayak…", "ibaratkan…", "seperti…"). Bahasa polos langsung — "kamu lebih bagus pas nanggepin yang udah ada" lebih bagus daripada "kamu kayak danau yang nungguin batu nyentuh permukaan."
- Mulai dari cara user paling bagus ambil keputusan, lanjut ke energi kerja yang konsisten, tutup dengan satu hal yang sering jadi blindspot kalau dia maksa lawan desainnya.
- Pakai "kamu", bukan "Anda".
- Sebut nama depan user maksimal sekali.

${VOICE_ID}

Output: plain prose, tanpa heading, tanpa bullet, tanpa label.`;
  }
  return localizeEnglishPrompt(`You're writing "Your Design Story" for a user in the Supernova numerology app. Source: Human Design (Ra Uru Hu's system) — a synthesis of I Ching, astrology, Kabbalah, and the chakra system.

Goal: tell the user how their design shows up in everyday life. NOT a numerology lecture. NOT a list of HD terms. Voice: a friend who knows them, describing how they operate.

RULES:
- 2-3 paragraphs, 180-260 words total.
- DO NOT name HD terms literally in the body (Generator, Manifestor, Strategy, Authority, Sacral, etc.). Weave them as everyday instinct.
- DO NOT use literary metaphors ("like…", "as if…", "imagine…"). Plain direct language — "you do best when responding to what's already there" beats "you're like a lake waiting for a stone to touch the surface."
- Start from how the user best makes decisions, move to the kind of work-energy that's consistent for them, close with one common blindspot when they force against the design.
- Use the second person ("you"). Mention the user's first name at most once.

${VOICE_EN}

Output: plain prose, no headings, no bullets, no labels.`, locale);
}

export function buildDesignStoryUserPrompt(input: DesignStoryInput): string {
  return `<profile>
first_name: ${input.firstName}
type: ${input.type}
strategy: ${input.strategy}
authority: ${input.authority}
profile: ${input.profileConscious}/${input.profileUnconscious}
definition: ${input.definition}
${input.incarnationCrossName ? `incarnation_cross: ${input.incarnationCrossName}` : ''}
defined_centers: ${input.definedCenters.join(', ') || '(none)'}
active_gate_count: ${input.activeGates.length}
</profile>

Write the Design Story for ${input.firstName}.`;
}
