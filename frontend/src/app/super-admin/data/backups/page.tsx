'use client';

import { Archive } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminBackupsPage() {
  return <FunctionalPanelPage section="data" page="backups" title="Backups" description="Track backup jobs, restore points, and disaster recovery readiness." icon={Archive} accentClass="text-emerald-400" />;
}
