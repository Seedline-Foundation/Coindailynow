import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeroSection from './HeroSection';

// Mock data for testing
const mockFeaturedNews = [
  {
    id: '1',
    title: 'Test Article Title',
    excerpt: 'Test article excerpt content',
    category: 'Bitcoin',
    publishedAt: '2 hours ago',
    imageUrl: '/test-image.jpg',
    author: 'Test Author',
    readTime: '5 min read',
    slug: 'test-article-slug',
  }
];

const mockBreakingNews = [
  {
    id: 'breaking-1',
    title: 'Breaking: Test Breaking News',
    excerpt: 'Breaking news excerpt',
    category: 'Breaking',
    publishedAt: '30 minutes ago',
    author: 'Breaking News Team',
    readTime: '2 min read',
    slug: 'breaking-news-slug',
    isBreaking: true,
  }
];

// Mock Next.js components
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

jest.mock('next/image', () => {
  return ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  );
});

describe('HeroSection', () => {
  it('renders hero section with featured news', () => {
    render(
      <HeroSection 
        featuredNews={mockFeaturedNews}
        breakingNews={mockBreakingNews}
      />
    );

    // Check if the featured news title is rendered
    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    
    // Check if the breaking news is rendered
    expect(screen.getByText('Breaking News')).toBeInTheDocument();
    expect(screen.getByText('Breaking: Test Breaking News')).toBeInTheDocument();
    
    // Check if author and read time are displayed
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
    
    // Check if category badge is rendered
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
  });

  it('renders today\'s top stories section', () => {
    render(
      <HeroSection 
        featuredNews={mockFeaturedNews}
        breakingNews={mockBreakingNews}
      />
    );

    expect(screen.getByText('Today\'s Top Stories')).toBeInTheDocument();
    expect(screen.getByText('View All News')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(
      <HeroSection 
        featuredNews={mockFeaturedNews}
        breakingNews={mockBreakingNews}
      />
    );

    expect(screen.getByText('Read Full Article')).toBeInTheDocument();
    expect(screen.getByText('Listen to Article')).toBeInTheDocument();
  });

  it('handles empty news arrays gracefully', () => {
    render(
      <HeroSection 
        featuredNews={[]}
        breakingNews={[]}
      />
    );

    // Component should still render without errors
    expect(screen.getByText('Latest News')).toBeInTheDocument();
  });
});