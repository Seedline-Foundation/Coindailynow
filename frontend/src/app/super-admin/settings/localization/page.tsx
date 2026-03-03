'use client';

import { Globe } from 'lucide-react';
import SettingsPanelPage from '@/components/super-admin/SettingsPanelPage';

export default function SuperAdminSettingsLocalizationPage() {
  return <SettingsPanelPage page="localization" title="Localization" description="Manage language, regionalization, and African market localization preferences." icon={Globe} accentClass="text-emerald-400" />;
}
