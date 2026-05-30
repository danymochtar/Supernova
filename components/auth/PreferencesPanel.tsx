'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { AlertTriangle, Bell, Brain, Download, Languages, MessageCircle, NotebookPen, Palette, Sparkles, Trash2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import { LOCALES, LOCALE_CODES } from '@/lib/i18n/locales';
import {
  setTheme,
  setTone,
  setChatMode,
  setShowKarmicDebt,
  setAutoJournal,
  setPreferredModel,
  setReminder,
  setLocaleAction,
  exportUserData,
  deleteAccount,
} from '@/app/[locale]/me/actions';

/**
 * Inline row layout used inside SettingsGroup cards. No outer border —
 * the parent card supplies it. Icon left, title + hint stacked, control
 * on the right (or below for taller controls).
 */
function Row({
  icon: Icon,
  title,
  hint,
  children,
  stack = false,
}: {
  icon: typeof Palette;
  title: string;
  hint?: string;
  children: React.ReactNode;
  /** Place control underneath the title row instead of beside it. */
  stack?: boolean;
}) {
  return (
    <div className="space-y-3 px-5 py-4">
      <div className="flex items-start gap-3">
        <Icon className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </div>
        {!stack ? <div className="shrink-0">{children}</div> : null}
      </div>
      {stack ? children : null}
    </div>
  );
}

