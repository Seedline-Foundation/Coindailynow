'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  MagnifyingGlassIcon, 
  Bars3Icon, 
  XMarkIcon,
  UserIcon,
  ClockIcon,
  ChevronDownIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  NewspaperIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  CpuChipIcon,
  ScaleIcon,
  ChartBarIcon,
  BanknotesIcon,
  CalculatorIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  RssIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { useLanguage, SUPPORTED_LANGUAGES } from '@/contexts/LanguageContext';
import { FaXTwitter, FaTelegram, FaFacebookF, FaLinkedinIn, FaYoutube } from 'react-icons/fa6';

// ====== Navigation Menu Data ======
const NAV_MENUS = [
  {
    key: 'news',
    tKey: 'news',
    href: '/news',
    icon: NewspaperIcon,
    children: [
      { tKey: 'latestNews', href: '/news', icon: NewspaperIcon },
      { tKey: 'newsAggregator', href: '/news-aggregator', icon: RssIcon },
      { tKey: 'aiSummarizer', href: '/ai-summarizer', icon: SparklesIcon },
    ],
  },
  {
    key: 'tools',
    tKey: 'tools',
    href: '/tools/exchange-rates',
    icon: WrenchScrewdriverIcon,
    children: [
      { tKey: 'exchangeRates', href: '/tools/exchange-rates', icon: CurrencyDollarIcon },
      { tKey: 'p2pPremium', href: '/tools/p2p-premium', icon: ChartBarIcon },
      { tKey: 'taxCalc', href: '/tools/tax-calculator', icon: CalculatorIcon },
      { tKey: 'remittance', href: '/tools/remittance-calculator', icon: BanknotesIcon },
      { tKey: 'onramp', href: '/tools/onramp-aggregator', icon: CreditCardIcon },
      { tKey: 'automations', href: '/automations', icon: CpuChipIcon },
    ],
  },
  {
    key: 'safety',
    tKey: 'scamWatch',
    href: '/scam-watch',
    icon: ShieldCheckIcon,
    children: [
      { tKey: 'scamWatch', href: '/scam-watch', icon: ExclamationTriangleIcon },
      { tKey: 'regulation', href: '/regulation', icon: ScaleIcon },
      { tKey: 'regulatoryBot', href: '/regulatory-bot', icon: ChatBubbleLeftRightIcon },
    ],
  },
  {
    key: 'community',
    tKey: 'community',
    href: '/events',
    icon: UserGroupIcon,
    children: [
      { tKey: 'events', href: '/events', icon: CalendarDaysIcon },
      { tKey: 'authors', href: '/authors', icon: UserGroupIcon },
      { tKey: 'expertProgram', href: '/expert-program', icon: BoltIcon },
      { tKey: 'paymentDir', href: '/payment-directory', icon: CreditCardIcon },
    ],
  },
  {
    key: 'learn',
    tKey: 'learn',
    href: '/crypto-basics',
    icon: AcademicCapIcon,
    children: [
      { tKey: 'cryptoBasics', href: '/crypto-basics', icon: AcademicCapIcon },
    ],
  },
];

