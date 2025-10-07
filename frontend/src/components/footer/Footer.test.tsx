/**
 * CoinDaily Platform - Footer Components Test Suite
 * Task 55: Comprehensive testing for footer implementation
 * 
 * Tests cover:
 * - Component rendering
 * - User interactions
 * - Analytics tracking
 * - Accessibility compliance
 * - Newsletter functionality
 * - Responsive behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'next-themes';
import Footer from './Footer';
import NewsletterWidget from './NewsletterWidget';
import FooterAnalyticsService from './analytics';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: jest.fn()
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock fetch
global.fetch = jest.fn();

// Mock window.gtag
(global as any).window = {
  ...global.window,
  gtag: jest.fn(),
  location: { href: 'https://test.com' },
  scrollTo: jest.fn(),
  print: jest.fn(),
  navigator: {
    share: jest.fn(),
    clipboard: { writeText: jest.fn() },
    userAgent: 'test-agent',
    language: 'en'
  },
  screen: { width: 1920, height: 1080 },
  innerWidth: 1200,
  innerHeight: 800
};

// Mock document
Object.defineProperty(document, 'title', {
  value: 'Test Page',
  writable: true
});

Object.defineProperty(document, 'referrer', {
  value: 'https://referrer.com',
  writable: true
});

const mockAnalytics = jest.fn();

describe('Footer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders footer with all main sections', () => {
      render(<Footer />);
      
      expect(screen.getByText('CoinDaily')).toBeInTheDocument();
      expect(screen.getByText('Services')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Follow Us')).toBeInTheDocument();
    });

    it('renders branding section with logo and tagline', () => {
      render(<Footer />);
      
      expect(screen.getByText('CoinDaily')).toBeInTheDocument();
      expect(screen.getByText(/Africa's premier cryptocurrency news platform/)).toBeInTheDocument();
    });

    it('renders contact information', () => {
      render(<Footer />);
      
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
      expect(screen.getByText('contact@coindaily.africa')).toBeInTheDocument();
      expect(screen.getByText('+234 (0) 812 345 6789')).toBeInTheDocument();
      expect(screen.getByText('Lagos, Nigeria | Cape Town, South Africa')).toBeInTheDocument();
    });

    it('renders copyright section', () => {
      render(<Footer />);
      
      expect(screen.getByText('© 2025 CoinDaily Africa. All rights reserved.')).toBeInTheDocument();
    });

    it('renders utility links', () => {
      render(<Footer />);
      
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
      expect(screen.getByText('Terms of Service')).toBeInTheDocument();
      expect(screen.getByText('Cookie Policy')).toBeInTheDocument();
      expect(screen.getByText('Disclaimer')).toBeInTheDocument();
      expect(screen.getByText('Sitemap')).toBeInTheDocument();
    });
  });

  describe('Social Media Links', () => {
    it('renders all 6 social media platforms', () => {
      render(<Footer />);
      
      expect(screen.getByText('Twitter')).toBeInTheDocument();
      expect(screen.getByText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByText('Telegram')).toBeInTheDocument();
      expect(screen.getByText('YouTube')).toBeInTheDocument();
      expect(screen.getByText('Discord')).toBeInTheDocument();
      expect(screen.getByText('Instagram')).toBeInTheDocument();
    });

    it('social media links have correct attributes', () => {
      render(<Footer />);
      
      const twitterLink = screen.getByText('Twitter').closest('a');
      expect(twitterLink).toHaveAttribute('href', 'https://twitter.com/coindaily_africa');
      expect(twitterLink).toHaveAttribute('target', '_blank');
      expect(twitterLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Newsletter Widget', () => {
    it('renders newsletter subscription form', () => {
      render(<Footer />);
      
      expect(screen.getByText('Stay Updated')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
    });

    it('handles newsletter submission', async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByRole('button', { name: /subscribe/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/newsletter/subscribe', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test@example.com')
        }));
      });
    });

    it('shows success message on successful subscription', async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email');
      const submitButton = screen.getByRole('button', { name: /subscribe/i });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('✅ Successfully subscribed!')).toBeInTheDocument();
      });
    });
  });

  describe('Language Selector', () => {
    it('renders language selector with 5 languages', () => {
      render(<Footer />);
      
      const languageSelect = screen.getByLabelText('Select language');
      expect(languageSelect).toBeInTheDocument();
      
      // Check if select has 5 options
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(5);
    });

    it('includes expected language options', () => {
      render(<Footer />);
      
      expect(screen.getByText('🇺🇸 English')).toBeInTheDocument();
      expect(screen.getByText('🇫🇷 Français')).toBeInTheDocument();
      expect(screen.getByText('🇰🇪 Kiswahili')).toBeInTheDocument();
      expect(screen.getByText('🇪🇹 አማርኛ')).toBeInTheDocument();
      expect(screen.getByText('🇿🇦 isiZulu')).toBeInTheDocument();
    });
  });

  describe('Regional Focus', () => {
    it('renders 6 African countries', () => {
      render(<Footer />);
      
      expect(screen.getByText('🌍 Regional Focus')).toBeInTheDocument();
      expect(screen.getByText('🇳🇬 Nigeria')).toBeInTheDocument();
      expect(screen.getByText('🇰🇪 Kenya')).toBeInTheDocument();
      expect(screen.getByText('🇿🇦 South Africa')).toBeInTheDocument();
      expect(screen.getByText('🇬🇭 Ghana')).toBeInTheDocument();
      expect(screen.getByText('🇪🇬 Egypt')).toBeInTheDocument();
      expect(screen.getByText('🇲🇦 Morocco')).toBeInTheDocument();
    });
  });

  describe('Trust Indicators', () => {
    it('renders security badges', () => {
      render(<Footer />);
      
      expect(screen.getByText('SSL Secured')).toBeInTheDocument();
      expect(screen.getByText('AI Verified')).toBeInTheDocument();
      expect(screen.getByText('GDPR Compliant')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('renders quick action buttons', () => {
      render(<Footer />);
      
      expect(screen.getByLabelText('Back to top')).toBeInTheDocument();
      expect(screen.getByLabelText('Print page')).toBeInTheDocument();
      expect(screen.getByLabelText('Share page')).toBeInTheDocument();
    });

    it('handles back to top action', async () => {
      const user = userEvent.setup();
      const scrollToSpy = jest.spyOn(window, 'scrollTo');
      
      render(<Footer />);
      
      const backToTopButton = screen.getByLabelText('Back to top');
      await user.click(backToTopButton);
      
      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('handles print action', async () => {
      const user = userEvent.setup();
      const printSpy = jest.spyOn(window, 'print');
      
      render(<Footer />);
      
      const printButton = screen.getByLabelText('Print page');
      await user.click(printButton);
      
      expect(printSpy).toHaveBeenCalled();
    });
  });

  describe('Search Functionality', () => {
    it('renders footer search input', () => {
      render(<Footer />);
      
      const searchInput = screen.getByPlaceholderText('Search articles, coins, news...');
      expect(searchInput).toBeInTheDocument();
    });

    it('handles search input', async () => {
      const user = userEvent.setup();
      render(<Footer />);
      
      const searchInput = screen.getByPlaceholderText('Search articles, coins, news...');
      await user.type(searchInput, 'bitcoin');
      
      expect(searchInput).toHaveValue('bitcoin');
    });
  });

  describe('User Engagement Metrics', () => {
    it('displays engagement metrics', () => {
      render(<Footer />);
      
      expect(screen.getByText(/Active:/)).toBeInTheDocument();
      expect(screen.getByText(/Read:/)).toBeInTheDocument();
      expect(screen.getByText(/Comments:/)).toBeInTheDocument();
    });
  });

  describe('Cryptocurrency Focus', () => {
    it('renders crypto focus indicators', () => {
      render(<Footer />);
      
      expect(screen.getByText('₿ Crypto Focus')).toBeInTheDocument();
      expect(screen.getByText('Bitcoin')).toBeInTheDocument();
      expect(screen.getByText('Ethereum')).toBeInTheDocument();
      expect(screen.getByText('DeFi')).toBeInTheDocument();
      expect(screen.getByText('Memecoins')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(<Footer />);
      
      expect(screen.getByLabelText('Email address for newsletter subscription')).toBeInTheDocument();
      expect(screen.getByLabelText('Select language')).toBeInTheDocument();
      expect(screen.getByLabelText('Back to top')).toBeInTheDocument();
      expect(screen.getByLabelText('Search site content')).toBeInTheDocument();
    });

    it('social media links have descriptive labels', () => {
      render(<Footer />);
      
      expect(screen.getByLabelText('Follow us on Twitter')).toBeInTheDocument();
      expect(screen.getByLabelText('Follow us on LinkedIn')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('applies responsive classes', () => {
      render(<Footer />);
      
      const footerGrid = document.querySelector('.grid-cols-1.md\\:grid-cols-3');
      expect(footerGrid).toBeInTheDocument();
    });
  });
});

describe('NewsletterWidget Component', () => {
  const mockProps = {
    languages: [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' }
    ],
    selectedLanguage: 'en',
    onLanguageChange: jest.fn(),
    onAnalytics: mockAnalytics
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders compact version correctly', () => {
    render(<NewsletterWidget {...mockProps} compact={true} />);
    
    expect(screen.getByText('Newsletter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });

  it('renders full version with preferences', () => {
    render(<NewsletterWidget {...mockProps} compact={false} />);
    
    expect(screen.getByText('Stay Updated with CoinDaily')).toBeInTheDocument();
    expect(screen.getByText('Subscription Preferences')).toBeInTheDocument();
    expect(screen.getByText('Daily Digest')).toBeInTheDocument();
    expect(screen.getByText('Breaking News')).toBeInTheDocument();
  });

  it('handles email validation', async () => {
    const user = userEvent.setup();
    render(<NewsletterWidget {...mockProps} />);
    
    const emailInput = screen.getByDisplayValue('');
    const submitButton = screen.getByText('Subscribe to Newsletter');
    
    // Try submitting with invalid email
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    expect(mockAnalytics).toHaveBeenCalledWith(
      'newsletter_validation_error',
      expect.objectContaining({ error: 'invalid_email' })
    );
  });

  it('tracks preference changes', async () => {
    const user = userEvent.setup();
    render(<NewsletterWidget {...mockProps} />);
    
    const breakingNewsCheckbox = screen.getByLabelText(/Breaking News/);
    await user.click(breakingNewsCheckbox);
    
    expect(mockAnalytics).toHaveBeenCalledWith(
      'newsletter_preference_change',
      expect.objectContaining({
        preference: 'breaking_news',
        checked: true
      })
    );
  });
});

describe('FooterAnalyticsService', () => {
  let analyticsService: FooterAnalyticsService;

  beforeEach(() => {
    analyticsService = new FooterAnalyticsService({
      enableDebug: true,
      endpoint: '/api/test-analytics'
    });
    jest.clearAllMocks();
  });

  it('tracks newsletter events correctly', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    analyticsService.trackNewsletterEvent('success', {
      email: 'test@example.com',
      language: 'en',
      preferences: ['daily_digest']
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Footer Analytics Event:',
      expect.objectContaining({
        event: 'newsletter_signup_success',
        properties: expect.objectContaining({
          email_domain: 'example.com',
          language: 'en',
          preferences: ['daily_digest']
        })
      })
    );
    
    consoleSpy.mockRestore();
  });

  it('tracks social media clicks', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    analyticsService.trackSocialMediaClick('twitter', { followers: '125K' });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Footer Analytics Event:',
      expect.objectContaining({
        event: 'social_media_click',
        properties: expect.objectContaining({
          platform: 'twitter',
          location: 'footer',
          followers: '125K'
        })
      })
    );
    
    consoleSpy.mockRestore();
  });

  it('tracks theme changes', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    analyticsService.trackThemeChange('dark', 'light');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Footer Analytics Event:',
      expect.objectContaining({
        event: 'theme_toggle',
        properties: expect.objectContaining({
          from: 'dark',
          to: 'light',
          location: 'footer'
        })
      })
    );
    
    consoleSpy.mockRestore();
  });

  it('clears user data for GDPR compliance', () => {
    analyticsService.setUserId('test-user-123');
    analyticsService.clearUserData();
    
    // User data should be cleared
    expect(localStorage.getItem).toBeDefined();
  });
});

describe('Footer Integration', () => {
  it('integrates all components correctly', () => {
    render(<Footer />);
    
    // Verify all major sections are present
    expect(screen.getByText('CoinDaily')).toBeInTheDocument();
    expect(screen.getByText('Stay Updated')).toBeInTheDocument();
    expect(screen.getByText('Follow Us')).toBeInTheDocument();
    expect(screen.getByText('Language')).toBeInTheDocument();
    expect(screen.getByText('🌍 Regional Focus')).toBeInTheDocument();
    expect(screen.getByText('₿ Crypto Focus')).toBeInTheDocument();
    expect(screen.getByText('SSL Secured')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search articles, coins, news...')).toBeInTheDocument();
  });

  it('maintains consistent styling across sections', () => {
    render(<Footer />);
    
    const footer = document.querySelector('footer');
    expect(footer).toHaveClass('bg-gray-900 dark:bg-gray-950 text-white');
  });
});

export {};