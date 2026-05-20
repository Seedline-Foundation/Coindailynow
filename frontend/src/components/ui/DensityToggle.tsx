'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Density = 'comfortable' | 'compact';

interface DensityContextValue {
  density: Density;
  setDensity: (d: Density) => void;
  toggle: () => void;
}

const DensityContext = createContext<DensityContextValue>({
  density: 'comfortable',
  setDensity: () => {},
  toggle: () => {},
});

export function useDensity() {
  return useContext(DensityContext);
}

const LS_KEY = 'coindaily:density';

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<Density>('comfortable');

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY) as Density | null;
    if (stored === 'compact' || stored === 'comfortable') {
      setDensityState(stored);
    }
  }, []);

  const setDensity = (d: Density) => {
    setDensityState(d);
    localStorage.setItem(LS_KEY, d);
  };

  const toggle = () => setDensity(density === 'comfortable' ? 'compact' : 'comfortable');

  return (
    <DensityContext.Provider value={{ density, setDensity, toggle }}>
      {children}
    </DensityContext.Provider>
  );
}

/**
 * Small toggle button for data-heavy pages.
 * Renders as a pill switch between comfortable/compact.
 */
export default function DensityToggle({ className = '' }: { className?: string }) {
  const { density, setDensity } = useDensity();

  return (
    <div className={`inline-flex items-center gap-1 bg-gray-800 rounded-full p-0.5 ${className}`}>
      <button
        onClick={() => setDensity('comfortable')}
        className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
          density === 'comfortable'
            ? 'bg-gray-600 text-white'
            : 'text-gray-500 hover:text-gray-300'
        }`}
        title="Comfortable spacing"
      >
        Comfortable
      </button>
      <button
        onClick={() => setDensity('compact')}
        className={`text-[10px] font-medium px-2.5 py-1 rounded-full transition-colors ${
          density === 'compact'
            ? 'bg-gray-600 text-white'
            : 'text-gray-500 hover:text-gray-300'
        }`}
        title="Compact spacing — more data per screen"
      >
        Compact
      </button>
    </div>
  );
}

/**
 * Utility: returns spacing classes based on density.
 */
export function useDensityClasses() {
  const { density } = useDensity();
  const isCompact = density === 'compact';

  return {
    isCompact,
    // Card padding
    cardPadding: isCompact ? 'p-3' : 'p-5',
    // Section gap
    sectionGap: isCompact ? 'gap-3' : 'gap-6',
    // Grid gap
    gridGap: isCompact ? 'gap-2' : 'gap-4',
    // Text sizes
    headingSize: isCompact ? 'text-sm' : 'text-base',
    bodySize: isCompact ? 'text-xs' : 'text-sm',
    // Section margins
    sectionMargin: isCompact ? 'mb-4' : 'mb-8',
    // List item padding
    listPadding: isCompact ? 'py-1' : 'py-2',
  };
}