// ====== Language Selector Component ======
function LanguageSelector({ isMobile = false }: { isMobile?: boolean }) {
  const { currentLanguage, setLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentLangConfig = supportedLanguages.find(l => l.code === currentLanguage) || supportedLanguages[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isMobile) {
    return (
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Language</label>
        <select
          value={currentLanguage}
          onChange={(e) => setLanguage(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.flag} {lang.nativeName} ({lang.name})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <GlobeAltIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLangConfig.flag}</span>
        <span className="hidden lg:inline text-xs">{currentLangConfig.nativeName}</span>
        <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] py-2 max-h-80 overflow-y-auto">
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Select Language</div>
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLanguage(lang.code); setIsOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                currentLanguage === lang.code ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <div className="text-left">
                <div className="font-medium">{lang.nativeName}</div>
                <div className="text-xs text-gray-400">{lang.name} &middot; {lang.region}</div>
              </div>
              {currentLanguage === lang.code && (
                <span className="ml-auto text-blue-600 text-xs font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ====== Desktop Dropdown Nav Item ======
function NavDropdown({ menu }: { menu: typeof NAV_MENUS[0] }) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = () => { clearTimeout(timeoutRef.current); setIsOpen(true); };
  const handleLeave = () => { timeoutRef.current = setTimeout(() => setIsOpen(false), 150); };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const Icon = menu.icon;

  return (
    <div ref={ref} className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        href={menu.href}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-lg whitespace-nowrap ${
          isOpen ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
        }`}
        aria-haspopup={menu.children && menu.children.length > 0 ? 'menu' : undefined}
        aria-expanded={menu.children && menu.children.length > 0 ? isOpen : undefined}
        onClick={(e) => {
          if (menu.children && menu.children.length > 0) {
            // Touch devices/tablets don't have hover; first tap opens submenu.
            if (!isOpen) {
              e.preventDefault();
              setIsOpen(true);
              return;
            }
          }
          setIsOpen(false);
        }}
      >
        <Icon className="w-4 h-4" />
        <span>{t(menu.tKey)}</span>
        {menu.children && menu.children.length > 0 && (
          <ChevronDownIcon className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </Link>

      {isOpen && menu.children && menu.children.length > 0 && (
        <div className="absolute left-0 top-full mt-0.5 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-[60] py-2" role="menu">
          {menu.children.map((child) => {
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors"
                role="menuitem"
              >
                <ChildIcon className="w-4 h-4 text-gray-400" />
                <span>{t(child.tKey)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ====== Main Header Component ======
interface HeaderProps {
  className?: string;
  showDateTime?: boolean;
}

const Header: React.FC<HeaderProps> = ({ className = '', showDateTime = true }) => {
  const { t, currentLanguage } = useLanguage();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [expandedMobileMenu, setExpandedMobileMenu] = useState<string | null>(null);

  // Update time every minute
  useEffect(() => {
    setHasMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => { if (window.innerWidth >= 768) setIsMenuOpen(false); };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const dateTimeLocale = currentLanguage || 'en';
  const dateStr = currentTime
    ? new Intl.DateTimeFormat(dateTimeLocale, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      }).format(currentTime)
    : '';
  const timeStr = currentTime
    ? new Intl.DateTimeFormat(dateTimeLocale, {
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(currentTime)
    : '';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      setIsMenuOpen(false);
    }
  };

  const toggleMobileSubmenu = (key: string) => {
    setExpandedMobileMenu(expandedMobileMenu === key ? null : key);
  };

  return (
    <header className={`bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 ${className}`}>
      {/* === ROW 1: Top utility bar — Date/Time left, Language selector right === */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-1.5 text-xs">
            {showDateTime && (
              <div className="flex items-center gap-2 text-gray-500">
                <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline" suppressHydrationWarning>
                  {hasMounted ? dateStr : ''}
                </span>
                <span className="sm:hidden" suppressHydrationWarning>
                  {hasMounted ? dateStr : ''}
                </span>
                <span className="text-blue-600 font-medium" suppressHydrationWarning>
                  {hasMounted ? timeStr : ''}
                </span>
              </div>
            )}
            {!showDateTime && <div />}

            {/* Social Media Icons */}
            <div className="flex items-center gap-1">
              <div className="hidden sm:flex items-center gap-1 mr-2">
                <a href="https://twitter.com/coindailyafrica" target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors" aria-label="X (Twitter)">
                  <FaXTwitter className="w-3.5 h-3.5" />
                </a>
                <a href="https://t.me/coindailyafrica" target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors" aria-label="Telegram">
                  <FaTelegram className="w-3.5 h-3.5" />
                </a>
                <a href="https://facebook.com/coindailyafrica" target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" aria-label="Facebook">
                  <FaFacebookF className="w-3.5 h-3.5" />
                </a>
                <a href="https://linkedin.com/company/coindaily" target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" aria-label="LinkedIn">
                  <FaLinkedinIn className="w-3.5 h-3.5" />
                </a>
                <a href="https://youtube.com/@coindailyafrica" target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" aria-label="YouTube">
                  <FaYoutube className="w-3.5 h-3.5" />
                </a>
                <span className="w-px h-4 bg-gray-200 mx-1" />
              </div>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>

      {/* === ROW 2: Logo, Search, Auth === */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2.5 gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-base">CD</span>
            </div>
            <div className="hidden xs:block">
              <h1 className="text-lg font-bold text-gray-900 leading-none">CoinDaily</h1>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">Africa&apos;s #1 Crypto News</p>
            </div>
          </Link>

          {/* Search - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className={`relative transition-all duration-200 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
                <input
                  type="text"
                  placeholder={t('search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 placeholder-gray-400 transition-all"
                />
                <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                  <MagnifyingGlassIcon className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Auth + Hamburger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <Link href="/auth/login" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-lg hover:bg-gray-50 transition-colors">
                {t('login')}
              </Link>
              <Link href="/auth/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
                {t('register')}
              </Link>
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* === ROW 3: Desktop Navigation (above marquee) === */}
      <div className="hidden md:block bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-0.5 py-1 overflow-visible" role="navigation" aria-label="Main navigation">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors whitespace-nowrap"
            >
              {t('home')}
            </Link>
            {NAV_MENUS.map((menu) => (
              <NavDropdown key={menu.key} menu={menu} />
            ))}
          </nav>
        </div>
      </div>

      {/* === Mobile Menu Overlay === */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsMenuOpen(false)}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 w-[85vw] max-w-sm bg-white z-50 md:hidden shadow-2xl overflow-y-auto"
               style={{ animation: 'slideInRight 0.2s ease-out' }}>
            {/* Mobile header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CD</span>
                </div>
                <span className="font-bold text-gray-900">CoinDaily</span>
              </Link>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MagnifyingGlassIcon className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Mobile Language Selector */}
              <LanguageSelector isMobile />

              {/* Mobile Nav */}
              <nav className="space-y-1" role="navigation" aria-label="Mobile navigation">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  {t('home')}
                </Link>

                {NAV_MENUS.map((menu) => {
                  const Icon = menu.icon;
                  const isExpanded = expandedMobileMenu === menu.key;

                  return (
                    <div key={menu.key}>
                      <button
                        onClick={() => toggleMobileSubmenu(menu.key)}
                        className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium rounded-xl transition-colors ${
                          isExpanded ? 'text-blue-600 bg-blue-50' : 'text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <span>{t(menu.tKey)}</span>
                        </div>
                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && menu.children && (
                        <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-gray-100 pl-4">
                          {menu.children.map((child) => {
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <ChildIcon className="w-4 h-4" />
                                <span>{t(child.tKey)}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Mobile Auth */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <UserIcon className="w-4 h-4" />
                  {t('login')}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                >
                  {t('register')}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CSS for slide-in animation */}
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </header>
  );
};

export default Header;
