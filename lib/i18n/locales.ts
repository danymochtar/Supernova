/**
 * Supported locales registry. Source of truth for what languages the app
 * speaks — UI strings (via next-intl message bundles), AI prompt output
 * (via per-locale style notes injected into system prompts), date and
 * number formatting, and routing.
 *
 * Adding a new locale: add an entry below, run `pnpm tsx scripts/translate-messages.ts`
 * to auto-generate `messages/{code}.json` from `messages/id.json`, then
 * verify the AI output style note reads well in that language.
 */

export interface LocaleConfig {
  /** BCP-47 short code (lowercase). What URLs use, what gets stored on
   * Profile.locale, what next-intl bundle filename uses. */
  code: string;
  /** How native speakers refer to the language — shown in the language
   * picker. */
  nativeName: string;
  /** English label — fallback shown in tooltips, used in docs. */
  englishName: string;
  /** Text direction. Affects layout primitives (chat bubbles, lists). */
  dir: 'ltr' | 'rtl';
  /** Country flag emoji — purely decorative chip in the picker. */
  flag: string;
  /** Full BCP-47 tag used by Intl APIs (DateTimeFormat, NumberFormat).
   * `code` is the short URL form; this is the formatter-grade tag. */
  intlTag: string;
  /** Style overlay injected into AI system prompts. Tells the model
   * tone, register, code-mix rules, what to keep in English. Numerology
   * jargon (Life Path, Expression, Soul Urge, Personality, master
   * number, karmic debt) MUST stay in English across every locale so
   * meanings transfer. */
  aiStyleNote: string;
}

export const LOCALES: Record<string, LocaleConfig> = {
  id: {
    code: 'id',
    nativeName: 'Bahasa Indonesia',
    englishName: 'Indonesian',
    dir: 'ltr',
    flag: '🇮🇩',
    intlTag: 'id-ID',
    aiStyleNote:
      'Bahasa Indonesia santai (pakai "kamu", BUKAN "Anda"). Boleh code-mix — istilah numerologi seperti "Life Path", "Expression", "Soul Urge", "Personality", "master number", "karmic debt" TETAP dalam Bahasa Inggris. Hindari Indonesianisasi loanword: "avoid" bukan "menghindari", "transactional" bukan "transaksional", "essential" bukan "esensial". Nada hangat, reflektif, langsung — seperti teman bijak yang ngobrol di chat.',
  },
  en: {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    dir: 'ltr',
    flag: '🇬🇧',
    intlTag: 'en-US',
    aiStyleNote:
      'Conversational English. Use "you" directly. Warm, reflective but direct — like a wise friend texting. Keep numerology terms (Life Path, Expression, Soul Urge, Personality, master number, karmic debt) as-is.',
  },
  ms: {
    code: 'ms',
    nativeName: 'Bahasa Melayu',
    englishName: 'Malay',
    dir: 'ltr',
    flag: '🇲🇾',
    intlTag: 'ms-MY',
    aiStyleNote:
      'Bahasa Melayu santai (pakai "kamu" atau "awak"). Boleh code-mix dengan English — istilah numerologi seperti "Life Path", "Expression", "Soul Urge", "Personality", "master number", "karmic debt" KEKAL dalam Bahasa Inggeris. Nada hangat dan praktikal, macam kawan yang bijak.',
  },
  zh: {
    code: 'zh',
    nativeName: '简体中文',
    englishName: 'Chinese (Simplified)',
    dir: 'ltr',
    flag: '🇨🇳',
    intlTag: 'zh-Hans',
    aiStyleNote:
      '简体中文，使用「你」称呼用户，语气温暖、反思而直接 — 像一位睿智的朋友在闲聊。数字命理学术语（Life Path, Expression, Soul Urge, Personality, master number, karmic debt）保持英文原词，不翻译。避免书面化或过于正式的表达。',
  },
  ja: {
    code: 'ja',
    nativeName: '日本語',
    englishName: 'Japanese',
    dir: 'ltr',
    flag: '🇯🇵',
    intlTag: 'ja-JP',
    aiStyleNote:
      'カジュアルで温かい日本語。「あなた」または親しみのある語り口で話しかける。数秘術の用語（Life Path, Expression, Soul Urge, Personality, master number, karmic debt）は英語のまま使用。命令形ではなく、寄り添う敬体。重すぎず、軽すぎず — 賢い友人がチャットで話しかけるトーン。',
  },
  ko: {
    code: 'ko',
    nativeName: '한국어',
    englishName: 'Korean',
    dir: 'ltr',
    flag: '🇰🇷',
    intlTag: 'ko-KR',
    aiStyleNote:
      '친근하고 따뜻한 한국어. "당신" 또는 부드러운 말투로 사용자에게 말 걸기. 수비학 용어(Life Path, Expression, Soul Urge, Personality, master number, karmic debt)는 영어 원어 그대로 유지. 명령조보다는 권유 어조 — 지혜로운 친구가 채팅으로 말하는 톤.',
  },
  es: {
    code: 'es',
    nativeName: 'Español',
    englishName: 'Spanish',
    dir: 'ltr',
    flag: '🇪🇸',
    intlTag: 'es-ES',
    aiStyleNote:
      'Español cálido y directo. Usa "tú" (NO "usted"). Términos de numerología (Life Path, Expression, Soul Urge, Personality, master number, karmic debt) se mantienen en inglés. Tono reflexivo pero práctico — como un amigo sabio chateando.',
  },
  ar: {
    code: 'ar',
    nativeName: 'العربية',
    englishName: 'Arabic',
    dir: 'rtl',
    flag: '🇸🇦',
    intlTag: 'ar-SA',
    aiStyleNote:
      'عربية فصحى مبسطة وودودة. استخدم «أنت» بشكل مباشر. مصطلحات علم الأعداد (Life Path, Expression, Soul Urge, Personality, master number, karmic debt) تبقى بالإنجليزية. نبرة دافئة وتأملية لكن صريحة — مثل صديق حكيم يتحدث عبر الدردشة.',
  },
};

/** All enabled locales as a const-asserted tuple — used by next-intl
 * middleware. To gate a locale behind a feature flag, comment its entry
 * here without removing the LOCALES record entry. */
export const LOCALE_CODES = [
  'id',
  'en',
  'ms',
  'zh',
  'ja',
  'ko',
  'es',
  'ar',
] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

export const DEFAULT_LOCALE: LocaleCode = 'id';

export function isLocaleCode(value: string): value is LocaleCode {
  return (LOCALE_CODES as readonly string[]).includes(value);
}

/** Safe lookup — returns the default locale's config if `code` isn't a
 * known locale. Use this at boundaries where the caller might pass an
 * arbitrary string (URL params, DB rows from older accounts). */
export function getLocaleConfig(code: string): LocaleConfig {
  return LOCALES[code] ?? LOCALES[DEFAULT_LOCALE]!;
}

/** Helper for tables that only have a subset of locales filled in — falls
 * back to the default locale's entry when the current locale is missing.
 * Used by legacy lookup tables (numerology meanings, badge labels, greetings)
 * that pre-date the multi-locale rollout. */
export function pickLocalized<T>(
  map: Partial<Record<LocaleCode, T>>,
  locale: LocaleCode,
): T {
  return map[locale] ?? map[DEFAULT_LOCALE]!;
}
