import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/requireSession';
import { prisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * RFC 5545 line-folding: split lines >75 octets at boundary with
 * "\r\n " continuation. iCalendar consumers (Apple Calendar, Google
 * Calendar, Outlook) all require this — without it long DESCRIPTION
 * or SUMMARY values silently get truncated.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const out: string[] = [];
  let start = 0;
  while (start < line.length) {
    out.push((start === 0 ? '' : ' ') + line.slice(start, start + 75));
    start += 75;
  }
  return out.join('\r\n');
}

/** Escape text per RFC 5545 §3.3.11 — backslash, comma, semicolon, newlines. */
function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/** Format Date as iCalendar UTC: 20260523T100000Z */
function ics(dt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    dt.getUTCFullYear().toString() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Generate a single-event .ics file for one journal action item so the
 * user can drop it into their native calendar without an OAuth flow.
 * Apple Calendar, Google Calendar, Outlook all import this file format.
 *
 * Query params:
 *   - entryId: cuid of the parent JournalEntry
 *   - itemId: id of the action item inside that entry
 *
 * Both are required. The route validates the entry belongs to the
 * authenticated user before emitting the file.
 *
 * Default scheduling: next morning 09:00 local-ish (we use UTC+7
 * as a sane Jakarta-anchored default — the user's calendar app
 * will display in their device timezone). Duration 30 minutes.
 * Users can move the event in their calendar after import.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'unauth' }, { status: 401 });
  }

  const url = new URL(req.url);
  const entryId = url.searchParams.get('entryId');
  const itemId = url.searchParams.get('itemId');
  if (!entryId || !itemId) {
    return NextResponse.json({ error: 'missing_params' }, { status: 400 });
  }

  const row = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: session.user.id },
    select: { id: true, actionItems: true, theme: true },
  });
  if (!row) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const items = Array.isArray(row.actionItems) ? row.actionItems : [];
  const item = (items as Array<{ id?: unknown; title?: unknown }>).find(
    (it) => typeof it === 'object' && it !== null && it.id === itemId,
  );
  if (!item || typeof item.title !== 'string') {
    return NextResponse.json({ error: 'item_not_found' }, { status: 404 });
  }

  const title = item.title;
  const theme = typeof row.theme === 'string' ? row.theme : null;

  // Schedule for the next morning at 09:00 UTC+7 (Jakarta) — translated
  // into UTC for the .ics file. The user's calendar app re-displays in
  // their device timezone, so this just biases the default to "tomorrow
  // morning" no matter where they are.
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(2, 0, 0, 0); // 09:00 WIB == 02:00 UTC
  const dtStart = tomorrow;
  const dtEnd = new Date(dtStart.getTime() + 30 * 60_000);

  const origin = `${url.protocol}//${url.host}`;
  const journalUrl = `${origin}/id/journal#${entryId}`;
  const description = [
    `From your Supernova journal${theme ? ` (theme: ${theme})` : ''}.`,
    '',
    `Open the entry: ${journalUrl}`,
  ].join('\n');

  const uid = `journal-action-${itemId}@supernova`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Supernova//Journal Action//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${ics(now)}`,
    `DTSTART:${ics(dtStart)}`,
    `DTEND:${ics(dtEnd)}`,
    foldLine(`SUMMARY:${escapeText(title)}`),
    foldLine(`DESCRIPTION:${escapeText(description)}`),
    foldLine(`URL:${journalUrl}`),
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-PT15M',
    foldLine(`DESCRIPTION:${escapeText(title)}`),
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  return new Response(lines, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="supernova-${itemId.slice(0, 8)}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
