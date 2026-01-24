'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  MagnifyingGlassIcon, 
  Bars3Icon, 
  XMarkIcon,
  UserIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  className?: string;
  showDateTime?: boolean;
  showSocialIcons?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  className = '',
  showDateTime = true,
  showSocialIcons = true,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Format date and time for African audience
  const formatDateTime = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    };

    const dateStr = date.toLocaleDateString('en-US', options);
    const timeStr = date.toLocaleTimeString('en-US', timeOptions);
    
    return { dateStr, timeStr };
  };

  const { dateStr, timeStr } = formatDateTime(currentTime);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Handle search - redirect to search page
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const socialLinks = [
    { name: 'Twitter', href: 'https://twitter.com/coindailyafrica', icon: '🐦' },
    { name: 'Telegram', href: 'https://t.me/coindailyafrica', icon: '📱' },
    { name: 'Discord', href: 'https://discord.gg/coindailyafrica', icon: '💬' },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/coindailyafrica', icon: '💼' },
    { name: 'YouTube', href: 'https://youtube.com/@coindailyafrica', icon: '📺' },
    { name: 'Instagram', href: 'https://instagram.com/coindailyafrica', icon: '📷' },
  ];

  return (
    <header className={`bg-white border-b border-gray-200 shadow-sm ${className}`}>
      {/* Top Bar - Date/Time and Social Icons */}
      {(showDateTime || showSocialIcons) && (
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2 text-sm">
              {/* Date and Time */}
              {showDateTime && (
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{dateStr}</span>
                    <span className="sm:hidden">{new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="text-blue-600 font-medium">
                    {timeStr}
                  </div>
                </div>
              )}

              {/* Social Icons */}
              {showSocialIcons && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 text-xs hidden sm:inline">Follow us:</span>
                  <div className="flex items-center gap-2">
                    {socialLinks.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 hover:bg-blue-100 transition-colors text-xs"
                        title={social.name}
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CD</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">CoinDaily</h1>
                <p className="text-xs text-gray-500 -mt-1">Africa</p>
              </div>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full">
              <div className={`relative transition-all duration-200 ${
                isSearchFocused ? 'scale-105' : ''
              }`}>
                <input
                  type="text"
                  placeholder="Search crypto news, tokens, analysis..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                <UserIcon className="w-4 h-4 mr-2" />
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                Register
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            {isMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-blue-600"
                >
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Mobile Auth Buttons */}
            <div className="flex flex-col gap-2">
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link href="/auth/register" className="w-full">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Register
                </Button>
              </Link>
            </div>

            {/* Mobile Social Links */}
            {showSocialIcons && (
              <div className="pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 mb-3">Follow us:</p>
                <div className="grid grid-cols-3 gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <span>{social.icon}</span>
                      <span>{social.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