function Toggle({
  on,
  onChange,
  ariaLabel,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={ariaLabel}
      onClick={() => onChange(!on)}
      className={`press relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        on ? 'bg-primary' : 'bg-muted'
      }`}
    >
      <span
        className={`bg-background absolute h-5 w-5 transform rounded-full shadow transition-transform ${
          on ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Segmented<T extends string>({
  value,
  options,
  labelFor,
  onChange,
}: {
  value: T;
  options: readonly T[];
  labelFor: (v: T) => string;
  onChange: (v: T) => void;
}) {
  return (
    <div className="border-border inline-flex items-stretch overflow-hidden rounded-full border text-xs">
      {options.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`press px-3 py-1.5 font-medium transition-colors ${
            value === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/40'
          }`}
          aria-pressed={value === v}
        >
          {labelFor(v)}
        </button>
      ))}
    </div>
  );
}

export function ThemeRow({ initial }: { initial: 'light' | 'dark' | 'auto' }) {
  const t = useTranslations('me');
  const { setTheme: applyTheme } = useTheme();
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();

  function pick(v: 'light' | 'dark' | 'auto') {
    setValue(v);
    applyTheme(v === 'auto' ? 'system' : v);
    startTransition(() => {
      setTheme(v);
    });
  }

  return (
    <Row icon={Palette} title={t('themeTitle')} hint={t('themeHint')}>
      <Segmented<'light' | 'dark' | 'auto'>
        value={value}
        options={['light', 'dark', 'auto'] as const}
        labelFor={(v) => t(`theme_${v}`)}
        onChange={pick}
      />
    </Row>
  );
}

export function ToneRow({ initial }: { initial: 'warm' | 'direct' | 'playful' }) {
  const t = useTranslations('me');
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();

  function pick(v: 'warm' | 'direct' | 'playful') {
    setValue(v);
    startTransition(() => {
      setTone(v);
    });
  }

  return (
    <Row icon={Sparkles} title={t('toneTitle')} hint={t('toneHint')}>
      <Segmented<'warm' | 'direct' | 'playful'>
        value={value}
        options={['warm', 'direct', 'playful'] as const}
        labelFor={(v) => t(`tone_${v}`)}
        onChange={pick}
      />
    </Row>
  );
}

type ChatModeValue = 'listen' | 'probe' | 'practical' | 'reflective';

export function ChatModeRow({ initial }: { initial: ChatModeValue }) {
  const t = useTranslations('me');
  const [value, setValue] = useState<ChatModeValue>(initial);
  const [, startTransition] = useTransition();

  function pick(v: ChatModeValue) {
    setValue(v);
    startTransition(() => {
      setChatMode(v);
    });
  }

  return (
    <Row icon={MessageCircle} title={t('chatModeTitle')} hint={t('chatModeHint')}>
      <Segmented<ChatModeValue>
        value={value}
        options={['listen', 'probe', 'practical', 'reflective'] as const}
        labelFor={(v) => t(`chatMode_${v}`)}
        onChange={pick}
      />
    </Row>
  );
}

export function KarmicRow({ initial }: { initial: boolean }) {
  const t = useTranslations('me');
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();

  function toggle(v: boolean) {
    setValue(v);
    startTransition(() => {
      setShowKarmicDebt(v);
    });
  }

  return (
    <Row icon={AlertTriangle} title={t('karmicTitle')} hint={t('karmicHint')}>
      <Toggle on={value} onChange={toggle} ariaLabel={t('karmicTitle')} />
    </Row>
  );
}

export function AutoJournalRow({ initial }: { initial: boolean }) {
  const t = useTranslations('me');
  const [value, setValue] = useState(initial);
  const [, startTransition] = useTransition();

  function toggle(v: boolean) {
    setValue(v);
    startTransition(() => {
      setAutoJournal(v);
    });
  }

  return (
    <Row icon={NotebookPen} title={t('autoJournalTitle')} hint={t('autoJournalHint')}>
      <Toggle on={value} onChange={toggle} ariaLabel={t('autoJournalTitle')} />
    </Row>
  );
}

export function ReminderRow({
  initial,
}: {
  initial: { enabled: boolean; time: string | null };
}) {
  const t = useTranslations('me');
  const [enabled, setEnabled] = useState(initial.enabled);
  const [time, setTime] = useState(initial.time ?? '07:00');
  const [, startTransition] = useTransition();

  function commit(nextEnabled: boolean, nextTime: string) {
    startTransition(() => {
      setReminder({ enabled: nextEnabled, time: nextTime });
    });
  }

  return (
    <Row icon={Bell} title={t('reminderTitle')} hint={t('reminderHint')} stack>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-xs">
            {enabled ? t('reminderOn') : t('reminderOff')}
          </span>
          <Toggle
            on={enabled}
            onChange={(v) => {
              setEnabled(v);
              commit(v, time);
            }}
            ariaLabel={t('reminderTitle')}
          />
        </div>
        {enabled ? (
          <div className="flex items-center gap-3">
            <label htmlFor="reminderTime" className="text-muted-foreground text-xs">
              {t('reminderAt')}
            </label>
            <input
              id="reminderTime"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={() => commit(enabled, time)}
              className="border-border focus:ring-primary rounded-lg border bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2"
            />
          </div>
        ) : null}
      </div>
    </Row>
  );
}

const MODEL_OPTIONS = ['default', 'claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5'] as const;

export function ModelRow({ initial }: { initial: string | null }) {
  const t = useTranslations('me');
  const [value, setValue] = useState(initial ?? 'default');
  const [, startTransition] = useTransition();

  function pick(v: (typeof MODEL_OPTIONS)[number]) {
    setValue(v);
    startTransition(() => {
      setPreferredModel(v);
    });
  }

  return (
    <Row icon={Brain} title={t('modelTitle')} hint={t('modelHint')} stack>
      <select
        value={value}
        onChange={(e) => pick(e.target.value as (typeof MODEL_OPTIONS)[number])}
        className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2"
      >
        {MODEL_OPTIONS.map((m) => (
          <option key={m} value={m}>
            {t(`model_${m.replace(/-/g, '_')}`)}
          </option>
        ))}
      </select>
    </Row>
  );
}

export function ExportRow() {
  const t = useTranslations('me');
  const [pending, startTransition] = useTransition();

  function onExport() {
    startTransition(async () => {
      const result = await exportUserData();
      if (!result.ok) return;
      const blob = new Blob([result.payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `supernova-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <Row icon={Download} title={t('exportTitle')} hint={t('exportHint')}>
      <button
        type="button"
        onClick={onExport}
        disabled={pending}
        className="border-border press hover:bg-muted/40 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        {pending ? t('exportPending') : t('exportCta')}
      </button>
    </Row>
  );
}

export function DeleteRow({ locale }: { locale: Locale }) {
  const t = useTranslations('me');
  const [open, setOpen] = useState(false);

  return (
    <Row icon={Trash2} title={t('deleteTitle')} hint={t('deleteHint')} stack>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press inline-flex items-center gap-1.5 self-start rounded-full border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          {t('deleteCta')}
        </button>
      ) : (
        <form action={deleteAccount} className="space-y-3">
          <input type="hidden" name="locale" value={locale} />
          <p className="text-sm">{t('deleteConfirmCopy')}</p>
          <input
            name="confirm"
            type="text"
            required
            placeholder="DELETE"
            className="border-border focus:ring-primary w-full rounded-lg border bg-transparent px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="border-border press rounded-full border px-3 py-1.5 text-xs font-medium"
            >
              {t('deleteCancel')}
            </button>
            <button
              type="submit"
              className="press rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              {t('deleteConfirm')}
            </button>
          </div>
        </form>
      )}
    </Row>
  );
}

export function LanguageRow({
  initial,
  currentLocale,
}: {
  initial: Locale;
  currentLocale: Locale;
}) {
  const t = useTranslations('me');
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState<Locale>(initial);
  const [, startTransition] = useTransition();

  function pick(next: Locale) {
    if (next === value) return;
    setValue(next);
    startTransition(async () => {
      await setLocaleAction(next);
      // The URL carries the locale segment — swap it so the new bundle
      // takes effect immediately without a full reload.
      const segments = pathname.split('/');
      if (segments[1] === currentLocale) segments[1] = next;
      router.push(segments.join('/'));
      router.refresh();
    });
  }

  return (
    <Row icon={Languages} title={t('languageTitle')} hint={t('languageHint')}>
      <select
        value={value}
        onChange={(e) => pick(e.target.value as Locale)}
        className="border-border bg-surface-1 focus:ring-primary rounded-full border px-3 py-2 text-sm focus:outline-none focus:ring-2"
        dir="auto"
      >
        {LOCALE_CODES.map((code) => {
          const cfg = LOCALES[code]!;
          return (
            <option key={code} value={code}>
              {cfg.flag} {cfg.nativeName}
            </option>
          );
        })}
      </select>
    </Row>
  );
}
