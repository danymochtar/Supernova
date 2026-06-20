import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/requireSession';
import { searchCities } from '@/lib/zodiac/cities';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/zodiac/cities?q=jakarta
 *
 * Returns up to 10 city matches for the birth-place picker. Behind
 * session auth — the dataset itself is public but the endpoint is
 * scoped to logged-in users (no point exposing it to anonymous
 * scrapers). Empty / very short queries return an empty list to
 * avoid noisy data when the user just clears the input.
 */
export async function GET(req: Request): Promise<Response> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'unauth' }, { status: 401 });

  const url = new URL(req.url);
  const q = url.searchParams.get('q') ?? '';
  const results = searchCities(q, 10);
  return NextResponse.json({ results });
}
