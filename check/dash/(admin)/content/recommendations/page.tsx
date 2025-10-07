import { Metadata } from 'next';
import ContentRecommendationEngine from '@/components/admin/content/ContentRecommendationEngine';

export const metadata: Metadata = {
  title: 'AI Content Recommendations | CoinDaily Admin',
  description: 'AI-powered content recommendation engine with personalized suggestions and performance tracking.',
  keywords: 'content recommendations, AI engine, personalized content, user engagement, admin dashboard',
};

export default function ContentRecommendationsPage() {
  return <ContentRecommendationEngine />;
}
