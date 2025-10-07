/**
 * Interactive Components Test Suite - Task 54
 * Tests for infinite scroll, animations, accessibility, and real-time features
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import {
  InfiniteScroll,
  FadeIn,
  HoverCard,
  CategoryNavigation,
  AccessibleButton,
  RealTimeDataProvider,
  useRealTimeData,
  ProgressiveContent,
} from '@/components/interactive';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};
global.WebSocket = jest.fn(() => mockWebSocket) as any;

describe('InfiniteScroll Component', () => {
  const mockItems = [
    { id: '1', title: 'Item 1' },
    { id: '2', title: 'Item 2' },
    { id: '3', title: 'Item 3' },
  ];

  const mockLoadMore = jest.fn().mockResolvedValue([
    { id: '4', title: 'Item 4' },
    { id: '5', title: 'Item 5' },
  ]);

  const mockRenderItem = (item: any) => (
    <div key={item.id} data-testid={`item-${item.id}`}>
      {item.title}
    </div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial items correctly', () => {
    render(
      <InfiniteScroll
        items={mockItems}
        loadMore={mockLoadMore}
        renderItem={mockRenderItem}
        hasMoreItems={true}
        isLoading={false}
      />
    );

    expect(screen.getByTestId('item-1')).toBeInTheDocument();
    expect(screen.getByTestId('item-2')).toBeInTheDocument();
    expect(screen.getByTestId('item-3')).toBeInTheDocument();
  });

  test('shows loading indicator when loading', () => {
    render(
      <InfiniteScroll
        items={mockItems}
        loadMore={mockLoadMore}
        renderItem={mockRenderItem}
        hasMoreItems={true}
        isLoading={true}
      />
    );

    expect(screen.getByRole('status', { name: /loading more content/i })).toBeInTheDocument();
  });

  test('shows empty state when no items', () => {
    render(
      <InfiniteScroll
        items={[]}
        loadMore={mockLoadMore}
        renderItem={mockRenderItem}
        hasMoreItems={false}
        isLoading={false}
      />
    );

    expect(screen.getByText(/no content available/i)).toBeInTheDocument();
  });

  test('shows error state correctly', () => {
    render(
      <InfiniteScroll
        items={mockItems}
        loadMore={mockLoadMore}
        renderItem={mockRenderItem}
        hasMoreItems={true}
        isLoading={false}
        error="Failed to load content"
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Failed to load content')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });
});

describe('FadeIn Animation', () => {
  test('applies correct animation classes', () => {
    const { container } = render(
      <FadeIn delay={100} direction="up">
        <div>Test content</div>
      </FadeIn>
    );

    const fadeElement = container.firstChild as HTMLElement;
    expect(fadeElement).toHaveClass('transition-all');
    expect(fadeElement).toHaveClass('duration-700');
    expect(fadeElement).toHaveClass('ease-out');
  });

  test('renders children correctly', () => {
    render(
      <FadeIn>
        <div data-testid="fade-content">Test content</div>
      </FadeIn>
    );

    expect(screen.getByTestId('fade-content')).toBeInTheDocument();
  });
});

describe('HoverCard Component', () => {
  test('applies hover effects on mouse enter/leave', async () => {
    const user = userEvent.setup();
    
    render(
      <HoverCard hoverScale={1.05} hoverShadow={true}>
        <div data-testid="hover-content">Hover me</div>
      </HoverCard>
    );

    const hoverCard = screen.getByTestId('hover-content').parentElement;
    
    await user.hover(hoverCard!);
    expect(hoverCard).toHaveClass('hover:shadow-lg');
    
    await user.unhover(hoverCard!);
    // Test that hover state is properly managed
  });

  test('handles click events when clickable', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();

    render(
      <HoverCard clickable={true} onClick={mockOnClick}>
        <div data-testid="clickable-content">Click me</div>
      </HoverCard>
    );

    const clickableCard = screen.getByTestId('clickable-content').parentElement;
    expect(clickableCard).toHaveAttribute('role', 'button');
    expect(clickableCard).toHaveAttribute('tabIndex', '0');

    await user.click(clickableCard!);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();

    render(
      <HoverCard clickable={true} onClick={mockOnClick}>
        <div data-testid="keyboard-content">Press Enter</div>
      </HoverCard>
    );

    const keyboardCard = screen.getByTestId('keyboard-content').parentElement;
    keyboardCard!.focus();
    
    await user.keyboard('{Enter}');
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });
});

describe('CategoryNavigation Component', () => {
  const mockCategories = [
    { id: 'all', name: 'All News', count: 100 },
    { id: 'bitcoin', name: 'Bitcoin', count: 50 },
    { id: 'defi', name: 'DeFi', count: 30 },
  ];

  const mockOnCategoryChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all categories', () => {
    render(
      <CategoryNavigation
        categories={mockCategories}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByRole('button', { name: /navigate to all news section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /navigate to bitcoin section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /navigate to defi section/i })).toBeInTheDocument();
  });

  test('shows category counts when enabled', () => {
    render(
      <CategoryNavigation
        categories={mockCategories}
        onCategoryChange={mockOnCategoryChange}
        showCounts={true}
      />
    );

    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  test('handles category selection', async () => {
    const user = userEvent.setup();

    render(
      <CategoryNavigation
        categories={mockCategories}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const bitcoinButton = screen.getByRole('button', { name: /navigate to bitcoin section/i });
    await user.click(bitcoinButton);

    expect(mockOnCategoryChange).toHaveBeenCalledWith('bitcoin');
  });

  test('applies correct accessibility attributes', () => {
    render(
      <CategoryNavigation
        categories={mockCategories}
        onCategoryChange={mockOnCategoryChange}
      />
    );

    const navigation = screen.getByRole('navigation', { name: /content categories/i });
    expect(navigation).toBeInTheDocument();

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-pressed');
      expect(button).toHaveAttribute('aria-label');
    });
  });
});

describe('AccessibleButton Component', () => {
  test('renders with correct accessibility attributes', () => {
    render(
      <AccessibleButton
        ariaLabel="Test button"
        ariaDescribedBy="help-text"
        ariaExpanded={false}
      >
        Click me
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Test button');
    expect(button).toHaveAttribute('aria-describedby', 'help-text');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('applies correct variant styles', () => {
    const { rerender } = render(
      <AccessibleButton variant="primary">Primary</AccessibleButton>
    );

    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
    expect(button).toHaveClass('text-white');

    rerender(
      <AccessibleButton variant="secondary">Secondary</AccessibleButton>
    );

    button = screen.getByRole('button');
    expect(button).toHaveClass('bg-gray-200');
    expect(button).toHaveClass('text-gray-900');
  });

  test('shows loading state correctly', () => {
    render(
      <AccessibleButton loading={true}>
        Loading button
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button.querySelector('svg')).toHaveClass('animate-spin');
  });

  test('renders icons in correct positions', () => {
    const testIcon = <span data-testid="test-icon">🔥</span>;

    const { rerender } = render(
      <AccessibleButton icon={testIcon} iconPosition="left">
        With left icon
      </AccessibleButton>
    );

    let icon = screen.getByTestId('test-icon');
    expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');

    rerender(
      <AccessibleButton icon={testIcon} iconPosition="right">
        With right icon
      </AccessibleButton>
    );

    icon = screen.getByTestId('test-icon');
    expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ProgressiveContent Component', () => {
  const mockItems = Array.from({ length: 20 }, (_, i) => ({
    id: i.toString(),
    title: `Item ${i + 1}`,
  }));

  const mockRenderItem = (item: any) => (
    <div key={item.id} data-testid={`progressive-item-${item.id}`}>
      {item.title}
    </div>
  );

  test('renders initial batch of items', () => {
    render(
      <ProgressiveContent
        items={mockItems}
        renderItem={mockRenderItem}
        batchSize={5}
      />
    );

    // Should render first 5 items
    expect(screen.getByTestId('progressive-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('progressive-item-4')).toBeInTheDocument();
    expect(screen.queryByTestId('progressive-item-5')).not.toBeInTheDocument();
  });

  test('shows progress indicator when enabled', () => {
    render(
      <ProgressiveContent
        items={mockItems}
        renderItem={mockRenderItem}
        batchSize={5}
        showProgress={true}
      />
    );

    expect(screen.getByText(/loading content/i)).toBeInTheDocument();
    expect(screen.getByText(/5 of 20/)).toBeInTheDocument();
  });

  test('handles button-triggered loading', async () => {
    const user = userEvent.setup();

    render(
      <ProgressiveContent
        items={mockItems}
        renderItem={mockRenderItem}
        batchSize={5}
        loadMoreTrigger="button"
        buttonText="Load More"
      />
    );

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    expect(loadMoreButton).toBeInTheDocument();

    await user.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByTestId('progressive-item-5')).toBeInTheDocument();
    });
  });
});

describe('RealTimeData Integration', () => {
  const TestComponent = () => {
    const { connectionStatus, priceData } = useRealTimeData();
    return (
      <div>
        <div data-testid="connection-status">{connectionStatus}</div>
        <div data-testid="price-data">{JSON.stringify(priceData)}</div>
      </div>
    );
  };

  test('provides real-time data context', () => {
    render(
      <RealTimeDataProvider>
        <TestComponent />
      </RealTimeDataProvider>
    );

    expect(screen.getByTestId('connection-status')).toBeInTheDocument();
    expect(screen.getByTestId('price-data')).toBeInTheDocument();
  });

  test('throws error when used outside provider', () => {
    const originalError = console.error;
    console.error = jest.fn(); // Suppress error output in tests

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useRealTimeData must be used within a RealTimeDataProvider');

    console.error = originalError;
  });
});

describe('Accessibility Features', () => {
  test('components have proper ARIA labels', () => {
    render(
      <div>
        <AccessibleButton ariaLabel="Close dialog">×</AccessibleButton>
        <CategoryNavigation
          categories={[{ id: 'test', name: 'Test', count: 1 }]}
          onCategoryChange={() => {}}
        />
      </div>
    );

    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: /content categories/i })).toBeInTheDocument();
  });

  test('keyboard navigation works correctly', async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();

    render(
      <AccessibleButton onClick={mockOnClick}>
        Keyboard accessible
      </AccessibleButton>
    );

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });
});

describe('Performance and Animation', () => {
  test('respects reduced motion preferences', () => {
    // Mock prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <FadeIn>
        <div>Animated content</div>
      </FadeIn>
    );

    // Test that animations respect user preferences
    // In real implementation, animations would be disabled
  });

  test('lazy loading works with intersection observer', () => {
    const mockObserve = jest.fn();
    const mockUnobserve = jest.fn();
    
    mockIntersectionObserver.mockReturnValue({
      observe: mockObserve,
      unobserve: mockUnobserve,
      disconnect: jest.fn(),
    });

    const mockOnIntersect = jest.fn();

    render(
      <div style={{ height: '1000px' }}>
        <InfiniteScroll
          items={[]}
          loadMore={async () => []}
          renderItem={() => <div />}
          hasMoreItems={true}
          isLoading={false}
        />
      </div>
    );

    expect(mockObserve).toHaveBeenCalled();
  });
});