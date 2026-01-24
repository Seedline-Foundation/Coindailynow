/**
 * Article Display Components Tests
 * CoinDaily Platform - Task 21 TDD Implementation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import { ArticleReader } from '../../../src/components/articles/ArticleReader';
import { LanguageSwitcher } from '../../../src/components/articles/LanguageSwitcher';
import { SocialShareMenu } from '../../../src/components/articles/SocialShareMenu';
import { ArticleHeader } from '../../../src/components/articles/ArticleHeader';
import { ArticleContent } from '../../../src/components/articles/ArticleContent';
import { ReadingProgress } from '../../../src/components/articles/ReadingProgress';

import { Article, ArticleStatus, ArticlePriority, TranslationStatus, SUPPORTED_LANGUAGES } from '../../../src/types/article';

// Mock article data
const mockArticle: Article = {
  id: '1',
  title: 'Bitcoin Adoption Surges in Nigeria: Mobile Money Integration Drives Growth',
  slug: 'bitcoin-adoption-nigeria-mobile-money',
  excerpt: 'Nigeria leads African cryptocurrency adoption with innovative mobile money integrations...',
  content: `
    <h2>Revolutionary Changes in Nigerian Crypto Market</h2>
    <p>Nigeria's cryptocurrency landscape is experiencing unprecedented growth, driven by strategic partnerships between crypto exchanges and mobile money providers like M-Pesa and Flutterwave.</p>
    
    <h3>Key Growth Drivers</h3>
    <ul>
      <li>Mobile money integration with major exchanges</li>
      <li>Regulatory clarity from CBN guidelines</li>
      <li>Youth adoption in Lagos and Abuja tech hubs</li>
    </ul>
    
    <p>The integration of Bitcoin with traditional mobile money systems has created a seamless bridge between conventional and digital finance, making cryptocurrency accessible to Nigeria's 200 million population.</p>
  `,
  featuredImageUrl: 'https://example.com/bitcoin-nigeria.jpg',
  author: {
    id: 'author1',
    username: 'amina_crypto',
    firstName: 'Amina',
    lastName: 'Okafor',
    avatarUrl: 'https://example.com/amina.jpg'
  },
  category: {
    id: 'cat1',
    name: 'African Markets',
    slug: 'african-markets',
    colorHex: '#10B981'
  },
  tags: [
    { id: 'tag1', name: 'Bitcoin', slug: 'bitcoin' },
    { id: 'tag2', name: 'Nigeria', slug: 'nigeria' },
    { id: 'tag3', name: 'Mobile Money', slug: 'mobile-money' }
  ],
  status: ArticleStatus.PUBLISHED,
  priority: ArticlePriority.HIGH,
  isPremium: false,
  viewCount: 15420,
  likeCount: 890,
  commentCount: 156,
  shareCount: 234,
  readingTimeMinutes: 5,
  seoTitle: 'Bitcoin Adoption Nigeria Mobile Money Integration 2024',
  seoDescription: 'Discover how Nigeria is leading African crypto adoption through mobile money integration',
  publishedAt: '2024-01-15T10:30:00Z',
  createdAt: '2024-01-15T08:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  translations: [
    {
      id: 'trans1',
      articleId: '1',
      languageCode: 'en',
      title: 'Bitcoin Adoption Surges in Nigeria: Mobile Money Integration Drives Growth',
      excerpt: 'Nigeria leads African cryptocurrency adoption with innovative mobile money integrations...',
      content: '<p>Original English content...</p>',
      translationStatus: TranslationStatus.COMPLETED,
      aiGenerated: false,
      humanReviewed: true,
      qualityScore: 95,
      createdAt: '2024-01-15T08:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'trans2',
      articleId: '1',
      languageCode: 'fr',
      title: 'L\'adoption du Bitcoin explose au Nigeria: L\'intégration de l\'argent mobile stimule la croissance',
      excerpt: 'Le Nigeria mène l\'adoption africaine des cryptomonnaies avec des intégrations innovantes d\'argent mobile...',
      content: '<p>Contenu français traduit...</p>',
      translationStatus: TranslationStatus.COMPLETED,
      aiGenerated: true,
      humanReviewed: true,
      qualityScore: 88,
      createdAt: '2024-01-15T09:00:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 'trans3',
      articleId: '1',
      languageCode: 'ha',
      title: 'Karɓar Bitcoin ya karu a Najeriya: Haɗin Kuɗin Wayar Hannu yana Haifar da Girma',
      excerpt: 'Najeriya ta jagoranci karɓar cryptocurrency na Afirka tare da sabbin haɗin kuɗin wayar hannu...',
      content: '<p>Abun ciki na Hausa...</p>',
      translationStatus: TranslationStatus.COMPLETED,
      aiGenerated: true,
      humanReviewed: false,
      qualityScore: 82,
      createdAt: '2024-01-15T09:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    }
  ]
};

// Mock functions
const mockOnLanguageChange = jest.fn();
const mockOnShare = jest.fn();
const mockOnPrint = jest.fn();
const mockOnSave = jest.fn();
const mockOnProgressUpdate = jest.fn();

describe('ArticleReader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders article with all required elements', () => {
    render(
      <ArticleReader 
        article={mockArticle}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onSave={mockOnSave}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    // Article header elements
    expect(screen.getByText(mockArticle.title)).toBeInTheDocument();
    expect(screen.getByText('Amina Okafor')).toBeInTheDocument();
    expect(screen.getByText('African Markets')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();

    // Social engagement stats
    expect(screen.getByText('15,420')).toBeInTheDocument(); // view count
    expect(screen.getByText('890')).toBeInTheDocument(); // like count
    expect(screen.getByText('156')).toBeInTheDocument(); // comment count

    // Action buttons
    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  test('displays content with proper HTML rendering', () => {
    render(
      <ArticleReader 
        article={mockArticle}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onSave={mockOnSave}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText('Revolutionary Changes in Nigerian Crypto Market')).toBeInTheDocument();
    expect(screen.getByText('Key Growth Drivers')).toBeInTheDocument();
    expect(screen.getByText(/Mobile money integration with major exchanges/)).toBeInTheDocument();
  });

  test('shows premium badge for premium articles', () => {
    const premiumArticle = { ...mockArticle, isPremium: true };
    
    render(
      <ArticleReader 
        article={premiumArticle}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onSave={mockOnSave}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  test('displays breaking news badge for high priority articles', () => {
    const breakingArticle = { ...mockArticle, priority: ArticlePriority.BREAKING };
    
    render(
      <ArticleReader 
        article={breakingArticle}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onSave={mockOnSave}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByText('Breaking')).toBeInTheDocument();
  });
});

describe('LanguageSwitcher Component', () => {
  test('renders available languages from translations', () => {
    render(
      <LanguageSwitcher
        translations={mockArticle.translations}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('Hausa')).toBeInTheDocument();
  });

  test('shows translation quality indicators', () => {
    render(
      <LanguageSwitcher
        translations={mockArticle.translations}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        showQualityIndicators={true}
      />
    );

    // Check for quality score indicators
    expect(screen.getByText('95%')).toBeInTheDocument(); // English quality
    expect(screen.getByText('88%')).toBeInTheDocument(); // French quality
    expect(screen.getByText('82%')).toBeInTheDocument(); // Hausa quality
  });

  test('indicates AI vs human translation', () => {
    render(
      <LanguageSwitcher
        translations={mockArticle.translations}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        showTranslationMeta={true}
      />
    );

    expect(screen.getByText('Human')).toBeInTheDocument(); // English original
    expect(screen.getByText('AI + Human')).toBeInTheDocument(); // French reviewed
    expect(screen.getByText('AI')).toBeInTheDocument(); // Hausa AI only
  });

  test('calls onLanguageChange when language is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSwitcher
        translations={mockArticle.translations}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    await user.click(screen.getByText('Français'));
    expect(mockOnLanguageChange).toHaveBeenCalledWith('fr');
  });
});

describe('SocialShareMenu Component', () => {
  const shareData = {
    title: mockArticle.title,
    url: `https://coindaily.africa/articles/${mockArticle.slug}`,
    text: mockArticle.excerpt
  };

  test('renders all African-focused social platforms', () => {
    render(
      <SocialShareMenu
        shareData={shareData}
        onShare={mockOnShare}
      />
    );

    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Telegram')).toBeInTheDocument();
    expect(screen.getByText('Twitter/X')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
  });

  test('prioritizes popular African platforms', () => {
    render(
      <SocialShareMenu
        shareData={shareData}
        onShare={mockOnShare}
        region="africa"
      />
    );

    const platforms = screen.getAllByRole('button');
    // WhatsApp and Telegram should appear first (most popular in Africa)
    expect(platforms[0]).toHaveTextContent('WhatsApp');
    expect(platforms[1]).toHaveTextContent('Telegram');
  });

  test('calls onShare with correct platform data', async () => {
    const user = userEvent.setup();
    
    render(
      <SocialShareMenu
        shareData={shareData}
        onShare={mockOnShare}
      />
    );

    await user.click(screen.getByText('WhatsApp'));
    expect(mockOnShare).toHaveBeenCalledWith('whatsapp', shareData);
  });

  test('generates correct share URLs', () => {
    render(
      <SocialShareMenu
        shareData={shareData}
        onShare={mockOnShare}
      />
    );

    // Test WhatsApp URL format
    const whatsappButton = screen.getByText('WhatsApp').closest('button');
    expect(whatsappButton).toHaveAttribute('data-url', expect.stringContaining('wa.me'));
  });
});

describe('ArticleContent Component', () => {
  test('renders HTML content safely', () => {
    render(
      <ArticleContent
        content={mockArticle.content}
        language="en"
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Revolutionary Changes');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Key Growth Drivers');
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  test('applies RTL styling for Arabic content', () => {
    const arabicContent = '<p>محتوى عربي تجريبي</p>';
    
    render(
      <ArticleContent
        content={arabicContent}
        language="ar"
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    const contentDiv = screen.getByRole('article');
    expect(contentDiv).toHaveClass('rtl');
    expect(contentDiv).toHaveAttribute('dir', 'rtl');
  });

  test('tracks reading progress on scroll', async () => {
    // Mock intersection observer
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null
    });
    window.IntersectionObserver = mockIntersectionObserver;

    render(
      <ArticleContent
        content={mockArticle.content}
        language="en"
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    // Simulate intersection observer callback
    const [callback] = mockIntersectionObserver.mock.calls[0];
    callback([
      {
        target: document.createElement('div'),
        isIntersecting: true,
        intersectionRatio: 0.5
      }
    ]);

    await waitFor(() => {
      expect(mockOnProgressUpdate).toHaveBeenCalled();
    });
  });
});

describe('ReadingProgressBar Component', () => {
  test('displays progress percentage', () => {
    render(
      <ReadingProgress
        progress={35}
        estimatedTimeRemaining={180}
        showTimeRemaining={true}
      />
    );

    expect(screen.getByText('35%')).toBeInTheDocument();
    expect(screen.getByText('3 min remaining')).toBeInTheDocument();
  });

  test('shows completion state', () => {
    render(
      <ReadingProgress
        progress={100}
        estimatedTimeRemaining={0}
        completed={true}
      />
    );

    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('Accessibility Tests', () => {
  test('article reader meets WCAG 2.1 standards', () => {
    render(
      <ArticleReader 
        article={mockArticle}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onSave={mockOnSave}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    // Check for proper heading hierarchy
    const headings = screen.getAllByRole('heading');
    expect(headings[0]).toHaveAttribute('aria-level', '1');

    // Check for proper button labels
    const shareButton = screen.getByRole('button', { name: /share/i });
    expect(shareButton).toHaveAttribute('aria-label');

    // Check for proper article structure
    const article = screen.getByRole('article');
    expect(article).toHaveAttribute('aria-labelledby');
  });

  test('language switcher is keyboard accessible', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSwitcher
        translations={mockArticle.translations}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    const switcher = screen.getByRole('combobox');
    await user.tab();
    expect(switcher).toHaveFocus();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    expect(mockOnLanguageChange).toHaveBeenCalled();
  });

  test('social share menu supports screen readers', () => {
    render(
      <SocialShareMenu
        shareData={{
          title: mockArticle.title,
          url: `https://coindaily.africa/articles/${mockArticle.slug}`,
          text: mockArticle.excerpt
        }}
        onShare={mockOnShare}
      />
    );

    const shareButtons = screen.getAllByRole('button');
    shareButtons.forEach(button => {
      expect(button).toHaveAttribute('aria-label');
      expect(button).toHaveAttribute('title');
    });
  });
});

describe('Performance Tests', () => {
  test('article content renders within performance budget', async () => {
    const startTime = performance.now();
    
    render(
      <ArticleReader 
        article={mockArticle}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
        onShare={mockOnShare}
        onPrint={mockOnPrint}
        onSave={mockOnSave}
        onProgressUpdate={mockOnProgressUpdate}
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render within 100ms for good UX
    expect(renderTime).toBeLessThan(100);
  });

  test('language switching is instantaneous', async () => {
    const user = userEvent.setup();
    
    render(
      <LanguageSwitcher
        translations={mockArticle.translations}
        currentLanguage="en"
        onLanguageChange={mockOnLanguageChange}
      />
    );

    const startTime = performance.now();
    await user.click(screen.getByText('Français'));
    const endTime = performance.now();

    // Language switch should be immediate
    expect(endTime - startTime).toBeLessThan(50);
  });
});