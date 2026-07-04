import { redirect } from 'next/navigation';

/**
 * Archived. The /admin back office was consolidated into /super-admin.
 * This stub redirects to the equivalent super-admin destination.
 */
export default function ArchivedAdminPage() {
  redirect('/super-admin/content/moderation');
}
