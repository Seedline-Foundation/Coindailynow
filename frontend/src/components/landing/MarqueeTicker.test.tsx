import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MarqueeTicker from './MarqueeTicker';

// Mock trending tokens data
const mockTrendingTokens = [
  {
    id: '1',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250.00,
    change24h: 1250.50,
    changePercent24h: 2.98,
    isHot: true,
    marketCap: 846000000000,
    volume24h: 24500000000,
  },
  {
    id: '2',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2650.75,
    change24h: -32.25,
    changePercent24h: -1.20,
    marketCap: 318000000000,
    volume24h: 12300000000,
  }
];

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('MarqueeTicker', () => {
  it('renders trending tokens', () => {
    render(<MarqueeTicker tokens={mockTrendingTokens} />);

    // Check if token symbols are displayed
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    
    // Check if token names are displayed
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('displays price information correctly', () => {
    render(<MarqueeTicker tokens={mockTrendingTokens} />);

    // Check if prices are formatted correctly
    expect(screen.getByText('$43,250')).toBeInTheDocument();
    expect(screen.getByText('$2,650.75')).toBeInTheDocument();
  });

  it('shows percentage changes with correct styling', () => {
    render(<MarqueeTicker tokens={mockTrendingTokens} />);

    // Check if percentage changes are displayed
    expect(screen.getByText('+2.98%')).toBeInTheDocument();
    expect(screen.getByText('-1.20%')).toBeInTheDocument();
  });

  it('displays trending label', () => {
    render(<MarqueeTicker tokens={mockTrendingTokens} />);

    expect(screen.getByText('Trending')).toBeInTheDocument();
  });

  it('handles empty token list', () => {
    render(<MarqueeTicker tokens={[]} />);

    // Component should not render when no tokens are provided
    expect(screen.queryByText('Trending')).not.toBeInTheDocument();
  });

  it('shows volume information when enabled', () => {
    render(<MarqueeTicker tokens={mockTrendingTokens} showVolume={true} />);

    // Check if volume is displayed (formatted)
    expect(screen.getByText(/Vol: 24.5B/)).toBeInTheDocument();
    expect(screen.getByText(/Vol: 12.3B/)).toBeInTheDocument();
  });
});
