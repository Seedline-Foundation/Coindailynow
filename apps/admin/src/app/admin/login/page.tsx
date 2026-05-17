import { redirect } from 'next/navigation';

/** S1-2: CEO login merged into /login */
export default function AdminLoginRedirect() {
  redirect('/login?role=super');
}
