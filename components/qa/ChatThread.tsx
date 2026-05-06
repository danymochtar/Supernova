'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  ArrowUp,
  BookmarkPlus,
  Check,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import type { DeleteTurnResult } from '@/app/[locale]/ask/actions';
import type { AddToJournalResult } from '@/app/[locale]/journal/actions';
import { renderInlineMd } from './inlineMd';

type AttachmentKind = 'image' | 'pdf' | 'text';

interface Attachment {
  id: string;
  kind: AttachmentKind;
  name: string;
  mediaType: string;
  /** Pure base64, no data: prefix. */
  data: string;
  /** For images, the data URL used to render a preview thumbnail. */
  previewUrl?: string;
  size: number;
}

const MAX_ATTACHMENTS = 4;
/** Max raw bytes per file before base64. Conservative — Anthropic accepts
 * larger but Vercel default body limits + cost discourage it. */
const MAX_FILE_BYTES: Record<AttachmentKind, number> = {
  image: 4 * 1024 * 1024, // 4 MB
  pdf: 5 * 1024 * 1024, // 5 MB
  text: 1 * 1024 * 1024, // 1 MB
};
const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,application/pdf,text/plain,.md,.markdown';

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result ?? '');
      const idx = s.indexOf('base64,');
      resolve(idx >= 0 ? s.slice(idx + 'base64,'.length) : '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function classifyFile(file: File): AttachmentKind | null {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  if (
    file.type === 'text/plain' ||
    file.type === 'text/markdown' ||
    /\.(md|markdown|txt)$/i.test(file.name)
  ) {
    return 'text';
  }
  return null;
}

export interface ChatTurnAttachment {
  kind: AttachmentKind;
  name: string;
  mediaType: string;
  /** Data URL preview — only set for images, only available in the
   * session where the user uploaded them. After page reload these are
   * gone since we don't persist binaries to the server. */
  previewUrl?: string;
}

export interface ChatTurn {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  /** Optional inline attachments — only present for turns sent in the
   * current session. */
  attachments?: ChatTurnAttachment[];
}

interface Frame {
  type: 'text' | 'done' | 'error';
  delta?: string;
  message?: string;
  status?: number;
  inner?: string;
  /** On `done`: the just-persisted QaHistory id, so the client can
   * swap its optimistic placeholder for a real DB id and the new
   * turn becomes journalable without a page refresh. */
  id?: string | null;
}

interface Props {
  initialTurns: ChatTurn[];
  emptyHint: string;
  /** Short example prompts shown as tappable chips when the thread is empty. */
  starterPrompts?: string[];
  /** Server action to delete a persisted turn. */
  deleteAction?: (input: { id: string }) => Promise<DeleteTurnResult>;
  /** Server action to snapshot turns into the journal. */
  journalAction?: (input: { turnIds: string[] }) => Promise<AddToJournalResult>;
}

