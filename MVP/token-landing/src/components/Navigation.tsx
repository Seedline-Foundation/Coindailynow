'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aboutUsOpen, setAboutUsOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { 
      name: 'About Us', 
      href: '/about',
      dropdown: [
        { name: 'About Us', href: '/about' },
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Contact Us', href: '/contact' },
      ]
    },
    { name: 'Presale', href: '/presale' },
    { name: 'Tokenomics', href: '/tokenomics' },
    { name: 'Staking', href: '/staking' },
    { name: 'Whitepaper', href: '/whitepaper' },
    { name: 'Pitch', href: '/pitch' },
    { name: 'Bounties', href: '/bounty' },
    { name: 'OG Champs', href: '/ambassador' },
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
              item.dropdown ? (
                <div 
                  key={item.name} 
                  className="relative"
                  onMouseEnter={() => setAboutUsOpen(true)}
                  onMouseLeave={() => setAboutUsOpen(false)}
                >
                  <button className="text-gray-300 hover:text-primary-500 transition-colors font-medium flex items-center space-x-1">
                    <span>{item.name}</span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  <AnimatePresence>
                    {aboutUsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl overflow-hidden"
                      >
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block px-4 py-3 text-gray-300 hover:text-primary-500 hover:bg-gray-800 transition-colors"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-300 hover:text-primary-500 transition-colors font-medium"
                >
                  {item.name}
                </Link>
              )
            ))}
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
              item.dropdown ? (
                <div key={item.name}>
                  <button
                    onClick={() => setAboutUsOpen(!aboutUsOpen)}
                    className="flex items-center justify-between w-full text-gray-300 hover:text-primary-500 transition-colors py-2"
                  >
                    <span>{item.name}</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${aboutUsOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {aboutUsOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="pl-4 space-y-2"
                      >
                        {item.dropdown.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className="block text-gray-400 hover:text-primary-500 transition-colors py-2"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block text-gray-300 hover:text-primary-500 transition-colors py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              )
            ))}
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
