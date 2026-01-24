/**
 * African Localization Constants
 * Task 25: User Profile & Settings
 * 
 * Comprehensive data for African market localization
 */

import { 
  AfricanLocale, 
  LocaleSupportLevel, 
  GlobalCurrency, 
  GlobalRegion 
} from '../types/profile';

// Backward compatibility
export const AfricanCurrency = GlobalCurrency;
export const AfricanRegion = GlobalRegion;

// ========== African Countries & Locales ==========

export const AFRICAN_LOCALES: AfricanLocale[] = [
  // West Africa
  {
    code: 'ng',
    name: 'Nigeria',
    nativeName: 'Nigeria',
    flag: '🇳🇬',
    currency: AfricanCurrency.NGN,
    region: AfricanRegion.WEST_AFRICA,
    supportLevel: LocaleSupportLevel.FULL,
    mobileMoneyProviders: ['Paystack', 'Flutterwave', 'Paga', 'OPay', 'Kuda'],
    exchanges: ['Binance Nigeria', 'Quidax', 'BuyCoins', 'Luno Nigeria', 'Bundle Africa']
  },
  {
    code: 'gh',
    name: 'Ghana',
    nativeName: 'Ghana',
    flag: '🇬🇭',
    currency: AfricanCurrency.GHS,
    region: AfricanRegion.WEST_AFRICA,
    supportLevel: LocaleSupportLevel.FULL,
    mobileMoneyProviders: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'],
    exchanges: ['Binance Ghana', 'Quidax Ghana', 'CryptoXpress', 'Bit Sika']
  },
  {
    code: 'sn',
    name: 'Senegal',
    nativeName: 'Sénégal',
    flag: '🇸🇳',
    currency: AfricanCurrency.XOF,
    region: AfricanRegion.WEST_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    mobileMoneyProviders: ['Orange Money', 'Wave', 'Free Money'],
    exchanges: ['Yellow Card', 'Patricia']
  },
  {
    code: 'ci',
    name: 'Côte d\'Ivoire',
    nativeName: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    currency: AfricanCurrency.XOF,
    region: AfricanRegion.WEST_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    mobileMoneyProviders: ['Orange Money', 'MTN Mobile Money', 'Moov Money'],
    exchanges: ['Yellow Card', 'Quidax']
  },
  {
    code: 'ml',
    name: 'Mali',
    nativeName: 'Mali',
    flag: '🇲🇱',
    currency: AfricanCurrency.XOF,
    region: AfricanRegion.WEST_AFRICA,
    supportLevel: LocaleSupportLevel.BASIC,
    mobileMoneyProviders: ['Orange Money', 'Moov Money'],
    exchanges: ['Yellow Card']
  },

  // East Africa
  {
    code: 'ke',
    name: 'Kenya',
    nativeName: 'Kenya',
    flag: '🇰🇪',
    currency: AfricanCurrency.KES,
    region: AfricanRegion.EAST_AFRICA,
    supportLevel: LocaleSupportLevel.FULL,
    mobileMoneyProviders: ['M-Pesa', 'Airtel Money', 'T-Kash', 'Equitel'],
    exchanges: ['Binance Kenya', 'Paxful', 'LocalBitcoins', 'BitPesa', 'Daraja']
  },
  {
    code: 'ug',
    name: 'Uganda',
    nativeName: 'Uganda',
    flag: '🇺🇬',
    currency: AfricanCurrency.UGX,
    region: AfricanRegion.EAST_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money', 'Centenary Bank'],
    exchanges: ['Binance Uganda', 'Paxful', 'Yellow Card', 'Coinbase']
  },
  {
    code: 'tz',
    name: 'Tanzania',
    nativeName: 'Tanzania',
    flag: '🇹🇿',
    currency: AfricanCurrency.TZS,
    region: AfricanRegion.EAST_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    mobileMoneyProviders: ['M-Pesa Tanzania', 'Airtel Money', 'Tigo Pesa', 'Halopesa'],
    exchanges: ['Binance Tanzania', 'Paxful', 'Yellow Card']
  },
  {
    code: 'rw',
    name: 'Rwanda',
    nativeName: 'Rwanda',
    flag: '🇷🇼',
    currency: AfricanCurrency.RWF,
    region: AfricanRegion.EAST_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money', 'Tigo Cash'],
    exchanges: ['Binance Rwanda', 'Paxful', 'Yellow Card']
  },
  {
    code: 'et',
    name: 'Ethiopia',
    nativeName: 'ኢትዮጵያ',
    flag: '🇪🇹',
    currency: AfricanCurrency.ETB,
    region: AfricanRegion.EAST_AFRICA,
    supportLevel: LocaleSupportLevel.BASIC,
    mobileMoneyProviders: ['M-Birr', 'Amole', 'HelloCash'],
    exchanges: ['Paxful', 'Yellow Card']
  },

  // Southern Africa
  {
    code: 'za',
    name: 'South Africa',
    nativeName: 'South Africa',
    flag: '🇿🇦',
    currency: AfricanCurrency.ZAR,
    region: AfricanRegion.SOUTHERN_AFRICA,
    supportLevel: LocaleSupportLevel.FULL,
    mobileMoneyProviders: ['PayShap', 'SnapScan', 'Zapper', 'Capitec Pay'],
    exchanges: ['Luno', 'VALR', 'AltCoinTrader', 'Ice3x', 'Coindirect']
  },
  {
    code: 'bw',
    name: 'Botswana',
    nativeName: 'Botswana',
    flag: '🇧🇼',
    currency: AfricanCurrency.ZAR, // Uses ZAR equivalent
    region: AfricanRegion.SOUTHERN_AFRICA,
    supportLevel: LocaleSupportLevel.BASIC,
    mobileMoneyProviders: ['Orange Money', 'MyZaka'],
    exchanges: ['Luno', 'Yellow Card']
  },
  {
    code: 'zm',
    name: 'Zambia',
    nativeName: 'Zambia',
    flag: '🇿🇲',
    currency: AfricanCurrency.ZAR, // Uses ZAR equivalent
    region: AfricanRegion.SOUTHERN_AFRICA,
    supportLevel: LocaleSupportLevel.BASIC,
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money'],
    exchanges: ['Binance Zambia', 'Yellow Card']
  },

  // North Africa
  {
    code: 'eg',
    name: 'Egypt',
    nativeName: 'مصر',
    flag: '🇪🇬',
    currency: AfricanCurrency.EGP,
    region: AfricanRegion.NORTH_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    mobileMoneyProviders: ['Vodafone Cash', 'Orange Money', 'Etisalat Cash', 'Fawry'],
    exchanges: ['Binance Egypt', 'BitOasis', 'Rain', 'CoinMENA']
  },
  {
    code: 'ma',
    name: 'Morocco',
    nativeName: 'المغرب',
    flag: '🇲🇦',
    currency: AfricanCurrency.MAD,
    region: AfricanRegion.NORTH_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    mobileMoneyProviders: ['Orange Money', 'Inwi Money', 'm-wallet'],
    exchanges: ['BitOasis', 'Rain', 'CoinMENA']
  },

  // Central Africa
  {
    code: 'cm',
    name: 'Cameroon',
    nativeName: 'Cameroun',
    flag: '🇨🇲',
    currency: AfricanCurrency.XAF,
    region: AfricanRegion.CENTRAL_AFRICA,
    supportLevel: LocaleSupportLevel.BASIC,
    mobileMoneyProviders: ['Orange Money', 'MTN Mobile Money'],
    exchanges: ['Yellow Card', 'Patricia']
  }
];