export function ChatThread({
  initialTurns,
  emptyHint,
  starterPrompts = [],
  deleteAction,
  journalAction,
}: Props) {
  const t = useTranslations('chat');
  const [turns, setTurns] = useState<ChatTurn[]>(initialTurns);
  const [pending, setPending] = useState<{
    question: string;
    answer: string;
    attachments?: ChatTurnAttachment[];
  } | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [, startDelete] = useTransition();
  // Journal multi-select. \`selectMode\` makes every persisted turn tappable
  // to toggle inclusion; the floating action bar at the bottom commits the
  // selection. Local-only turns (id starts with "local-") aren't journalable
  // until the page reloads and they get a real DB id.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [journalToast, setJournalToast] = useState<string | null>(null);
  // Active fullscreen image viewer (data URL of an attached image).
  const [viewingImage, setViewingImage] = useState<{ src: string; name: string } | null>(null);
  const [journalPending, startJournal] = useTransition();

  async function onPickFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const remaining = MAX_ATTACHMENTS - attachments.length;
    const slice = Array.from(files).slice(0, remaining);
    const next: Attachment[] = [];
    for (const file of slice) {
      const kind = classifyFile(file);
      if (!kind) {
        setError(t('attachmentUnsupported'));
        continue;
      }
      if (file.size > MAX_FILE_BYTES[kind]) {
        setError(t('attachmentTooLarge', { name: file.name }));
        continue;
      }
      try {
        const data = await readAsBase64(file);
        next.push({
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          kind,
          name: file.name,
          mediaType: file.type || (kind === 'pdf' ? 'application/pdf' : 'text/plain'),
          data,
          previewUrl: kind === 'image' ? `data:${file.type};base64,${data}` : undefined,
          size: file.size,
        });
      } catch {
        setError(t('attachmentReadFailed'));
      }
    }
    if (next.length > 0) setAttachments((prev) => [...prev, ...next]);
    // Reset the input so the same file can be picked again later.
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  function onDelete(id: string) {
    // Optimistic remove. If the action fails (server-side miss) we restore
    // the turn and surface the generic error so the user knows it didn't
    // take. Local-only turns (haven't been persisted yet — happens during a
    // streaming reply or right after a fresh send) just need state removal.
    const previous = turns;
    setTurns((prev) => prev.filter((tn) => tn.id !== id));
    if (id.startsWith('local-') || !deleteAction) return;
    startDelete(async () => {
      const result = await deleteAction({ id });
      if (!result.ok) {
        setTurns(previous);
        setError(t('errorGeneric'));
      }
    });
  }

  // First mount jumps straight to the bottom so the user sees their
  // latest exchange + the input box without having to scroll. After that,
  // subsequent updates (new turn, streaming answer growing) animate.
  const firstScrollRef = useRef(true);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: firstScrollRef.current ? 'auto' : 'smooth',
      block: 'end',
    });
    firstScrollRef.current = false;
  }, [turns.length, pending?.answer]);

  function commitJournal() {
    if (!journalAction) return;
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    startJournal(async () => {
      const result = await journalAction({ turnIds: ids });
      if (result.ok) {
        setJournalToast(t('journalSavedToast'));
        setSelectMode(false);
        setSelected(new Set());
        setTimeout(() => setJournalToast(null), 3500);
      } else {
        setError(t('errorGeneric'));
      }
    });
  }

  function cancelSelect() {
    setSelectMode(false);
    setSelected(new Set());
  }

  async function send() {
    const q = input.trim();
    if ((!q && attachments.length === 0) || streaming) return;
    setError(null);
    setInput('');
    const sentAttachments = attachments;
    setAttachments([]);
    // Optimistic display question: just the user's typed text. The
    // \`[image: name]\` summary is built separately and used only as
    // fallback display for turns rehydrated after a page reload (when
    // the binary previews are gone).
    const optimisticQuestion = q;
    const optimisticAttachments: ChatTurnAttachment[] = sentAttachments.map((a) => ({
      kind: a.kind,
      name: a.name,
      mediaType: a.mediaType,
      previewUrl: a.previewUrl,
    }));
    setPending({
      question: optimisticQuestion,
      answer: '',
      attachments: optimisticAttachments.length ? optimisticAttachments : undefined,
    });
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // If anything along the send path fails, restore the user's typed
    // text and attachments so they can retry without re-typing or
    // re-attaching. The locale toast wording "Pesan kamu disimpen"
    // matches what we actually do here.
    function restoreOnError() {
      setInput(q);
      setAttachments(sentAttachments);
      setPending(null);
    }

    try {
      const res = await fetch('/api/qa/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          attachments: sentAttachments.map((a) => ({
            kind: a.kind,
            name: a.name,
            mediaType: a.mediaType,
            data: a.data,
          })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          data.error === 'no_profile'
            ? t('errorNoProfile')
            : data.error === 'invalid_question'
              ? t('errorInvalid')
              : t('errorGeneric'),
        );
        restoreOnError();
        return;
      }

      if (!res.body) {
        setError(t('errorGeneric'));
        restoreOnError();
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let answerSoFar = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) !== -1) {
          const line = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 1);
          if (!line) continue;
          let frame: Frame;
          try {
            frame = JSON.parse(line) as Frame;
          } catch {
            continue;
          }
          if (frame.type === 'text' && frame.delta) {
            answerSoFar += frame.delta;
            setPending({
              question: optimisticQuestion,
              answer: answerSoFar,
              attachments: optimisticAttachments.length ? optimisticAttachments : undefined,
            });
          } else if (frame.type === 'error') {
            console.error('[chat] stream error frame', {
              message: frame.message,
              status: frame.status,
              inner: frame.inner,
            });
            setError(t('errorGeneric'));
            restoreOnError();
            return;
          } else if (frame.type === 'done') {
            // commit pending turn into list. If the server returned the
            // saved DB id, use it so the new turn is immediately
            // journalable without needing a page refresh.
            setTurns((prev) => [
              ...prev,
              {
                id: frame.id ?? `local-${Date.now()}`,
                question: optimisticQuestion,
                answer: answerSoFar,
                createdAt: new Date().toISOString(),
                attachments: optimisticAttachments.length ? optimisticAttachments : undefined,
              },
            ]);
            setPending(null);
            return;
          }
        }
      }
      // stream ended without 'done' — commit anyway
      setTurns((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          question: optimisticQuestion,
          answer: answerSoFar,
          createdAt: new Date().toISOString(),
          attachments: optimisticAttachments.length ? optimisticAttachments : undefined,
        },
      ]);
      setPending(null);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') {
        if (pending?.answer) {
          setTurns((prev) => [
            ...prev,
            {
              id: `local-${Date.now()}`,
              question: pending.question,
              answer: pending.answer,
              createdAt: new Date().toISOString(),
              attachments: optimisticAttachments.length ? optimisticAttachments : undefined,
            },
          ]);
        }
        setPending(null);
        return;
      }
      console.error('[chat] stream failed', err);
      setError(t('errorGeneric'));
      restoreOnError();
    } finally {
      setStreaming(false);
    }
  }

  function abort() {
    abortRef.current?.abort();
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl+Enter sends. Plain Enter inserts a newline (default
    // browser behavior) — many users compose multi-line messages and
    // expect Enter to break the line, not commit.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      send();
    }
  }

  // Auto-grow the textarea up to a sensible max as the user types,
  // so long messages don't clip into a tiny scrollable box.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  return (
    <div
      className="flex flex-col"
      style={{ minHeight: 'calc(100dvh - 8rem - env(safe-area-inset-bottom))' }}
    >
      <div className={`flex-1 overflow-y-auto pb-4 ${selectMode ? 'pt-16' : ''}`}>
        {turns.length === 0 && !pending ? (
          <div className="flex flex-col items-center gap-5 py-10 text-center">
            <div className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
              <Sparkles className="h-6 w-6" aria-hidden />
            </div>
            <p className="text-muted-foreground max-w-sm text-sm">{emptyHint}</p>
            {starterPrompts.length > 0 ? (
              <div className="flex w-full max-w-md flex-col gap-2">
                {starterPrompts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setInput(p)}
                    className="border-border press hover:bg-muted/40 rounded-xl border bg-white/40 px-4 py-3 text-left text-sm dark:bg-neutral-900/40"
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-5">
            {turns.map((tn) => {
              const journalable = journalAction !== undefined && !tn.id.startsWith('local-');
              return (
                <Pair
                  key={tn.id}
                  question={tn.question}
                  answer={tn.answer}
                  attachments={tn.attachments}
                  onOpenImage={(src, name) => setViewingImage({ src, name })}
                  onDelete={selectMode ? undefined : () => onDelete(tn.id)}
                  deleteLabel={t('delete')}
                  onAddToJournal={
                    journalAction
                      ? () => {
                          setSelectMode(true);
                          setSelected(new Set([tn.id]));
                        }
                      : undefined
                  }
                  addLabel={t('journalAdd')}
                  selectMode={selectMode}
                  journalable={journalable}
                  selected={selected.has(tn.id)}
                  onToggleSelect={() => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(tn.id)) next.delete(tn.id);
                      else next.add(tn.id);
                      return next;
                    });
                  }}
                />
              );
            })}
            {pending ? (
              <Pair
                question={pending.question}
                answer={pending.answer}
                attachments={pending.attachments}
                onOpenImage={(src, name) => setViewingImage({ src, name })}
                streaming
              />
            ) : null}
          </div>
        )}

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div ref={bottomRef} />
      </div>

      {/* Journal "added" toast — auto-clears after a few seconds. */}
      {journalToast ? (
        <div className="border-border bg-background fixed inset-x-0 bottom-24 z-50 mx-auto flex max-w-sm items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-lg">
          <BookmarkPlus className="text-primary h-4 w-4" aria-hidden />
          <span>{journalToast}</span>
        </div>
      ) : null}

      {/* Fullscreen image viewer — opened by tapping an attachment
        * thumbnail. Click anywhere or the X button to close. */}
      {viewingImage ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={viewingImage.name}
          onClick={() => setViewingImage(null)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setViewingImage(null);
            }}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
            style={{ marginTop: 'env(safe-area-inset-top)' }}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewingImage.src}
            alt={viewingImage.name}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      ) : null}

      {/* Floating action bar — pinned to viewport TOP so it stays
        * reachable as the user scrolls through messages picking entries.
        * Replaces the input row visually while in select mode. */}
      {selectMode ? (
        <div
          className="border-border bg-background/95 fixed inset-x-0 top-0 z-50 border-b supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
            <p className="text-foreground flex-1 text-sm">
              {t('journalSelectCount', { n: selected.size })}
            </p>
            <button
              type="button"
              onClick={cancelSelect}
              disabled={journalPending}
              className="border-border press hover:bg-muted/40 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
            >
              {t('journalCancel')}
            </button>
            <button
              type="button"
              onClick={commitJournal}
              disabled={journalPending || selected.size === 0}
              className="bg-primary text-primary-foreground press inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium disabled:opacity-40"
            >
              <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
              {journalPending ? t('journalSaving') : t('journalCommit')}
            </button>
          </div>
        </div>
      ) : null}

      <form
        hidden={selectMode}
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-border bg-background/95 space-y-2 border-t pt-3 supports-[backdrop-filter]:bg-background/80 supports-[backdrop-filter]:backdrop-blur"
      >
        {/* Attachment preview chips */}
        {attachments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {attachments.map((a) => (
              <div
                key={a.id}
                className="border-border bg-muted/50 group relative flex items-center gap-2 rounded-lg border p-1.5 pr-7 text-xs"
              >
                {a.kind === 'image' && a.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.previewUrl}
                    alt={a.name}
                    className="h-10 w-10 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="bg-background flex h-10 w-10 shrink-0 items-center justify-center rounded">
                    {a.kind === 'pdf' ? (
                      <FileText className="text-muted-foreground h-5 w-5" aria-hidden />
                    ) : (
                      <FileText className="text-muted-foreground h-5 w-5" aria-hidden />
                    )}
                  </div>
                )}
                <div className="min-w-0 max-w-[10rem]">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="text-muted-foreground uppercase tracking-wide">{a.kind}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  aria-label={t('attachmentRemove')}
                  className="hover:bg-background absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => onPickFiles(e.target.files)}
        />

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={streaming || attachments.length >= MAX_ATTACHMENTS}
            aria-label={t('attach')}
            title={t('attach')}
            className="press border-border text-muted-foreground hover:bg-muted/40 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border disabled:opacity-30"
          >
            {attachments.length > 0 ? (
              <ImageIcon className="h-4 w-4" aria-hidden />
            ) : (
              <Paperclip className="h-4 w-4" aria-hidden />
            )}
          </button>
          <textarea
            ref={inputRef}
            rows={1}
            maxLength={4000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={t('placeholder')}
            disabled={streaming}
            className="border-border focus:ring-primary min-h-[2.75rem] flex-1 resize-none overflow-y-auto rounded-2xl border bg-transparent px-4 py-2.5 text-sm leading-snug focus:outline-none focus:ring-2 disabled:opacity-50"
          />
          {streaming ? (
            <button
              type="button"
              onClick={abort}
              aria-label={t('stop')}
              className="press bg-muted text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            >
              <Square className="h-4 w-4 fill-current" aria-hidden />
            </button>
          ) : (
            <button
              type="submit"
              disabled={input.trim().length < 1 && attachments.length === 0}
              aria-label={t('send')}
              className="bg-primary text-primary-foreground press flex h-10 w-10 shrink-0 items-center justify-center rounded-full disabled:opacity-30"
            >
              <ArrowUp className="h-5 w-5" aria-hidden />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Pair({
  question,
  answer,
  streaming,
  onDelete,
  deleteLabel,
  onAddToJournal,
  addLabel,
  selectMode,
  selected,
  onToggleSelect,
  journalable,
  attachments,
  onOpenImage,
}: {
  question: string;
  answer: string;
  streaming?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
  onAddToJournal?: () => void;
  addLabel?: string;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  /** Whether this turn is eligible for journaling (saved to DB, not local-only). */
  journalable?: boolean;
  /** Inline attachments for current-session messages — image
   * thumbnails + non-image file chips. Undefined for rehydrated
   * turns where binaries are no longer available. */
  attachments?: ChatTurnAttachment[];
  /** Open a fullscreen viewer for the given image data URL. */
  onOpenImage?: (src: string, name: string) => void;
}) {
  const wrapperClass = `group/pair relative space-y-3 ${
    selectMode && journalable ? 'cursor-pointer' : ''
  } ${selectMode && journalable && selected ? 'ring-primary/50 ring-2 rounded-2xl ring-offset-2 ring-offset-background' : ''}`;
  const visibleQuestion = (question ?? '').replace(/\[(?:image|pdf|text):[^\]]*\]\s*/gi, '').trim();
  return (
    <div
      className={wrapperClass}
      onClick={selectMode && journalable && onToggleSelect ? onToggleSelect : undefined}
      role={selectMode && journalable ? 'button' : undefined}
      aria-pressed={selectMode && journalable ? selected : undefined}
    >
      {attachments && attachments.length > 0 ? (
        <div className="flex max-w-[80%] flex-wrap gap-2 self-end ml-auto justify-end">
          {attachments.map((a, i) => {
            if (a.kind === 'image' && a.previewUrl) {
              return (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenImage?.(a.previewUrl!, a.name);
                  }}
                  className="press-soft block overflow-hidden rounded-2xl"
                  aria-label={a.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.previewUrl}
                    alt={a.name}
                    className="h-32 w-32 rounded-2xl object-cover sm:h-40 sm:w-40"
                  />
                </button>
              );
            }
            return (
              <div
                key={i}
                className="border-border bg-muted/40 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"
              >
                <FileText className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden />
                <div className="min-w-0 max-w-[10rem]">
                  <p className="truncate font-medium">{a.name}</p>
                  <p className="text-muted-foreground uppercase tracking-wide">{a.kind}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
      {(() => {
        // Pick what to show in the user bubble:
        // - if we have inline attachments: show the cleaned text (no "[image: …]" markers)
        // - otherwise: show the raw question (which on rehydrated turns includes the markers,
        //   so the user still sees a hint that something was attached)
        const text =
          attachments && attachments.length > 0 ? visibleQuestion : question;
        if (!text) return null;
        return (
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-md px-4 py-2.5 text-sm">
              {text}
            </div>
          </div>
        );
      })()}
      <div className="flex justify-start">
        <div className="border-border max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-md border bg-white/60 px-4 py-2.5 text-sm dark:bg-neutral-900/60">
          {renderInlineMd(answer)}
          {streaming ? (
            answer.length === 0 ? (
              <span className="inline-flex items-center gap-1 py-0.5" aria-label="typing">
                <span className="bg-muted-foreground/50 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
                <span className="bg-muted-foreground/50 h-1.5 w-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
                <span className="bg-muted-foreground/50 h-1.5 w-1.5 animate-bounce rounded-full" />
              </span>
            ) : (
              <span className="bg-muted-foreground/60 ml-1 inline-block h-3 w-1.5 animate-pulse align-middle" />
            )
          ) : null}
        </div>
      </div>

      {/* Per-turn affordances: in normal mode show + (journal) and trash;
        * in select mode show a check-circle reflecting selection state. */}
      {!streaming ? (
        <div className="absolute -bottom-1 right-0 flex items-center gap-1">
          {selectMode && journalable ? (
            <span
              aria-hidden
              className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition ${
                selected
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/40 bg-background'
              }`}
            >
              {selected ? <Check className="h-3.5 w-3.5" /> : null}
            </span>
          ) : (
            <>
              {onAddToJournal && journalable ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToJournal();
                  }}
                  aria-label={addLabel}
                  title={addLabel}
                  className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full p-1.5 opacity-60 transition group-hover/pair:opacity-100 sm:opacity-0"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
              {onDelete ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  aria-label={deleteLabel}
                  title={deleteLabel}
                  className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full p-1.5 opacity-60 transition group-hover/pair:opacity-100 sm:opacity-0"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
