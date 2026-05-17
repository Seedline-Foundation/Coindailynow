'use client';

import { Zap } from 'lucide-react';
import SettingsPanelPage from '@/components/super-admin/SettingsPanelPage';

export default function SuperAdminSettingsApiPage() {
  return <SettingsPanelPage page="api" title="API Configuration" description="Control API integration settings, key policies, and endpoint governance." icon={Zap} accentClass="text-purple-400" />;
}