// ========== Language Support ==========

export const AFRICAN_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', region: 'all' },
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'west,central,north' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'north' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'east' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', region: 'east' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', region: 'west' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', region: 'west' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', region: 'west' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', region: 'southern' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', region: 'southern' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', region: 'southern' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', region: 'east' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', region: 'east' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', region: 'east' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'southern,central' }
];

// ========== Mobile Money Providers ==========

export const MOBILE_MONEY_PROVIDERS = [
  {
    id: 'mpesa',
    name: 'M-Pesa',
    countries: ['KE', 'TZ', 'RW', 'UG', 'GH', 'ET'],
    logo: '/icons/mpesa-logo.png',
    color: '#00A651',
    supportedOperations: ['pay', 'receive', 'withdraw']
  },
  {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    countries: ['GH', 'UG', 'RW', 'ZM', 'CM', 'CI'],
    logo: '/icons/mtn-logo.png',
    color: '#FFCC00',
    supportedOperations: ['pay', 'receive', 'withdraw']
  },
  {
    id: 'orange_money',
    name: 'Orange Money',
    countries: ['SN', 'CI', 'ML', 'CM', 'MA', 'EG', 'BW'],
    logo: '/icons/orange-logo.png',
    color: '#FF6600',
    supportedOperations: ['pay', 'receive']
  },
  {
    id: 'airtel_money',
    name: 'Airtel Money',
    countries: ['KE', 'UG', 'TZ', 'RW', 'ZM'],
    logo: '/icons/airtel-logo.png',
    color: '#E20613',
    supportedOperations: ['pay', 'receive', 'withdraw']
  },
  {
    id: 'vodafone_cash',
    name: 'Vodafone Cash',
    countries: ['GH', 'EG'],
    logo: '/icons/vodafone-logo.png',
    color: '#E60000',
    supportedOperations: ['pay', 'receive']
  },
  {
    id: 'tigo_pesa',
    name: 'Tigo Pesa',
    countries: ['TZ', 'RW'],
    logo: '/icons/tigo-logo.png',
    color: '#0066CC',
    supportedOperations: ['pay', 'receive']
  }
];

