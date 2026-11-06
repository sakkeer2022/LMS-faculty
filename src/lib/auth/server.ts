import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { CONSENT_PATH, FACULTY_HOME, isFaculty, sessionUserSchema } from './access';

const backend = () => `${process.env.BACKEND_ORIGIN ?? 'http://127.0.0.1:3000'}/api/v1`;

// Same approach as amentorz-admin src/lib/auth/server.ts: the backend decides who is signed in
// (GET /auth/me), so no signing secret is shared with this app. A tutor whose current prices are not
// accepted (GET /faculty/me/price-consent) is sent to the consent screen first.
export async function requireFaculty() {
  const path = (await headers()).get('x-pathname') ?? FACULTY_HOME;
  const toLogin = `/login?redirect=${encodeURIComponent(path)}`;
  const token = (await cookies()).get('accessToken')?.value;
  if (!token) redirect(toLogin);
  const init = {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store' as const,
    signal: AbortSignal.timeout(8000),
  };

  const me = await fetch(`${backend()}/auth/me`, init);
  if (me.status === 401) redirect(toLogin);
  if (!me.ok) throw new Error('Unable to verify session');
  const body = await me.json();
  const user = sessionUserSchema.safeParse(body?.data);
  if (!body?.success || !user.success || !isFaculty(user.data)) redirect(toLogin);

  const consent = await fetch(`${backend()}/faculty/me/price-consent`, init);
  // A faculty account without a profile (development) has no prices to accept
  if (consent.ok) {
    const status = (await consent.json())?.data?.status;
    if (status !== 'accepted') redirect(CONSENT_PATH);
  } else if (consent.status !== 404) throw new Error('Unable to load price consent');

  return { user: user.data };
}
