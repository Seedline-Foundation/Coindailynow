'use client';

import { Settings } from 'lucide-react';
import SettingsPanelPage from '@/components/super-admin/SettingsPanelPage';

export default function SuperAdminSettingsGeneralPage() {
  return <SettingsPanelPage page="general" title="General Settings" description="Configure platform-wide defaults and operational preferences." icon={Settings} accentClass="text-blue-400" />;
}