// ========== African Exchanges ==========

export const AFRICAN_EXCHANGES = [
  {
    id: 'binance_africa',
    name: 'Binance',
    countries: ['NG', 'KE', 'UG', 'TZ', 'RW', 'GH', 'ZA', 'ZM', 'EG'],
    logo: '/icons/binance-logo.png',
    type: 'global',
    features: ['spot', 'futures', 'p2p', 'mobile_money']
  },
  {
    id: 'luno',
    name: 'Luno',
    countries: ['ZA', 'NG', 'UG', 'ZM'],
    logo: '/icons/luno-logo.png',
    type: 'regional',
    features: ['spot', 'mobile_money', 'bank_transfer']
  },
  {
    id: 'quidax',
    name: 'Quidax',
    countries: ['NG', 'GH'],
    logo: '/icons/quidax-logo.png',
    type: 'local',
    features: ['spot', 'bank_transfer', 'mobile_money']
  },
  {
    id: 'buycoins',
    name: 'BuyCoins',
    countries: ['NG'],
    logo: '/icons/buycoins-logo.png',
    type: 'local',
    features: ['spot', 'bank_transfer']
  },
  {
    id: 'valr',
    name: 'VALR',
    countries: ['ZA'],
    logo: '/icons/valr-logo.png',
    type: 'local',
    features: ['spot', 'futures', 'bank_transfer']
  },
  {
    id: 'yellow_card',
    name: 'Yellow Card',
    countries: ['NG', 'GH', 'KE', 'UG', 'TZ', 'RW', 'SN', 'CI', 'ML', 'CM', 'BW', 'ZM'],
    logo: '/icons/yellowcard-logo.png',
    type: 'pan_african',
    features: ['spot', 'mobile_money', 'bank_transfer']
  },
  {
    id: 'paxful',
    name: 'Paxful',
    countries: ['NG', 'KE', 'UG', 'TZ', 'RW', 'GH', 'ZA', 'ET'],
    logo: '/icons/paxful-logo.png',
    type: 'global',
    features: ['p2p', 'mobile_money', 'gift_cards']
  }
];

// ========== Timezone Data ==========

export const AFRICAN_TIMEZONES = [
  { id: 'Africa/Lagos', name: 'West Africa Time (WAT)', offset: '+01:00', countries: ['NG', 'GH', 'CI', 'SN', 'ML', 'CM'] },
  { id: 'Africa/Nairobi', name: 'East Africa Time (EAT)', offset: '+03:00', countries: ['KE', 'UG', 'TZ', 'RW', 'ET'] },
  { id: 'Africa/Johannesburg', name: 'South Africa Time (SAST)', offset: '+02:00', countries: ['ZA', 'BW', 'ZM'] },
  { id: 'Africa/Cairo', name: 'Egypt Time (EET)', offset: '+02:00', countries: ['EG'] },
  { id: 'Africa/Casablanca', name: 'Morocco Time (WET)', offset: '+00:00', countries: ['MA'] }
];

// ========== Utility Functions ==========

export const getLocaleByCountryCode = (
  countryCode: string
): {
  currency: GlobalCurrency,
  region: GlobalRegion,
  name: string,
  flag: string
} | null => {
  return AFRICAN_LOCALES.find(locale => locale.code.toLowerCase() === countryCode.toLowerCase()) || null;
};

export const getLanguagesByRegion = (region: GlobalRegion): typeof AFRICAN_LANGUAGES => {
  return AFRICAN_LANGUAGES.filter(lang => 
    lang.region === 'all' || lang.region.includes(region.toLowerCase().replace('_africa', ''))
  );
};

export const getMobileMoneyProviders = (countryCode: string) => {
  return MOBILE_MONEY_PROVIDERS.filter(provider =>
    provider.countries.includes(countryCode.toUpperCase())
  );
};

export const getExchangesByCountry = (countryCode: string) => {
  return AFRICAN_EXCHANGES.filter(exchange =>
    exchange.countries.includes(countryCode.toUpperCase())
  );
};

export const getTimezoneByCountry = (countryCode: string) => {
  return AFRICAN_TIMEZONES.find(tz =>
    tz.countries.includes(countryCode.toUpperCase())
  ) || AFRICAN_TIMEZONES[0]; // Default to WAT
};

export const formatCurrency = (
  amount: number, 
  currency: GlobalCurrency, 
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${currency} ${amount.toLocaleString()}`;
  }
};

export const detectUserRegion = (countryCode: string): GlobalRegion => {
  const locale = getLocaleByCountryCode(countryCode);
  return locale?.region || AfricanRegion.WEST_AFRICA;
};