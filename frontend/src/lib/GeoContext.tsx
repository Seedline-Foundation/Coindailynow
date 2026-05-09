'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AlternativeLanguage {
  code: string;
  name: string;
  nativeName: string;
}

interface GeoContextType {
  countryCode: string;
  activeLanguage: string;
  alternativeLanguages: AlternativeLanguage[];
  setLanguage: (langCode: string) => void;
  isLoading: boolean;
}

const GeoContext = createContext<GeoContextType>({
  countryCode: 'NG',
  activeLanguage: 'en',
  alternativeLanguages: [],
  setLanguage: () => {},
  isLoading: true,
});

export function useGeo() {
  return useContext(GeoContext);
}

export function GeoProvider({ children }: { children: ReactNode }) {
  const [countryCode, setCountryCode] = useState('NG');
  const [activeLanguage, setActiveLanguage] = useState('en');
  const [alternativeLanguages, setAlternativeLanguages] = useState<AlternativeLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('coindaily_lang');
    if (stored) {
      setActiveLanguage(stored);
    }

    const browserLang = (navigator.language || '').split('-')[0] || 'en';

    fetch(`/api/geo?browserLang=${encodeURIComponent(browserLang)}`)
      .then((res) => res.json())
      .then((data) => {
        setCountryCode(data.countryCode || 'NG');
        setAlternativeLanguages(data.alternativeLanguages || []);
        if (!stored) {
          setActiveLanguage(data.activeLanguage || 'en');
        }
      })
      .catch(() => {
        setActiveLanguage(stored || 'en');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setLanguage = (langCode: string) => {
    setActiveLanguage(langCode);
    localStorage.setItem('coindaily_lang', langCode);
    document.cookie = `lang=${langCode};path=/;max-age=${60 * 60 * 24 * 365}`;
  };

  return (
    <GeoContext.Provider value={{ countryCode, activeLanguage, alternativeLanguages, setLanguage, isLoading }}>
      {children}
    </GeoContext.Provider>
  );
}
