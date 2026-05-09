'use client';

import { Building2 } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminPartnersPage() {
  return <FunctionalPanelPage section="partnerships" page="partners" title="Partners" description="Manage partner organizations, status, and collaboration lifecycle." icon={Building2} accentClass="text-cyan-400" />;
}
