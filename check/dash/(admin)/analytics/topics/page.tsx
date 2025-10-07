import { Metadata } from 'next';
import TopicAnalytics from '@/components/admin/analytics/TopicAnalytics';

export const metadata: Metadata = {
  title: 'Topic Analytics | CoinDaily Admin',
  description: 'Comprehensive topic performance analytics with trend analysis, user engagement metrics, and content insights.',
  keywords: 'topic analytics, content performance, trend analysis, engagement metrics, admin dashboard',
};

export default function TopicAnalyticsPage() {
  return <TopicAnalytics />;
}
