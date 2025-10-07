import { Metadata } from 'next';
import SecurityDashboard from '@/components/admin/security/SecurityDashboard';

export const metadata: Metadata = {
  title: 'Security Center - Admin | CoinDaily',
  description: 'Advanced security monitoring, threat detection, and compliance management for CoinDaily platform',
  keywords: 'security, threat detection, 2FA, compliance, GDPR, monitoring',
};

export default function SecurityPage() {
  return <SecurityDashboard />;
}
