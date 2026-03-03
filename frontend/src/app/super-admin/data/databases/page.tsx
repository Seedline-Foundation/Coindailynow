'use client';

import { Database } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminDatabasesPage() {
  return <FunctionalPanelPage section="data" page="databases" title="Databases" description="Inspect database health, storage utilization, and core service availability." icon={Database} accentClass="text-indigo-400" />;
}
