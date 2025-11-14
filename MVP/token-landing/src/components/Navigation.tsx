'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Presale', href: '/presale' },
    { name: 'Tokenomics', href: '/tokenomics' },
    { name: 'Staking', href: '/staking' },
    { name: 'Whitepaper', href: '/whitepaper' },
    { name: 'Pitch', href: '/pitch' },
    { name: 'Ambassador', href: '/ambassador' },
    { name: 'Careers', href: '/careers' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="fixed w-full z-50 bg-black/80 backdrop-blur-lg border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">JY</span>
            </div>
            <span className="text-xl font-bold gradient-text">Joy Token</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-300 hover:text-primary-500 transition-colors font-medium"
              >
                {item.name}
              </Link>
            ))}
            <a
              href="https://coindaily.online"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-primary-500 transition-colors font-medium"
            >
              Visit CoinDaily
            </a>
            <Link
              href="/presale"
              className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-2 rounded-full font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all"
            >
              Join Presale
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden bg-gray-900 border-t border-gray-800"
        >
          <div className="container mx-auto px-4 py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-gray-300 hover:text-primary-500 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <a
              href="https://coindaily.online"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-gray-300 hover:text-primary-500 transition-colors py-2"
            >
              Visit CoinDaily
            </a>
            <Link
              href="/presale"
              className="block bg-gradient-to-r from-primary-500 to-accent-500 text-white px-6 py-3 rounded-full font-bold text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Join Presale
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}
