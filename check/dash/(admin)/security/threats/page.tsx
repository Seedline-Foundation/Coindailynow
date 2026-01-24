import { Metadata } from 'next';
import ThreatDetectionDashboard from '@/components/admin/security/ThreatDetectionDashboard';

export const metadata: Metadata = {
  title: 'Threat Detection - Security Center | CoinDaily',
  description: 'AI-powered threat detection and real-time security monitoring for CoinDaily platform',
  keywords: 'threat detection, AI security, monitoring, attacks, prevention',
};

export default function ThreatDetectionPage() {
  return <ThreatDetectionDashboard />;
}
