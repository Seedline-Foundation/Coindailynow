'use client';

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Task52Demo() {
  const completionChecklist = [
    { item: '3-column responsive grid system', completed: true },
    { item: 'Dynamic ad space integration', completed: true },
    { item: 'Marquee ticker with smooth scrolling', completed: true },
    { item: 'Hero section with mouseover preview', completed: true },
    { item: 'Mobile-optimized layout', completed: true },
    { item: 'Header with Date/Time, Logo, Search, Auth', completed: true },
    { item: 'Mobile mega menu and social icons', completed: true },
    { item: 'Prominent ad banner integration', completed: true },
  ];

  const functionalRequirements = [
    { id: 'FR-049', description: 'Equal 3-column centered layout', status: 'Complete' },
    { id: 'FR-050', description: 'Full-length dynamic ad space', status: 'Complete' },
    { id: 'FR-051', description: 'Header section (Date/Time, Logo, Search, Register/Login)', status: 'Complete' },
    { id: 'FR-052', description: 'Mobile mega menu and social icons', status: 'Complete' },
    { id: 'FR-053', description: 'Marquee ticker for trending tokens', status: 'Complete' },
    { id: 'FR-054', description: 'Hero section with latest news and breaking news titles', status: 'Complete' },
    { id: 'FR-055', description: 'Prominent ad banner integration', status: 'Complete' },
  ];

  const componentsCreated = [
    {
      name: 'HeroSection.tsx',
      description: 'Main hero component with featured news and breaking news integration',
      features: ['Mouseover preview', 'Breaking news banner', 'Featured article display', 'News grid'],
    },
    {
      name: 'MarqueeTicker.tsx',
      description: 'Smooth scrolling ticker for trending tokens',
      features: ['Seamless scrolling', 'Hover to pause', 'Token price display', 'Market data integration'],
    },
    {
      name: 'Header.tsx',
      description: 'Complete header with date/time, logo, search, and authentication',
      features: ['Live date/time', 'Responsive search', 'Social icons', 'Mobile menu'],
    },
    {
      name: 'AdBanner.tsx',
      description: 'Dynamic ad management system',
      features: ['Multiple ad sizes', 'Targeting system', 'Analytics tracking', 'Performance monitoring'],
    },
    {
      name: 'ThreeColumnLayout.tsx',
      description: 'Responsive grid system with sidebars',
      features: ['Equal column layout', 'Responsive design', 'Sidebar components', 'Ad integration'],
    },
  ];

  return (
    <>
      <Head>
        <title>Task 52: Landing Page Hero & Layout - Demo | CoinDaily Africa</title>
        <meta name="description" content="Demonstration of Task 52 implementation - Landing Page Hero & Layout with 3-column grid, marquee ticker, and dynamic ads." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span>Back to Home</span>
                </Link>
                <div className="w-px h-6 bg-gray-300"></div>
                <h1 className="text-xl font-bold text-gray-900">Task 52 Demo</h1>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                ✅ Complete
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Task Overview */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Task 52: Landing Page Hero & Layout
                </h2>
                <p className="text-gray-600">
                  Implementation of comprehensive landing page with 3-column layout, hero section, marquee ticker, and dynamic ad integration.
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Priority</div>
                <div className="text-lg font-semibold text-red-600">Critical</div>
              </div>
            </div>

            {/* FR Coverage */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Functional Requirements Covered</h3>
                <div className="space-y-2">
                  {functionalRequirements.map((fr) => (
                    <div key={fr.id} className="flex items-center gap-3 text-sm">
                      <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="font-medium text-blue-600">{fr.id}:</span>
                      <span className="text-gray-700">{fr.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Acceptance Criteria</h3>
                <div className="space-y-2">
                  {completionChecklist.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-gray-700">{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Components Created */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Components Created</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {componentsCreated.map((component, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{component.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{component.description}</p>
                  <div>
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Key Features:</h5>
                    <ul className="space-y-1">
                      {component.features.map((feature, idx) => (
                        <li key={idx} className="text-xs text-gray-500 flex items-center gap-2">
                          <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Implementation */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Technical Implementation</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Key Features Implemented</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Responsive Grid System:</strong> CSS Grid with 12-column layout, responsive breakpoints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Hero Section:</strong> Interactive news preview with mouseover effects</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Marquee Ticker:</strong> Smooth CSS animations with pause on hover</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Dynamic Ads:</strong> Context-aware ad targeting and placement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Mobile Optimization:</strong> Touch-friendly interface and collapsible menus</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Performance Optimizations</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Lazy Loading:</strong> Images and components load on demand</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>CSS Animations:</strong> Hardware-accelerated transforms for smooth scrolling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Responsive Images:</strong> Multiple breakpoints and format optimization</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span><strong>Component Optimization:</strong> React.memo and useMemo for re-render optimization</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Demo Links */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">View Implementation</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/" className="flex-1">
                <div className="bg-white border border-blue-300 rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer">
                  <h4 className="font-medium text-blue-900 mb-2">Live Landing Page</h4>
                  <p className="text-sm text-blue-700">
                    View the complete implementation with all components integrated
                  </p>
                </div>
              </Link>
              
              <div className="flex-1">
                <div className="bg-white border border-blue-300 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Components Delivered</h4>
                  <p className="text-sm text-blue-700">
                    5 new components created with full responsive design and accessibility
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
