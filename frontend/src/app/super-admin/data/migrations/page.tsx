'use client';

import { GitBranchPlus } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminMigrationsPage() {
  return <FunctionalPanelPage section="data" page="migrations" title="Migrations" description="Monitor schema changes, rollout safety, and migration execution status." icon={GitBranchPlus} accentClass="text-fuchsia-400" />;
}
