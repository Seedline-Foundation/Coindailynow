import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ChevronDownIcon, 
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  BuildingOfficeIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  NewspaperIcon,
  WrenchScrewdriverIcon,
  AcademicCapIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

// Navigation structure based on FR requirements
const NAVIGATION_ITEMS = [
  {
    id: 'services',
    label: 'Services',
    icon: BuildingOfficeIcon,
    items: [
      { label: 'List Memecoins', href: '/services/list-memecoins', description: 'Submit your memecoin for listing' },
      { label: 'Advertise', href: '/services/advertise', description: 'Promote your crypto project' },
      { label: 'Research', href: '/services/research', description: 'Professional market research' },
      { label: 'Analytics', href: '/services/analytics', description: 'Comprehensive market analytics' },
    ]
  },
  {
    id: 'products',
    label: 'Products',
    icon: ShoppingBagIcon,
    items: [
      { label: 'Academy', href: '/products/academy', description: 'Learn crypto fundamentals' },
      { label: 'Shop', href: '/products/shop', description: 'Crypto merchandise & tools' },
      { label: 'Newsletter', href: '/products/newsletter', description: 'Daily crypto insights' },
      { label: 'Video', href: '/products/video', description: 'Educational video content' },
      { label: 'Membership', href: '/products/membership', description: 'Premium subscriptions' },
      { label: 'Glossary', href: '/products/glossary', description: 'Crypto terminology guide' },
    ]
  },
  {
    id: 'market-insights',
    label: 'Market Insights',
    icon: ChartBarIcon,
    items: [
      { label: 'Live Prices', href: '/market/prices', description: 'Real-time cryptocurrency prices' },
      { label: 'Market Analysis', href: '/market/analysis', description: 'Professional market analysis' },
      { label: 'African Markets', href: '/market/african', description: 'Africa-focused market data' },
      { label: 'Memecoin Tracker', href: '/market/memecoins', description: 'Track trending memecoins' },
      { label: 'Whale Tracker', href: '/market/whales', description: 'Monitor large transactions' },
    ]
  },
  {
    id: 'news-reports',
    label: 'News & Reports',
    icon: NewspaperIcon,
    items: [
      { label: 'Breaking News', href: '/news/breaking', description: 'Latest crypto news' },
      { label: 'Market Reports', href: '/news/reports', description: 'In-depth market reports' },
      { label: 'African Crypto', href: '/news/african', description: 'Africa-specific crypto news' },
      { label: 'Regulation', href: '/news/regulation', description: 'Regulatory updates' },
      { label: 'Press Releases', href: '/news/press', description: 'Official announcements' },
    ]
  },
  {
    id: 'tools-resources',
    label: 'Tools & Resources',
    icon: WrenchScrewdriverIcon,
    items: [
      { label: 'Price Calculator', href: '/tools/calculator', description: 'Crypto price calculator' },
      { label: 'Portfolio Tracker', href: '/tools/portfolio', description: 'Track your investments' },
      { label: 'DeFi Tools', href: '/tools/defi', description: 'DeFi yield calculators' },
      { label: 'Mobile Money', href: '/tools/mobile-money', description: 'Mobile payment integration' },
      { label: 'API Access', href: '/tools/api', description: 'Developer API access' },
    ]
  },
  {
    id: 'learn',
    label: 'Learn',
    icon: AcademicCapIcon,
    items: [
      { label: 'Crypto Basics', href: '/learn/basics', description: 'Cryptocurrency fundamentals' },
      { label: 'Trading Guide', href: '/learn/trading', description: 'Learn to trade crypto' },
      { label: 'African Guide', href: '/learn/african', description: 'Crypto in Africa guide' },
      { label: 'Tutorials', href: '/learn/tutorials', description: 'Step-by-step tutorials' },
      { label: 'Webinars', href: '/learn/webinars', description: 'Live educational sessions' },
    ]
  },
  {
    id: 'about',
    label: 'About Us',
    icon: InformationCircleIcon,
    items: [
      { label: 'Our Story', href: '/about/story', description: 'Learn about CoinDaily' },
      { label: 'Team', href: '/about/team', description: 'Meet our team' },
      { label: 'Careers', href: '/about/careers', description: 'Join our team' },
      { label: 'Contact', href: '/about/contact', description: 'Get in touch' },
      { label: 'Press Kit', href: '/about/press', description: 'Media resources' },
    ]
  }
];

