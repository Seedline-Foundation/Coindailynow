/**
 * Localization Settings Component
 * Task 25: User Profile & Settings - Global Enhancement
 * 
 * Enhanced localization settings with global support while maintaining African priority
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  LocalizationSettings as LocalizationSettingsType,
  LocalizationSettingsFormData,
  GlobalCurrency,
  GlobalRegion,
  DateFormat,
  NumberFormat,
  SettingsFormProps
} from '../../types/profile';
import { GLOBAL_LOCALES, getAfricanLocales, getLocalesByRegion } from '../../constants/global-locales';

interface LocalizationSettingsProps extends SettingsFormProps<LocalizationSettingsFormData> {
  prioritizeAfrica?: boolean;
}

export default function LocalizationSettings({
  settings,
  onSubmit,
  isLoading = false,
  error = null,
  prioritizeAfrica = true
}: LocalizationSettingsProps) {
  const [formData, setFormData] = useState<LocalizationSettingsFormData>({
    language: settings.language,
    country: settings.country,
    timezone: settings.timezone,
    currency: settings.currency,
    dateFormat: settings.dateFormat,
    numberFormat: settings.numberFormat
  });

  const [filteredLocales, setFilteredLocales] = useState(GLOBAL_LOCALES);
  const [selectedRegion, setSelectedRegion] = useState<GlobalRegion | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sort locales with African countries first if prioritizeAfrica is true
  const sortedLocales = React.useMemo(() => {
    if (!prioritizeAfrica) return filteredLocales;
    
    return [...filteredLocales].sort((a, b) => {
      const aIsAfrican = Object.values(GlobalRegion).includes(a.region) && 
                        a.region.includes('AFRICA');
      const bIsAfrican = Object.values(GlobalRegion).includes(b.region) && 
                        b.region.includes('AFRICA');
      
      if (aIsAfrican && !bIsAfrican) return -1;
      if (!aIsAfrican && bIsAfrican) return 1;
      if (a.priority !== undefined && b.priority !== undefined) {
        return a.priority - b.priority;
      }
      return a.name.localeCompare(b.name);
    });
  }, [filteredLocales, prioritizeAfrica]);

  // Available languages based on selected country
  const availableLanguages = React.useMemo(() => {
    const selectedLocale = GLOBAL_LOCALES.find(locale => locale.code === formData.country);
    return selectedLocale?.languages || ['en'];
  }, [formData.country]);

  // Available timezones based on selected country
  const availableTimezones = React.useMemo(() => {
    const selectedLocale = GLOBAL_LOCALES.find(locale => locale.code === formData.country);
    return selectedLocale?.timezones || [Intl.DateTimeFormat().resolvedOptions().timeZone];
  }, [formData.country]);

  // Filter locales based on region and search
  useEffect(() => {
    let filtered = GLOBAL_LOCALES;

    if (selectedRegion !== 'ALL') {
      filtered = filtered.filter(locale => locale.region === selectedRegion);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(locale => 
        locale.name.toLowerCase().includes(search) ||
        locale.nativeName.toLowerCase().includes(search) ||
        locale.code.toLowerCase().includes(search)
      );
    }

    setFilteredLocales(filtered);
  }, [selectedRegion, searchTerm]);

  const handleCountryChange = (country: string) => {
    const selectedLocale = GLOBAL_LOCALES.find(locale => locale.code === country);
    if (selectedLocale) {
      setFormData(prev => ({
        ...prev,
        country,
        currency: selectedLocale.currency,
        language: selectedLocale.languages?.[0] || 'en',
        timezone: selectedLocale.timezones?.[0] || prev.timezone
      }));
    }
  };

  const handleInputChange = (field: keyof LocalizationSettingsFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const formatPreview = React.useMemo(() => {
    const now = new Date();
    const amount = 1234.56;
    
    try {
      const locale = GLOBAL_LOCALES.find(l => l.code === formData.country);
      const localeCode = locale ? `${formData.language}-${formData.country.toUpperCase()}` : 'en-US';
      
      // Format date
      let dateStr = '';
      switch (formData.dateFormat) {
        case DateFormat.DD_MM_YYYY:
          dateStr = now.toLocaleDateString('en-GB');
          break;
        case DateFormat.MM_DD_YYYY:
          dateStr = now.toLocaleDateString('en-US');
          break;
        case DateFormat.YYYY_MM_DD:
          dateStr = now.toISOString().split('T')[0] || '';
          break;
        case DateFormat.DD_MMM_YYYY:
          dateStr = now.toLocaleDateString(localeCode, { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });
          break;
        default:
          dateStr = now.toLocaleDateString();
      }

      // Format number
      let numberStr = '';
      switch (formData.numberFormat) {
        case NumberFormat.COMMA_DECIMAL:
          numberStr = amount.toLocaleString('en-US');
          break;
        case NumberFormat.SPACE_DECIMAL:
          numberStr = amount.toLocaleString('fr-FR');
          break;
        case NumberFormat.DOT_COMMA:
          numberStr = amount.toLocaleString('de-DE');
          break;
        case NumberFormat.SPACE_COMMA:
          numberStr = amount.toLocaleString('fr-FR').replace(',', ' ').replace('.', ',');
          break;
        default:
          numberStr = amount.toLocaleString();
      }

      // Format currency
      const currencyStr = new Intl.NumberFormat(localeCode, {
        style: 'currency',
        currency: formData.currency
      }).format(amount);

      return { date: dateStr, number: numberStr, currency: currencyStr };
    } catch (error) {
      return { 
        date: now.toLocaleDateString(), 
        number: amount.toLocaleString(), 
        currency: `${formData.currency} ${amount}` 
      };
    }
  }, [formData]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Localization Settings
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value as GlobalRegion | 'ALL')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="ALL">All Regions</option>
                {prioritizeAfrica && (
                  <optgroup label="African Regions (Priority)">
                    <option value={GlobalRegion.WEST_AFRICA}>West Africa</option>
                    <option value={GlobalRegion.EAST_AFRICA}>East Africa</option>
                    <option value={GlobalRegion.NORTH_AFRICA}>North Africa</option>
                    <option value={GlobalRegion.SOUTHERN_AFRICA}>Southern Africa</option>
                    <option value={GlobalRegion.CENTRAL_AFRICA}>Central Africa</option>
                  </optgroup>
                )}
                <optgroup label="Global Regions">
                  <option value={GlobalRegion.NORTH_AMERICA}>North America</option>
                  <option value={GlobalRegion.SOUTH_AMERICA}>South America</option>
                  <option value={GlobalRegion.EUROPE}>Europe</option>
                  <option value={GlobalRegion.ASIA_PACIFIC}>Asia Pacific</option>
                  <option value={GlobalRegion.MIDDLE_EAST}>Middle East</option>
                  <option value={GlobalRegion.OCEANIA}>Oceania</option>
                </optgroup>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Countries
              </label>
              <input
                type="text"
                placeholder="Search by country name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Country/Region *
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">Select Country</option>
                {prioritizeAfrica && getAfricanLocales().length > 0 && (
                  <optgroup label="🌍 African Countries (Priority)">
                    {getAfricanLocales().map((locale) => (
                      <option key={locale.code} value={locale.code}>
                        {locale.flag} {locale.name} ({locale.currency})
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="🌐 All Countries">
                  {sortedLocales.map((locale) => (
                    <option key={locale.code} value={locale.code}>
                      {locale.flag} {locale.name} ({locale.currency})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Language Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language *
              </label>
              <select
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {new Intl.DisplayNames([lang], { type: 'language' }).of(lang) || lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Timezone Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timezone *
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {availableTimezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz} ({new Intl.DateTimeFormat('en', { 
                      timeZone: tz, 
                      timeZoneName: 'short' 
                    }).formatToParts(new Date()).find(part => part.type === 'timeZoneName')?.value})
                  </option>
                ))}
              </select>
            </div>

            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value as GlobalCurrency)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {prioritizeAfrica && (
                  <optgroup label="🌍 African Currencies (Priority)">
                    {Object.values(GlobalCurrency)
                      .filter(currency => ['NGN', 'KES', 'ZAR', 'GHS', 'UGX', 'TZS', 'RWF', 'ETB', 'EGP', 'MAD', 'XAF', 'XOF'].includes(currency))
                      .map((currency) => (
                        <option key={currency} value={currency}>
                          {currency} - {new Intl.DisplayNames(['en'], { type: 'currency' }).of(currency) || currency}
                        </option>
                      ))}
                  </optgroup>
                )}
                <optgroup label="🌐 Global Currencies">
                  {Object.values(GlobalCurrency).map((currency) => (
                    <option key={currency} value={currency}>
                      {currency} - {new Intl.DisplayNames(['en'], { type: 'currency' }).of(currency) || currency}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Format *
              </label>
              <select
                value={formData.dateFormat}
                onChange={(e) => handleInputChange('dateFormat', e.target.value as DateFormat)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {Object.values(DateFormat).map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>

            {/* Number Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Number Format *
              </label>
              <select
                value={formData.numberFormat}
                onChange={(e) => handleInputChange('numberFormat', e.target.value as NumberFormat)}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              >
                {Object.values(NumberFormat).map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Preview */}
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Format Preview
              </h3>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-medium">Date:</span> {formatPreview.date}</p>
                <p><span className="font-medium">Number:</span> {formatPreview.number}</p>
                <p><span className="font-medium">Currency:</span> {formatPreview.currency}</p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setFormData({
                  language: settings.language,
                  country: settings.country,
                  timezone: settings.timezone,
                  currency: settings.currency,
                  dateFormat: settings.dateFormat,
                  numberFormat: settings.numberFormat
                })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
