'use client';

import Link from 'next/link';
import { useGeo } from '@/lib/GeoContext';
import { COUNTRY_MENU, countryCodeToRoute } from '@/lib/geo';

interface CountrySwitcherProps {
  currentCountryCode: string;
}

export default function CountrySwitcher({ currentCountryCode }: CountrySwitcherProps) {
  const { activeLanguage } = useGeo();
  const currentSlug = countryCodeToRoute(currentCountryCode);

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {COUNTRY_MENU.map((country) => {
        const href = `/${country.slug}/news?lang=${encodeURIComponent(activeLanguage)}`;
        const isActive = country.slug === currentSlug;
        return (
          <Link
            key={country.code}
            href={href}
            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
              isActive
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {country.label}
          </Link>
        );
      })}
    </div>
  );
}
