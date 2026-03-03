'use client';

import { Gauge } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminMonitoringPerformancePage() {
  return <FunctionalPanelPage section="monitoring" page="performance" title="Performance" description="Track latency, throughput, and resource saturation trends." icon={Gauge} accentClass="text-sky-400" />;
}
