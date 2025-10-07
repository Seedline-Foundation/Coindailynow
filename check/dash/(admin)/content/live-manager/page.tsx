import { Metadata } from 'next';
import LiveContentManager from '@/components/admin/content/LiveContentManager';

export const metadata: Metadata = {
  title: 'Live Content Manager | CoinDaily Admin',
  description: 'Real-time content management with AI-powered tagging, live updates, and multi-site publishing.',
  keywords: 'live content, real-time updates, AI tagging, content management, admin dashboard',
};

export default function LiveContentManagerPage() {
  return <LiveContentManager />;
}
