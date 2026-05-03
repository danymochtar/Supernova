import { Resend } from 'resend';

let cached: Resend | null = null;

function client(): Resend {
  if (!cached) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is not set');
    cached = new Resend(key);
  }
  return cached;
}

export interface MagicLinkEmailOpts {
  to: string;
  url: string;
  locale: 'id' | 'en';
}

export async function sendMagicLinkEmail({ to, url, locale }: MagicLinkEmailOpts) {
  const from = process.env.RESEND_FROM ?? 'onboarding@resend.dev';
  const subject =
    locale === 'id' ? 'Masuk ke Supernova' : 'Sign in to Supernova';
  const intro =
    locale === 'id'
      ? 'Klik tombol di bawah untuk masuk ke akun Supernova Anda. Tautan ini berlaku 10 menit.'
      : 'Click the button below to sign in to your Supernova account. This link expires in 10 minutes.';
  const button = locale === 'id' ? 'Masuk ke Supernova' : 'Sign in to Supernova';
  const fallback =
    locale === 'id'
      ? 'Atau salin tautan ini ke peramban Anda:'
      : 'Or copy this link into your browser:';

  const res = await client().emails.send({
    from,
    to,
    subject,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#111">
        <h1 style="font-size:20px;margin:0 0 16px">${subject}</h1>
        <p style="margin:0 0 24px;line-height:1.5">${intro}</p>
        <p style="margin:0 0 24px">
          <a href="${url}" style="background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">${button}</a>
        </p>
        <p style="margin:0 0 8px;color:#666;font-size:13px">${fallback}</p>
        <p style="margin:0;color:#666;font-size:13px;word-break:break-all">${url}</p>
      </div>
    `,
  });

  if (res.error) {
    // Surface Resend rejection (e.g. sandbox sender can only deliver to the account
    // owner's email until a real domain is verified) so it lands in dev logs.
    console.error('[resend] send failed', { from, to, error: res.error });
    throw new Error(`Resend rejected email: ${res.error.message ?? 'unknown'}`);
  }

  // Dev-only convenience: also log the magic link so you can sign in even when
  // Resend can't deliver to the recipient.
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[magic-link] for ${to}: ${url}`);
  }

  return res;
}
