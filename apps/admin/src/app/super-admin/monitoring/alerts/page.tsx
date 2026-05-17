'use client';

import { AlertTriangle } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminMonitoringAlertsPage() {
  return <FunctionalPanelPage section="monitoring" page="alerts" title="System Alerts" description="Monitor incidents, escalations, and response workflow status." icon={AlertTriangle} accentClass="text-red-400" />;
}
