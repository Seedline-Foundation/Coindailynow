/**
 * Marketplace Checkout Example Page
 * Demonstrates wallet integration in product checkout
 */

import React, { useState } from 'react';
import { MarketplaceCart } from '../../components/wallet';

// Example products (replace with actual product data)
const EXAMPLE_PRODUCTS = [
  {
    id: 'product-1',
    name: 'Premium Article Access (Monthly)',
    description: 'Get unlimited access to all premium articles',
    price: 9.99,
    currency: 'JY',
    category: 'Subscription',
    image: '/images/products/premium-access.jpg'
  },
  {
    id: 'product-2',
    name: 'AI Market Analysis Report',
    description: 'Detailed AI-powered market analysis and predictions',
    price: 24.99,
    currency: 'JY',
    category: 'Report',
    image: '/images/products/market-report.jpg'
  },
  {
    id: 'product-3',
    name: 'VIP Event Access Pass',
    description: 'Exclusive access to VIP cryptocurrency events',
    price: 49.99,
    currency: 'JY',
    category: 'Event',
    image: '/images/products/vip-pass.jpg'
  }
];

export default function MarketplaceCheckoutPage() {
  // Example cart state (replace with actual cart management)
  const [cartItems] = useState([
    { product: EXAMPLE_PRODUCTS[0], quantity: 1 },
    { product: EXAMPLE_PRODUCTS[1], quantity: 2 }
  ]);

  const handleCheckoutComplete = () => {
    // Redirect to success page or show confirmation
    alert('Order completed successfully!');
    window.location.href = '/marketplace';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Checkout
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Complete your purchase using your wallet balance
        </p>
      </div>

      <MarketplaceCart
        cartItems={cartItems}
        onCheckout={handleCheckoutComplete}
      />
    </div>
  );
}

