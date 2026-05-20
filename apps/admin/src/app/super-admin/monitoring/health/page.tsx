'use client';

import { HeartPulse } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminMonitoringHealthPage() {
  return <FunctionalPanelPage section="monitoring" page="health" title="System Health" description="Observe core services, uptime, and infrastructure heartbeat." icon={HeartPulse} accentClass="text-green-400" />;
}
