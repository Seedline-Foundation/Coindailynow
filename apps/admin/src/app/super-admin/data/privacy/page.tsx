'use client';

import { Lock } from 'lucide-react';
import FunctionalPanelPage from '@/components/super-admin/FunctionalPanelPage';

export default function SuperAdminDataPrivacyPage() {
  return <FunctionalPanelPage section="data" page="privacy" title="Privacy & GDPR" description="Review privacy controls, data retention handling, and GDPR workflows." icon={Lock} accentClass="text-rose-400" />;
}
