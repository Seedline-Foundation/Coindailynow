import React from 'react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/analytics';

export default function NavigationDemo() {
  const handleTestAnalytics = () => {
    trackEvent('demo_button_click', {
      location: 'navigation_demo_page',
      timestamp: Date.now()
    });
    alert('Analytics event tracked! Check the browser console.');
  };

  return (
    <Layout
      showBreadcrumbs={true}
      breadcrumbItems={[
        { label: 'Home', href: '/' },
        { label: 'Demo', href: '/demo' },
        { label: 'Navigation Demo', current: true }
      ]}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Navigation System Demo
          </h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                ✅ Task 51: Main Navigation Menu System - COMPLETED
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    FR-034: Comprehensive Navigation ✅
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    All 8 main navigation sections implemented with proper structure
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    FR-035-041: Menu Sections ✅
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Services, Products, Market Insights, News & Reports, Tools, Learn, About Us
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    FR-042: Mobile Navigation ✅
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Responsive hamburger menu with mobile-optimized layout
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    FR-043: Breadcrumb Navigation ✅
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Automatic breadcrumb generation from URL path with custom support
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    FR-044: Sticky Header ✅
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Header becomes sticky on scroll with smooth animations
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    FR-045: Quick Search ✅
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Search functionality in navigation with analytics tracking
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    FR-046: Multi-level Dropdowns ✅
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Rich dropdown menus with descriptions and smooth animations
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    FR-047: Keyboard Navigation ✅
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Full keyboard support with ARIA labels for accessibility
                  </p>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    FR-048: Analytics Tracking ✅
                  </h3>
                  <p className="text-sm text-green-600 dark:text-green-300">
                    Comprehensive tracking of all navigation interactions
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Features Implemented
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    🎯 8 Main Navigation Sections
                  </h3>
                  <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                    <li>• Services (List Memecoins, Advertise, Research, Analytics)</li>
                    <li>• Products (Academy, Shop, Newsletter, Video, Membership, Glossary)</li>
                    <li>• Market Insights (Live Prices, Analysis, African Markets, Memecoin Tracker)</li>
                    <li>• News & Reports (Breaking News, Market Reports, African Crypto, Regulation)</li>
                    <li>• Tools & Resources (Calculator, Portfolio, DeFi Tools, Mobile Money, API)</li>
                    <li>• Learn (Crypto Basics, Trading Guide, African Guide, Tutorials, Webinars)</li>
                    <li>• About Us (Our Story, Team, Careers, Contact, Press Kit)</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    📱 Mobile-First Design
                  </h3>
                  <ul className="text-sm text-purple-600 dark:text-purple-300 space-y-1">
                    <li>• Hamburger menu for mobile devices</li>
                    <li>• Collapsible dropdown sections</li>
                    <li>• Touch-friendly interface</li>
                    <li>• Responsive breakpoints</li>
                  </ul>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    ♿ Accessibility Features
                  </h3>
                  <ul className="text-sm text-orange-600 dark:text-orange-300 space-y-1">
                    <li>• WCAG 2.1 compliant ARIA labels</li>
                    <li>• Keyboard navigation support</li>
                    <li>• Screen reader friendly</li>
                    <li>• Focus management</li>
                    <li>• Skip to content link</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    📊 Analytics & Performance
                  </h3>
                  <ul className="text-sm text-green-600 dark:text-green-300 space-y-1">
                    <li>• Real-time navigation analytics</li>
                    <li>• Performance monitoring</li>
                    <li>• User interaction tracking</li>
                    <li>• API endpoints for data collection</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Test Analytics Tracking
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Click the button below to test the analytics system. Check the browser console for the tracked event.
              </p>
              <Button onClick={handleTestAnalytics} className="bg-orange-500 hover:bg-orange-600">
                Test Analytics Event
              </Button>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Try Navigation Features
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Desktop Features
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Hover over navigation items to see dropdowns</li>
                    <li>• Try the search functionality</li>
                    <li>• Scroll down to see sticky header behavior</li>
                    <li>• Use keyboard navigation (Tab, Enter, Arrow keys)</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Mobile Features
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <li>• Tap the hamburger menu (≡) to open mobile navigation</li>
                    <li>• Expand navigation sections</li>
                    <li>• Use the mobile search</li>
                    <li>• Test touch interactions</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
