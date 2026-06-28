import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import type { ProfileView } from '@/lib/db/repositories/profile';
import { getOrGenerateDesignStory } from '@/lib/ai/designStory';
import { renderInlineMd } from '@/components/qa/inlineMd';

/**
 * Server-side rendered "Your Design Story" card — an AI synthesis of
 * the user's Human Design in plain conversational prose. Runs on every
 * request to the Life > Desain Manusia tab, but the actual Claude call
 * only fires when the cached `design_story` row is missing or stale
 * (the chart hash has shifted since last generation).
 */
export async function DesignStoryCard({
  profile,
  userId,
  locale,
}: {
  profile: ProfileView;
  userId: string;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: 'humanDesign' });
  const story = await getOrGenerateDesignStory(profile, userId);
  if (!story || !story.body) return null;

  const paragraphs = story.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section className="border-border rounded-3xl border bg-gradient-to-br from-violet-50/60 to-amber-50/40 px-5 py-5 shadow-sm dark:from-violet-950/20 dark:to-amber-950/15">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="text-violet-600 h-4 w-4 dark:text-violet-300" aria-hidden />
        <h3 className="font-serif text-lg font-semibold">{t('storyTitle')}</h3>
      </div>
      <div className="space-y-3 text-[14.5px] leading-relaxed text-neutral-800 dark:text-neutral-200">
        {paragraphs.map((p, i) => (
          <p key={i}>{renderInlineMd(p)}</p>
        ))}
      </div>
    </section>
  );
}
