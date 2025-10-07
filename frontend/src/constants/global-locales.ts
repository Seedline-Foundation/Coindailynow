/**
 * Global Localization Constants
 * Task 25: User Profile & Settings - Global Enhancement
 * 
 * Comprehensive global localization with African market prioritization
 */

import { 
  GlobalLocale, 
  LocaleSupportLevel, 
  GlobalCurrency, 
  GlobalRegion,
  PaymentProvider 
} from '../types/profile';

// ========== Global Locales ==========

export const GLOBAL_LOCALES: GlobalLocale[] = [
  // ========== AFRICAN COUNTRIES (Priority) ==========
  
  // West Africa
  {
    code: 'ng',
    name: 'Nigeria',
    nativeName: 'Nigeria',
    flag: '🇳🇬',
    currency: GlobalCurrency.NGN,
    region: GlobalRegion.WEST_AFRICA,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['en', 'ha', 'yo', 'ig'],
    timezones: ['Africa/Lagos'],
    paymentProviders: ['Paystack', 'Flutterwave', 'Paga', 'OPay', 'Kuda', 'PiggyVest'],
    exchanges: ['Binance Nigeria', 'Quidax', 'BuyCoins', 'Luno Nigeria', 'Bundle Africa', 'Patricia'],
    mobileMoneyProviders: ['Paga', 'OPay', 'Kuda', 'PalmPay'],
    priority: 1
  },
  {
    code: 'ke',
    name: 'Kenya',
    nativeName: 'Kenya',
    flag: '🇰🇪',
    currency: GlobalCurrency.KES,
    region: GlobalRegion.EAST_AFRICA,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['en', 'sw'],
    timezones: ['Africa/Nairobi'],
    paymentProviders: ['M-Pesa', 'Equity Bank', 'KCB Bank', 'Airtel Money'],
    exchanges: ['Binance Kenya', 'Paxful Kenya', 'LocalBitcoins Kenya', 'BitPesa'],
    mobileMoneyProviders: ['M-Pesa', 'Airtel Money', 'T-Kash'],
    priority: 2
  },
  {
    code: 'za',
    name: 'South Africa',
    nativeName: 'South Africa',
    flag: '🇿🇦',
    currency: GlobalCurrency.ZAR,
    region: GlobalRegion.SOUTHERN_AFRICA,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['en', 'af', 'zu', 'xh'],
    timezones: ['Africa/Johannesburg'],
    paymentProviders: ['Standard Bank', 'FNB', 'Nedbank', 'ABSA', 'Capitec'],
    exchanges: ['Luno', 'VALR', 'AltCoinTrader', 'Ice3X', 'Binance South Africa'],
    mobileMoneyProviders: ['FNB eWallet', 'Standard Bank Instant Money'],
    priority: 3
  },
  {
    code: 'gh',
    name: 'Ghana',
    nativeName: 'Ghana',
    flag: '🇬🇭',
    currency: GlobalCurrency.GHS,
    region: GlobalRegion.WEST_AFRICA,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['en', 'ak', 'tw'],
    timezones: ['Africa/Accra'],
    paymentProviders: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'],
    exchanges: ['Binance Ghana', 'Quidax Ghana', 'CryptoXpress', 'Bit Sika'],
    mobileMoneyProviders: ['MTN Mobile Money', 'Vodafone Cash', 'AirtelTigo Money'],
    priority: 4
  },
  
  // East Africa
  {
    code: 'ug',
    name: 'Uganda',
    nativeName: 'Uganda',
    flag: '🇺🇬',
    currency: GlobalCurrency.UGX,
    region: GlobalRegion.EAST_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    languages: ['en', 'lg'],
    timezones: ['Africa/Kampala'],
    paymentProviders: ['MTN Mobile Money', 'Airtel Money Uganda'],
    exchanges: ['Yellow Card', 'Paxful Uganda'],
    mobileMoneyProviders: ['MTN Mobile Money', 'Airtel Money'],
    priority: 5
  },
  {
    code: 'tz',
    name: 'Tanzania',
    nativeName: 'Tanzania',
    flag: '🇹🇿',
    currency: GlobalCurrency.TZS,
    region: GlobalRegion.EAST_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    languages: ['en', 'sw'],
    timezones: ['Africa/Dar_es_Salaam'],
    paymentProviders: ['M-Pesa Tanzania', 'Airtel Money', 'Tigo Pesa'],
    exchanges: ['Binance Tanzania', 'Yellow Card Tanzania'],
    mobileMoneyProviders: ['M-Pesa', 'Airtel Money', 'Tigo Pesa'],
    priority: 6
  },
  
  // North Africa
  {
    code: 'eg',
    name: 'Egypt',
    nativeName: 'مصر',
    flag: '🇪🇬',
    currency: GlobalCurrency.EGP,
    region: GlobalRegion.NORTH_AFRICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    languages: ['ar', 'en'],
    timezones: ['Africa/Cairo'],
    paymentProviders: ['Vodafone Cash', 'Orange Money', 'Etisalat Cash'],
    exchanges: ['Rain Egypt', 'BitOasis Egypt'],
    mobileMoneyProviders: ['Vodafone Cash', 'Orange Money', 'Etisalat Cash'],
    priority: 7
  },
  {
    code: 'ma',
    name: 'Morocco',
    nativeName: 'المغرب',
    flag: '🇲🇦',
    currency: GlobalCurrency.MAD,
    region: GlobalRegion.NORTH_AFRICA,
    supportLevel: LocaleSupportLevel.BASIC,
    languages: ['ar', 'fr', 'en'],
    timezones: ['Africa/Casablanca'],
    paymentProviders: ['Orange Money Morocco', 'inwi Money'],
    exchanges: ['BitOasis Morocco', 'Paxful Morocco'],
    mobileMoneyProviders: ['Orange Money', 'inwi Money'],
    priority: 8
  },
  
  // ========== MAJOR GLOBAL MARKETS ==========
  
  // North America
  {
    code: 'us',
    name: 'United States',
    nativeName: 'United States',
    flag: '🇺🇸',
    currency: GlobalCurrency.USD,
    region: GlobalRegion.NORTH_AMERICA,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['en', 'es'],
    timezones: ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'],
    paymentProviders: ['Stripe', 'PayPal', 'Apple Pay', 'Google Pay', 'Zelle', 'Venmo'],
    exchanges: ['Coinbase', 'Kraken', 'Gemini', 'Binance.US', 'FTX.US', 'KuCoin'],
    mobileMoneyProviders: ['PayPal', 'Venmo', 'Cash App', 'Apple Pay', 'Google Pay'],
    priority: 10
  },
  {
    code: 'ca',
    name: 'Canada',
    nativeName: 'Canada',
    flag: '🇨🇦',
    currency: GlobalCurrency.CAD,
    region: GlobalRegion.NORTH_AMERICA,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['en', 'fr'],
    timezones: ['America/Toronto', 'America/Vancouver', 'America/Edmonton'],
    paymentProviders: ['Interac', 'PayPal', 'Stripe'],
    exchanges: ['Coinsquare', 'Bitbuy', 'Newton', 'Kraken'],
    mobileMoneyProviders: ['Interac e-Transfer', 'PayPal', 'Apple Pay'],
    priority: 11
  },
  
  // Europe
  {
    code: 'gb',
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    flag: '🇬🇧',
    currency: GlobalCurrency.GBP,
    region: GlobalRegion.EUROPE,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['en'],
    timezones: ['Europe/London'],
    paymentProviders: ['Stripe', 'PayPal', 'Klarna', 'Revolut'],
    exchanges: ['Coinbase Pro', 'Kraken', 'Binance UK', 'Luno UK'],
    mobileMoneyProviders: ['PayPal', 'Revolut', 'Monzo', 'Starling Bank'],
    priority: 12
  },
  {
    code: 'de',
    name: 'Germany',
    nativeName: 'Deutschland',
    flag: '🇩🇪',
    currency: GlobalCurrency.EUR,
    region: GlobalRegion.EUROPE,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['de', 'en'],
    timezones: ['Europe/Berlin'],
    paymentProviders: ['SEPA', 'PayPal', 'Klarna', 'Stripe'],
    exchanges: ['Binance', 'Kraken', 'Coinbase', 'Bitcoin.de'],
    mobileMoneyProviders: ['PayPal', 'N26', 'Revolut'],
    priority: 13
  },
  
  // Asia-Pacific
  {
    code: 'jp',
    name: 'Japan',
    nativeName: '日本',
    flag: '🇯🇵',
    currency: GlobalCurrency.JPY,
    region: GlobalRegion.ASIA_PACIFIC,
    supportLevel: LocaleSupportLevel.PARTIAL,
    languages: ['ja', 'en'],
    timezones: ['Asia/Tokyo'],
    paymentProviders: ['PayPay', 'Line Pay', 'Stripe'],
    exchanges: ['bitFlyer', 'Coincheck', 'Liquid', 'GMO Coin'],
    mobileMoneyProviders: ['PayPay', 'Line Pay', 'Rakuten Pay'],
    priority: 14
  },
  {
    code: 'sg',
    name: 'Singapore',
    nativeName: 'Singapore',
    flag: '🇸🇬',
    currency: GlobalCurrency.SGD,
    region: GlobalRegion.ASIA_PACIFIC,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['en', 'zh', 'ms', 'ta'],
    timezones: ['Asia/Singapore'],
    paymentProviders: ['GrabPay', 'NETS', 'PayLah!'],
    exchanges: ['Binance Singapore', 'Gemini Singapore', 'Independent Reserve'],
    mobileMoneyProviders: ['GrabPay', 'PayLah!', 'FavePay'],
    priority: 15
  },
  {
    code: 'au',
    name: 'Australia',
    nativeName: 'Australia',
    flag: '🇦🇺',
    currency: GlobalCurrency.AUD,
    region: GlobalRegion.OCEANIA,
    supportLevel: LocaleSupportLevel.FULL,
    languages: ['en'],
    timezones: ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth'],
    paymentProviders: ['PayID', 'BPAY', 'PayPal'],
    exchanges: ['CoinSpot', 'Independent Reserve', 'Swyftx', 'Binance Australia'],
    mobileMoneyProviders: ['PayID', 'PayPal', 'CommBank'],
    priority: 16
  },
  
  // Middle East
  {
    code: 'ae',
    name: 'United Arab Emirates',
    nativeName: 'الإمارات العربية المتحدة',
    flag: '🇦🇪',
    currency: GlobalCurrency.AED,
    region: GlobalRegion.MIDDLE_EAST,
    supportLevel: LocaleSupportLevel.PARTIAL,
    languages: ['ar', 'en'],
    timezones: ['Asia/Dubai'],
    paymentProviders: ['Emirates NBD', 'ADCB', 'CBD Now'],
    exchanges: ['BitOasis', 'Rain', 'CoinMENA'],
    mobileMoneyProviders: ['CBD Now', 'Liv.', 'ENBD X'],
    priority: 17
  },
  
  // South America
  {
    code: 'br',
    name: 'Brazil',
    nativeName: 'Brasil',
    flag: '🇧🇷',
    currency: GlobalCurrency.BRL,
    region: GlobalRegion.SOUTH_AMERICA,
    supportLevel: LocaleSupportLevel.PARTIAL,
    languages: ['pt', 'en'],
    timezones: ['America/Sao_Paulo'],
    paymentProviders: ['PIX', 'PagSeguro', 'Mercado Pago'],
    exchanges: ['Mercado Bitcoin', 'Binance Brazil', 'BitcoinTrade'],
    mobileMoneyProviders: ['PIX', 'PagSeguro', 'Mercado Pago'],
    priority: 18
  },
  
  // Additional regions can be added as needed...
];

