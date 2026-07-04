import { redirect } from 'next/navigation';

/**
 * Archived. /admin/review/[runId] moved to /super-admin/content/editorial-pipeline/[runId].
 */
export default function ArchivedReviewRunPage({ params }: { params: { runId: string } }) {
  redirect(`/super-admin/content/editorial-pipeline/${params.runId}`);
}
