/**
 * Article Display Demo Page
 * CoinDaily Platform - Task 21 Implementation Demo
 */

import React, { useState } from 'react';
import { ArticleReader } from '../../components/articles/ArticleReader';
import { Article, ArticleStatus, ArticlePriority, TranslationStatus } from '../../types/article';

// Mock article data for demo
const mockArticle: Article = {
  id: 'demo-article-1',
  title: 'Bitcoin Adoption Accelerates Across West Africa: M-Pesa Integration Drives Financial Inclusion',
  slug: 'bitcoin-adoption-west-africa-mpesa-integration',
  excerpt: 'West African countries are experiencing unprecedented Bitcoin adoption rates as mobile money platforms like M-Pesa integrate cryptocurrency services, creating new pathways for financial inclusion across the region.',
  content: `
    <h2>Revolutionary Changes in West African Crypto Markets</h2>
    <p>West Africa is witnessing a cryptocurrency revolution that's reshaping the financial landscape across the region. With over 400 million people and a rapidly growing mobile phone penetration rate, countries like Nigeria, Ghana, Senegal, and Côte d'Ivoire are becoming hotbeds for digital currency adoption.</p>
    
    <h3>The Mobile Money Connection</h3>
    <p>The integration of Bitcoin with established mobile money platforms represents a paradigm shift in how Africans access and use digital currencies. M-Pesa, which serves over 50 million users across Kenya, Tanzania, and other African markets, has become a crucial bridge between traditional finance and the crypto economy.</p>
    
    <blockquote>
      "We're seeing a 300% increase in crypto transactions through mobile money platforms in West Africa over the past six months," says Dr. Amina Kone, a fintech researcher at the University of Lagos.
    </blockquote>
    
    <h3>Key Growth Drivers</h3>
    <ul>
      <li><strong>Mobile Money Integration:</strong> Seamless conversion between local currencies and Bitcoin through existing mobile wallets</li>
      <li><strong>Regulatory Clarity:</strong> Clearer guidelines from central banks in Nigeria, Ghana, and Kenya</li>
      <li><strong>Youth Adoption:</strong> Over 70% of new crypto users are under 35 years old</li>
      <li><strong>Remittance Solutions:</strong> Lower fees for diaspora sending money home</li>
      <li><strong>Merchant Acceptance:</strong> Growing number of businesses accepting Bitcoin payments</li>
    </ul>
    
    <h3>Regional Breakdown</h3>
    <p>Different West African countries are approaching cryptocurrency adoption in unique ways:</p>
    
    <h4>Nigeria</h4>
    <p>Leading the continent with the highest Bitcoin trading volumes, Nigeria has seen remarkable growth despite initial regulatory challenges. The Central Bank of Nigeria's recent pivot toward regulated crypto exchanges has opened new opportunities for legitimate trading.</p>
    
    <h4>Ghana</h4>
    <p>Ghana's proactive regulatory stance has made it an attractive destination for crypto businesses. The Bank of Ghana's digital cedi pilot program is running parallel to growing Bitcoin adoption.</p>
    
    <h4>Senegal</h4>
    <p>With strong French-speaking markets and connections to European crypto exchanges, Senegal is becoming a gateway for Bitcoin adoption in Francophone Africa.</p>
    
    <h3>Challenges and Opportunities</h3>
    <p>While the growth is impressive, several challenges remain:</p>
    
    <ul>
      <li>Internet connectivity issues in rural areas</li>
      <li>Education about cryptocurrency security and best practices</li>
      <li>Volatility concerns among first-time users</li>
      <li>Infrastructure development for widespread adoption</li>
    </ul>
    
    <h3>The Path Forward</h3>
    <p>Industry experts predict that West Africa will become one of the world's largest crypto markets by 2025. The combination of young demographics, mobile-first technology adoption, and innovative financial services creates a perfect storm for digital currency growth.</p>
    
    <p>As traditional banking services remain inaccessible to millions of West Africans, Bitcoin and other cryptocurrencies are filling a crucial gap, providing financial services to the unbanked and underbanked populations across the region.</p>
    
    <hr />
    
    <p><em>This article reflects the current state of cryptocurrency adoption in West Africa as of January 2024. Market conditions and regulatory environments continue to evolve rapidly.</em></p>
  `,
  featuredImageUrl: 'https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=800&h=400&fit=crop',
  author: {
    id: 'author-amina',
    username: 'amina_crypto_west',
    firstName: 'Amina',
    lastName: 'Diallo',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b2bc?w=64&h=64&fit=crop&crop=face'
  },
  category: {
    id: 'cat-african-markets',
    name: 'African Markets',
    slug: 'african-markets',
    colorHex: '#10B981'
  },
  tags: [
    { id: 'tag-bitcoin', name: 'Bitcoin', slug: 'bitcoin' },
    { id: 'tag-west-africa', name: 'West Africa', slug: 'west-africa' },
    { id: 'tag-mpesa', name: 'M-Pesa', slug: 'mpesa' },
    { id: 'tag-financial-inclusion', name: 'Financial Inclusion', slug: 'financial-inclusion' },
    { id: 'tag-mobile-money', name: 'Mobile Money', slug: 'mobile-money' }
  ],
  status: ArticleStatus.PUBLISHED,
  priority: ArticlePriority.HIGH,
  isPremium: false,
  viewCount: 24750,
  likeCount: 1850,
  commentCount: 287,
  shareCount: 456,
  readingTimeMinutes: 8,
  seoTitle: 'Bitcoin Adoption West Africa M-Pesa Mobile Money Integration 2024',
  seoDescription: 'West Africa leads global Bitcoin adoption through M-Pesa integration, driving financial inclusion across Nigeria, Ghana, and beyond.',
  publishedAt: '2024-01-20T14:30:00Z',
  createdAt: '2024-01-20T10:00:00Z',
  updatedAt: '2024-01-20T14:30:00Z',
  translations: [
    {
      id: 'trans-en',
      articleId: 'demo-article-1',
      languageCode: 'en',
      title: 'Bitcoin Adoption Accelerates Across West Africa: M-Pesa Integration Drives Financial Inclusion',
      excerpt: 'West African countries are experiencing unprecedented Bitcoin adoption rates as mobile money platforms like M-Pesa integrate cryptocurrency services.',
      content: '<p>Original English content...</p>',
      translationStatus: TranslationStatus.COMPLETED,
      aiGenerated: false,
      humanReviewed: true,
      qualityScore: 100,
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: 'trans-fr',
      articleId: 'demo-article-1',
      languageCode: 'fr',
      title: 'L\'adoption du Bitcoin s\'accélère en Afrique de l\'Ouest : L\'intégration M-Pesa favorise l\'inclusion financière',
      excerpt: 'Les pays d\'Afrique de l\'Ouest connaissent des taux d\'adoption du Bitcoin sans précédent alors que les plateformes d\'argent mobile comme M-Pesa intègrent les services de cryptomonnaie.',
      content: '<p>Contenu français traduit...</p>',
      translationStatus: TranslationStatus.COMPLETED,
      aiGenerated: true,
      humanReviewed: true,
      qualityScore: 92,
      createdAt: '2024-01-20T12:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: 'trans-ha',
      articleId: 'demo-article-1',
      languageCode: 'ha', 
      title: 'Karɓar Bitcoin ya kara sauri a Yammacin Afirka: Haɗin M-Pesa yana haifar da Haɗa Kuɗi',
      excerpt: 'Ƙasashen Yammacin Afirka suna fuskantar ƙimar karɓar Bitcoin da ba a taɓa gani ba yayin da dandamali na kuɗin wayar hannu kamar M-Pesa ke haɗa sabis na cryptocurrency.',
      content: '<p>Abun ciki na Hausa...</p>',
      translationStatus: TranslationStatus.COMPLETED,
      aiGenerated: true,
      humanReviewed: false,
      qualityScore: 85,
      createdAt: '2024-01-20T13:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: 'trans-yo',
      articleId: 'demo-article-1',
      languageCode: 'yo',
      title: 'Gbigba Bitcoin n pọ si ni Iwọ-oorun Afrika: Isopọ M-Pesa n wakọ Ifihan Owo',
      excerpt: 'Awọn orilẹ-ede Iwọ-oorun Afrika n ni iriri awọn oṣuwọn gbigba Bitcoin ti ko tii ṣẹlẹ ri bi awọn pẹpẹ owo alagbeka bii M-Pesa ṣe n ṣapọ awọn iṣẹ cryptocurrency.',
      content: '<p>Akoonu Yoruba...</p>',
      translationStatus: TranslationStatus.COMPLETED,
      aiGenerated: true,
      humanReviewed: false,
      qualityScore: 81,
      createdAt: '2024-01-20T13:30:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    }
  ]
};

const ArticleDisplayDemo: React.FC = () => {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [readingProgress, setReadingProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  // Handlers
  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    console.log('Language changed to:', language);
  };

  const handleShare = (platform: string, data: any) => {
    console.log('Sharing on:', platform, data);
    // In production, integrate with analytics
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    console.log('Saving article for offline reading');
    // In production, save to local storage or service worker cache
  };

  const handleProgressUpdate = (progress: number, timeSpentSeconds: number) => {
    setReadingProgress(progress);
    setTimeSpent(timeSpentSeconds);
    console.log(`Reading progress: ${progress}%, Time spent: ${timeSpentSeconds}s`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Article Display Components Demo
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Task 21: Multi-language article reading with African platform focus
              </p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div>Progress: {Math.round(readingProgress)}%</div>
              <div>Time: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Article Reader */}
      <div className="py-8">
        <ArticleReader
          article={mockArticle}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          onShare={handleShare}
          onPrint={handlePrint}
          onSave={handleSave}
          onProgressUpdate={handleProgressUpdate}
          showTranslationQuality={true}
          enableOfflineReading={true}
        />
      </div>

      {/* Demo Footer */}
      <div className="bg-white shadow-sm border-t mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Features Demonstrated
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <div className="font-medium text-gray-900">✅ Multi-language Support</div>
                <div>English, French, Hausa, Yoruba with quality indicators</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">✅ African Social Sharing</div>
                <div>WhatsApp, Telegram priority for African markets</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">✅ Reading Progress</div>
                <div>Real-time tracking with time estimation</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">✅ Print & Save</div>
                <div>Offline reading and print optimization</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">✅ Accessibility</div>
                <div>WCAG 2.1 compliant with screen reader support</div>
              </div>
              <div>
                <div className="font-medium text-gray-900">✅ Mobile Responsive</div>
                <div>Touch-friendly African market optimization</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDisplayDemo;
