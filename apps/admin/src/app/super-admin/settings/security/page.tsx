'use client';

import { Shield } from 'lucide-react';
import SettingsPanelPage from '@/components/super-admin/SettingsPanelPage';

export default function SuperAdminSettingsSecurityPage() {
  return <SettingsPanelPage page="security" title="Security Settings" description="Manage security policies, auth constraints, and admin hardening controls." icon={Shield} accentClass="text-red-400" />;
}