// ========== Helper Functions ==========

export const getLocaleByCode = (code: string): GlobalLocale | null => {
  return GLOBAL_LOCALES.find(locale => locale.code === code) || null;
};

export const getLocalesByRegion = (region: GlobalRegion): GlobalLocale[] => {
  return GLOBAL_LOCALES.filter(locale => locale.region === region)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

export const getAfricanLocales = (): GlobalLocale[] => {
  const africanRegions = [
    GlobalRegion.WEST_AFRICA,
    GlobalRegion.EAST_AFRICA,
    GlobalRegion.NORTH_AFRICA,
    GlobalRegion.SOUTHERN_AFRICA,
    GlobalRegion.CENTRAL_AFRICA
  ];
  
  return GLOBAL_LOCALES.filter(locale => africanRegions.includes(locale.region))
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

export const getGlobalLocales = (): GlobalLocale[] => {
  return GLOBAL_LOCALES.sort((a, b) => (a.priority || 999) - (b.priority || 999));
};

export const detectUserRegion = (countryCode?: string): GlobalRegion => {
  const locale = countryCode ? getLocaleByCode(countryCode.toLowerCase()) : null;
  return locale?.region || GlobalRegion.WEST_AFRICA; // Default to African market
};

export const getCurrencySymbol = (currency: GlobalCurrency): string => {
  const symbols: Record<GlobalCurrency, string> = {
    // African currencies
    [GlobalCurrency.NGN]: '₦',
    [GlobalCurrency.KES]: 'KSh',
    [GlobalCurrency.ZAR]: 'R',
    [GlobalCurrency.GHS]: '₵',
    [GlobalCurrency.UGX]: 'USh',
    [GlobalCurrency.TZS]: 'TSh',
    [GlobalCurrency.RWF]: 'RWF',
    [GlobalCurrency.ETB]: 'Br',
    [GlobalCurrency.EGP]: '£',
    [GlobalCurrency.MAD]: 'د.م.',
    [GlobalCurrency.XAF]: 'FCFA',
    [GlobalCurrency.XOF]: 'CFA',
    
    // Global currencies
    [GlobalCurrency.USD]: '$',
    [GlobalCurrency.EUR]: '€',
    [GlobalCurrency.GBP]: '£',
    [GlobalCurrency.JPY]: '¥',
    [GlobalCurrency.CNY]: '¥',
    [GlobalCurrency.CAD]: 'C$',
    [GlobalCurrency.AUD]: 'A$',
    [GlobalCurrency.CHF]: 'CHF',
    [GlobalCurrency.INR]: '₹',
    [GlobalCurrency.BRL]: 'R$',
    [GlobalCurrency.MXN]: '$',
    [GlobalCurrency.SGD]: 'S$',
    [GlobalCurrency.HKD]: 'HK$',
    [GlobalCurrency.SEK]: 'kr',
    [GlobalCurrency.NOK]: 'kr',
    [GlobalCurrency.DKK]: 'kr',
    [GlobalCurrency.PLN]: 'zł',
    [GlobalCurrency.CZK]: 'Kč',
    [GlobalCurrency.HUF]: 'Ft',
    [GlobalCurrency.RON]: 'lei',
    [GlobalCurrency.BGN]: 'лв',
    [GlobalCurrency.HRK]: 'kn',
    [GlobalCurrency.AED]: 'د.إ',
    [GlobalCurrency.KRW]: '₩',
    [GlobalCurrency.TWD]: 'NT$',
    [GlobalCurrency.THB]: '฿',
    [GlobalCurrency.MYR]: 'RM',
    [GlobalCurrency.IDR]: 'Rp',
    [GlobalCurrency.PHP]: '₱',
    [GlobalCurrency.VND]: '₫',
  };
  
  return symbols[currency] || currency;
};

export const formatCurrency = (
  amount: number, 
  currency: GlobalCurrency, 
  locale?: string
): string => {
  const symbol = getCurrencySymbol(currency);
  
  // Use browser's Intl.NumberFormat for proper localization
  try {
    return new Intl.NumberFormat(locale || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback formatting
    return `${symbol}${amount.toLocaleString(locale || 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
};

// ========== Timezone Helpers ==========

export const GLOBAL_TIMEZONES = [
  // African Timezones (Priority)
  { value: 'Africa/Lagos', label: 'Lagos (WAT)', region: 'Africa', offset: '+01:00' },
  { value: 'Africa/Nairobi', label: 'Nairobi (EAT)', region: 'Africa', offset: '+03:00' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)', region: 'Africa', offset: '+02:00' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)', region: 'Africa', offset: '+02:00' },
  { value: 'Africa/Casablanca', label: 'Casablanca (WET)', region: 'Africa', offset: '+00:00' },
  { value: 'Africa/Accra', label: 'Accra (GMT)', region: 'Africa', offset: '+00:00' },
  
  // Global Timezones
  { value: 'America/New_York', label: 'New York (EST)', region: 'Americas', offset: '-05:00' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', region: 'Americas', offset: '-08:00' },
  { value: 'Europe/London', label: 'London (GMT)', region: 'Europe', offset: '+00:00' },
  { value: 'Europe/Paris', label: 'Paris (CET)', region: 'Europe', offset: '+01:00' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', region: 'Asia', offset: '+09:00' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', region: 'Asia', offset: '+08:00' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT)', region: 'Oceania', offset: '+11:00' },
];

export const getTimezonesByRegion = (region: string): typeof GLOBAL_TIMEZONES => {
  return GLOBAL_TIMEZONES.filter(tz => tz.region === region);
};