interface MainNavigationProps {
  className?: string;
}

export default function MainNavigation({ className }: MainNavigationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isSticky, setIsSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle sticky header behavior (FR-044)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsSticky(scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setIsOpen(false);
      setActiveDropdown(null);
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router]);

  // Handle dropdown toggle
  const handleDropdownToggle = (id: string) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(id);
      // Analytics tracking (FR-048)
      trackEvent('navigation_dropdown_open', { menu: id });
    }
  };

  // Handle search submission (FR-045)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackEvent('navigation_search', { query: searchQuery });
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  // Handle navigation clicks (FR-048)
  const handleNavClick = (label: string, href: string) => {
    trackEvent('navigation_click', { label, href });
  };

  // Keyboard navigation handler (FR-047)
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <nav 
      className={cn(
        'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-all duration-300',
        isSticky && 'fixed top-0 left-0 right-0 z-50 shadow-lg',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center"
              onClick={() => handleNavClick('Logo', '/')}
            >
              <HomeIcon className="h-8 w-8 text-orange-500" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">
                CoinDaily
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8" ref={dropdownRef}>
            {NAVIGATION_ITEMS.map((item) => (
              <div key={item.id} className="relative">
                <button
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors rounded-md',
                    activeDropdown === item.id && 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                  )}
                  onClick={() => handleDropdownToggle(item.id)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleDropdownToggle(item.id))}
                  aria-expanded={activeDropdown === item.id}
                  aria-haspopup="true"
                  aria-label={`${item.label} menu`}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                  <ChevronDownIcon 
                    className={cn(
                      'ml-2 h-4 w-4 transition-transform',
                      activeDropdown === item.id && 'rotate-180'
                    )}
                  />
                </button>

                {/* Dropdown Menu (FR-046) */}
                {activeDropdown === item.id && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="py-2">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className="block px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                          onClick={() => handleNavClick(subItem.label, subItem.href)}
                        >
                          <div className="font-medium">{subItem.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {subItem.description}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Search (FR-045) */}
          <div className="hidden lg:block">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crypto news..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                aria-label="Search crypto news"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </form>
          </div>

          {/* Mobile menu button (FR-042) */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              onKeyDown={(e) => handleKeyDown(e, () => setIsOpen(!isOpen))}
              aria-expanded={isOpen}
              aria-label="Toggle mobile menu"
              className="p-2"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation (FR-042) */}
      {isOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          {/* Mobile Search */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crypto news..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                aria-label="Search crypto news"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </form>
          </div>

          {/* Mobile Menu Items */}
          <div className="px-4 py-2 space-y-1">
            {NAVIGATION_ITEMS.map((item) => (
              <div key={item.id}>
                <button
                  className={cn(
                    'flex items-center justify-between w-full px-3 py-3 text-left text-base font-medium text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors',
                    activeDropdown === item.id && 'text-orange-500 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                  )}
                  onClick={() => handleDropdownToggle(item.id)}
                  onKeyDown={(e) => handleKeyDown(e, () => handleDropdownToggle(item.id))}
                  aria-expanded={activeDropdown === item.id}
                  aria-label={`${item.label} menu`}
                >
                  <div className="flex items-center">
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.label}
                  </div>
                  <ChevronDownIcon 
                    className={cn(
                      'h-5 w-5 transition-transform',
                      activeDropdown === item.id && 'rotate-180'
                    )}
                  />
                </button>

                {/* Mobile Dropdown */}
                {activeDropdown === item.id && (
                  <div className="mt-2 ml-8 space-y-1">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                        onClick={() => handleNavClick(subItem.label, subItem.href)}
                      >
                        <div className="font-medium">{subItem.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {subItem.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
