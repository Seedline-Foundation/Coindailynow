'use client';

import { PlugZap } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminIntegrationsPage() {
  return <FunctionalPanelPage section="partnerships" page="integrations" title="Integrations" description="Review partner integration health, API linkage, and sync reliability." icon={PlugZap} accentClass="text-violet-400" />;
}
