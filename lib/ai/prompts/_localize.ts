import type { Locale } from '@/lib/i18n/config';
import { getLocaleConfig } from '@/lib/i18n/locales';

/**
 * Prepend a language directive + style overlay to an English-base system
 * prompt so the model writes its output in the target locale.
 *
 * Pattern used across `lib/ai/prompts/*.ts`: the legacy ID prompt is kept
 * verbatim (highest-quality hand-tuned copy for the largest user base),
 * the legacy EN prompt becomes the universal template, and every other
 * locale wraps that EN template with a directive built from the locale's
 * `aiStyleNote`. The model adapts the inline English examples (which
 * mostly demonstrate prose structure, not vocabulary) to the target
 * language naturally.
 *
 * Numerology jargon (Life Path, Expression, Soul Urge, Personality,
 * master number, karmic debt, etc.) MUST be preserved as English across
 * every locale — every style note repeats this rule.
 */
export function localizeEnglishPrompt(template: string, locale: Locale): string {
  const cfg = getLocaleConfig(locale);
  // ID and EN keep their hand-tuned legacy prompts elsewhere; this
  // helper is only ever called for the non-ID branch (and for EN itself
  // the directive is a no-op style restatement).
  const directive = `OUTPUT LANGUAGE: ${cfg.nativeName} (${cfg.englishName}).
LOCALE STYLE: ${cfg.aiStyleNote}

The English examples below illustrate STRUCTURE — adapt their wording into ${cfg.nativeName} while keeping the structural shape and the English numerology terms intact.

---

`;
  return directive + template;
}
