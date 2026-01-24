import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/router';
import MainNavigation from './MainNavigation';
import BreadcrumbNavigation from './BreadcrumbNavigation';
import { trackEvent } from '@/lib/analytics';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock analytics
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

const mockRouter = {
  asPath: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
  },
  push: jest.fn(),
};

describe('MainNavigation', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  it('renders the main navigation menu', () => {
    render(<MainNavigation />);
    
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByText('CoinDaily')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Market Insights')).toBeInTheDocument();
  });

  it('shows mobile menu when hamburger button is clicked', () => {
    render(<MainNavigation />);
    
    const hamburgerButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(hamburgerButton);
    
    // Check if mobile menu items are visible
    expect(screen.getByPlaceholderText('Search crypto news...')).toBeInTheDocument();
  });

  it('opens dropdown menu when navigation item is clicked', () => {
    render(<MainNavigation />);
    
    const servicesButton = screen.getByRole('button', { name: /services menu/i });
    fireEvent.click(servicesButton);
    
    expect(screen.getByText('List Memecoins')).toBeInTheDocument();
    expect(screen.getByText('Advertise')).toBeInTheDocument();
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('tracks analytics events when navigation items are clicked', () => {
    render(<MainNavigation />);
    
    const servicesButton = screen.getByRole('button', { name: /services menu/i });
    fireEvent.click(servicesButton);
    
    expect(trackEvent).toHaveBeenCalledWith('navigation_dropdown_open', {
      menu: 'services'
    });
  });

  it('handles search form submission', () => {
    render(<MainNavigation />);
    
    const searchInput = screen.getByPlaceholderText('Search crypto news...');
    const searchForm = searchInput.closest('form');
    
    fireEvent.change(searchInput, { target: { value: 'bitcoin' } });
    fireEvent.submit(searchForm!);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/search?q=bitcoin');
    expect(trackEvent).toHaveBeenCalledWith('navigation_search', {
      query: 'bitcoin'
    });
  });

  it('applies sticky navigation styles when scrolled', () => {
    render(<MainNavigation />);
    
    // Simulate scroll
    Object.defineProperty(window, 'scrollY', { value: 150, writable: true });
    fireEvent.scroll(window);
    
    waitFor(() => {
      const nav = screen.getByRole('navigation');
      expect(nav.className).toContain('fixed');
      expect(nav.className).toContain('top-0');
      expect(nav.className).toContain('shadow-lg');
    });
  });

  it('supports keyboard navigation', () => {
    render(<MainNavigation />);
    
    const servicesButton = screen.getByRole('button', { name: /services menu/i });
    
    // Simulate Enter key press
    fireEvent.keyDown(servicesButton, { key: 'Enter' });
    
    expect(screen.getByText('List Memecoins')).toBeInTheDocument();
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<MainNavigation />);
    
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
    expect(screen.getByLabelText('Toggle mobile menu')).toBeInTheDocument();
    expect(screen.getByLabelText('Search crypto news')).toBeInTheDocument();
  });
});

describe('BreadcrumbNavigation', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      asPath: '/news/crypto/bitcoin-analysis'
    });
  });

  it('generates breadcrumbs from router path', () => {
    render(<BreadcrumbNavigation />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('News')).toBeInTheDocument();
    expect(screen.getByText('Crypto')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin Analysis')).toBeInTheDocument();
  });

  it('renders custom breadcrumb items when provided', () => {
    const customItems = [
      { label: 'Home', href: '/' },
      { label: 'Custom Page', href: '/custom' },
      { label: 'Current Page', current: true }
    ];
    
    render(<BreadcrumbNavigation items={customItems} />);
    
    expect(screen.getByText('Custom Page')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
  });

  it('does not render on home page', () => {
    (useRouter as jest.Mock).mockReturnValue({
      ...mockRouter,
      asPath: '/'
    });
    
    const { container } = render(<BreadcrumbNavigation />);
    expect(container.firstChild).toBeNull();
  });

  it('tracks breadcrumb clicks', () => {
    render(<BreadcrumbNavigation />);
    
    const homeLink = screen.getByRole('link', { name: /go to home page/i });
    fireEvent.click(homeLink);
    
    expect(trackEvent).toHaveBeenCalledWith('breadcrumb_click', {
      label: 'Home',
      href: '/'
    });
  });

  it('has proper accessibility attributes', () => {
    render(<BreadcrumbNavigation />);
    
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Breadcrumb');
    expect(screen.getByText('Bitcoin Analysis')).toHaveAttribute('aria-current', 'page');
  });
});

describe('Navigation Integration', () => {
  it('closes mobile menu when route changes', () => {
    render(<MainNavigation />);
    
    // Open mobile menu
    const hamburgerButton = screen.getByLabelText('Toggle mobile menu');
    fireEvent.click(hamburgerButton);
    
    // Simulate route change
    const routeChangeCallback = mockRouter.events.on.mock.calls
      .find(call => call[0] === 'routeChangeStart')[1];
    
    routeChangeCallback();
    
    // Mobile menu should be closed (hamburger icon should be visible again)
    expect(screen.getByLabelText('Toggle mobile menu')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', () => {
    render(<MainNavigation />);
    
    // Open dropdown
    const servicesButton = screen.getByRole('button', { name: /services menu/i });
    fireEvent.click(servicesButton);
    
    expect(screen.getByText('List Memecoins')).toBeInTheDocument();
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    waitFor(() => {
      expect(screen.queryByText('List Memecoins')).not.toBeInTheDocument();
    });
  });
});
