import { Metadata } from 'next';
import SecurityDashboard from '@/components/admin/security/SecurityDashboard';

export const metadata: Metadata = {
  title: 'Security Center - Admin | Sygn',
  description: 'Advanced security monitoring, threat detection, and compliance management for Sygn platform',
  keywords: 'security, threat detection, 2FA, compliance, GDPR, monitoring',
};

export default function SecurityPage() {
  return <SecurityDashboard />;
}
