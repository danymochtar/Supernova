'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { AlertTriangle, Bell, Brain, Download, Palette, Sparkles, Trash2 } from 'lucide-react';
import type { Locale } from '@/lib/i18n/config';
import {
  setTheme,
  setTone,
  setShowKarmicDebt,
  setPreferredModel,
  setReminder,
  exportUserData,
  deleteAccount,
} from '@/app/[locale]/me/actions';

interface InitialPrefs {
  theme: 'light' | 'dark' | 'auto';
  tone: 'warm' | 'direct' | 'playful';
  showKarmicDebt: boolean;
  preferredModel: string | null;
  reminderEnabled: boolean;
  reminderTime: string | null;
}

export function PreferencesPanel({ locale, initial }: { locale: Locale; initial: InitialPrefs }) {
  const t = useTranslations('me');

  return (
    <div className="space-y-4">
      <ThemeRow initial={initial.theme} />
      <ToneRow initial={initial.tone} />
      <KarmicRow initial={initial.showKarmicDebt} />
      <ReminderRow initial={{ enabled: initial.reminderEnabled, time: initial.reminderTime }} />
      <ModelRow initial={initial.preferredModel} />
      <ExportRow />
      <DeleteRow locale={locale} />

      <p className="text-muted-foreground pt-2 text-xs">{t('settingsFooter')}</p>
    </div>
  );
}

function Row({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Palette;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border space-y-3 rounded-2xl border bg-white/40 p-5 dark:bg-neutral-900/40">
      <div className="flex items-start gap-3">
        <Icon className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">{title}</p>
          {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function ThemeRow({ initial }: { initial: 'light' | 'dark' | 'auto' }) {
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
      <div className="border-border inline-flex w-full items-stretch overflow-hidden rounded-full border text-xs">
        {(['light', 'dark', 'auto'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => pick(v)}
            className={`press flex-1 px-3 py-2 font-medium transition-colors ${
              value === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/40'
            }`}
            aria-pressed={value === v}
          >
            {t(`theme_${v}`)}
          </button>
        ))}
      </div>
    </Row>
  );
}

function ToneRow({ initial }: { initial: 'warm' | 'direct' | 'playful' }) {
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
      <div className="border-border inline-flex w-full items-stretch overflow-hidden rounded-full border text-xs">
        {(['warm', 'direct', 'playful'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => pick(v)}
            className={`press flex-1 px-3 py-2 font-medium transition-colors ${
              value === v ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/40'
            }`}
            aria-pressed={value === v}
          >
            {t(`tone_${v}`)}
          </button>
        ))}
      </div>
    </Row>
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

function KarmicRow({ initial }: { initial: boolean }) {
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
      <div className="flex items-center justify-between">
        <span className="text-sm">{value ? t('karmicShown') : t('karmicHidden')}</span>
        <Toggle on={value} onChange={toggle} ariaLabel={t('karmicTitle')} />
      </div>
    </Row>
  );
}

function ReminderRow({ initial }: { initial: { enabled: boolean; time: string | null } }) {
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
    <Row icon={Bell} title={t('reminderTitle')} hint={t('reminderHint')}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">{enabled ? t('reminderOn') : t('reminderOff')}</span>
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
              className="border-border bg-transparent rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        ) : null}
        <p className="text-muted-foreground text-xs">{t('reminderInfraNote')}</p>
      </div>
    </Row>
  );
}

const MODEL_OPTIONS = ['default', 'claude-sonnet-4-6', 'claude-opus-4-7', 'claude-haiku-4-5'] as const;

function ModelRow({ initial }: { initial: string | null }) {
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
    <Row icon={Brain} title={t('modelTitle')} hint={t('modelHint')}>
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

function ExportRow() {
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
        className="border-border press hover:bg-muted/40 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        <Download className="h-4 w-4" aria-hidden />
        {pending ? t('exportPending') : t('exportCta')}
      </button>
    </Row>
  );
}

function DeleteRow({ locale }: { locale: Locale }) {
  const t = useTranslations('me');
  const [open, setOpen] = useState(false);

  return (
    <Row icon={Trash2} title={t('deleteTitle')} hint={t('deleteHint')}>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press inline-flex items-center gap-2 rounded-full border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
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
              className="border-border press rounded-full border px-4 py-2 text-sm font-medium"
            >
              {t('deleteCancel')}
            </button>
            <button
              type="submit"
              className="press rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              {t('deleteConfirm')}
            </button>
          </div>
        </form>
      )}
    </Row>
  );
}
