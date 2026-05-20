import { redirect } from 'next/navigation';

/**
 * S1-5: Subscriber dashboard lives on coindaily.online (frontend), not jet admin.
 */
const FRONTEND_USER_BASE =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.replace(/\/$/, '') ||
  'https://coindaily.online';

export default function UserDashboardRedirect() {
  redirect(`${FRONTEND_USER_BASE}/user`);
}
