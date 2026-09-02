import { render, screen } from '@testing-library/react';
import Home from '../../src/app/page';
import '@testing-library/jest-dom';

// Mock Next.js functions
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockImplementation(() => Promise.resolve({
    get: jest.fn().mockReturnValue({ value: 'ng' }),
    getAll: jest.fn().mockReturnValue([]),
    has: jest.fn().mockReturnValue(false),
  })),
  headers: jest.fn().mockReturnValue(new Map()),
}));

describe('Home Page', () => {
  it('renders the main content', async () => {
    const jsx = await Home({});
    render(jsx);
    expect(screen.getByText('Narrative Spotlight')).toBeInTheDocument();
  });

  it('renders intelligence streams section', async () => {
    const jsx = await Home({});
    render(jsx);
    expect(screen.getByText('Intelligence Streams')).toBeInTheDocument();
  });

  it('renders narrative clusters', async () => {
    const jsx = await Home({});
    render(jsx);
    expect(screen.getByText(/Stablecoin Hedging Surges/)).toBeInTheDocument();
  });
});