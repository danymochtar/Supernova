/**
 * Admin email allowlist (M9). Comma-separated list of emails in
 * `ADMIN_EMAILS`. Empty / unset = no admins (deny all).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS ?? '';
  if (!raw.trim()) return false;
  const list = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}
