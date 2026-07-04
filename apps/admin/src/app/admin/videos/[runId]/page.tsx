import { redirect } from 'next/navigation';

/**
 * Archived. /admin/videos/[runId] moved to /super-admin/vengine/[runId].
 */
export default function ArchivedVideoRunPage({ params }: { params: { runId: string } }) {
  redirect(`/super-admin/vengine/${params.runId}`);
}
