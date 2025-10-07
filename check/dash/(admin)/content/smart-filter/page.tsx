import { Metadata } from 'next';
import SmartContentFilter from '@/components/admin/content/SmartContentFilter';

export const metadata: Metadata = {
  title: 'Smart Content Filter | CoinDaily Admin',
  description: 'AI-powered content filtering with intelligent presets, advanced categorization, and performance analytics.',
  keywords: 'content filter, AI filtering, smart presets, content categorization, admin tools',
};

export default function SmartContentFilterPage() {
  return <SmartContentFilter />;
}
