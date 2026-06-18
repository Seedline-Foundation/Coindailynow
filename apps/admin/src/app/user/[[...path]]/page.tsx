import { redirect } from 'next/navigation';

/**
 * S1-5: Subscriber dashboard lives on sygn.live (frontend), not jet admin.
 */
const FRONTEND_USER_BASE =
  process.env.NEXT_PUBLIC_FRONTEND_URL?.replace(/\/$/, '') ||
  'https://sygn.live';

export default function UserDashboardRedirect() {
  redirect(`${FRONTEND_USER_BASE}/user`);
}
