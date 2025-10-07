import { render, screen } from '@testing-library/react';
import Home from '../../src/app/page';
import '@testing-library/jest-dom';

// Mock Next.js functions
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

describe('Home Page', () => {
  it('renders the main content', () => {
    render(<Home />);
    // Test for content that actually exists in the page
    expect(screen.getByText('CoinDaily Africa')).toBeInTheDocument();
    expect(screen.getByText(/Africa's premier cryptocurrency news platform/)).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<Home />);
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('renders feature sections', () => {
    render(<Home />);
    expect(screen.getByText('Built for African Crypto Enthusiasts')).toBeInTheDocument();
    expect(screen.getByText('African Exchange Data')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Content')).toBeInTheDocument();
    expect(screen.getByText('Multi-Language Support')).toBeInTheDocument();
  });

  it('renders community section', () => {
    render(<Home />);
    expect(screen.getByText(/Ready to Join Africa's Crypto Community/)).toBeInTheDocument();
    expect(screen.getByText('Create Free Account')).toBeInTheDocument();
  });
});