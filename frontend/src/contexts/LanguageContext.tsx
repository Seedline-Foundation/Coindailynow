'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const LANG_DEFAULT_KEY = 'coindaily-lang-default';
const LANG_SESSION_KEY = 'coindaily-lang-session';
const LANG_COUNTS_KEY = 'coindaily-lang-counts';
const LEGACY_LANG_KEY = 'coindaily-lang';

function isSupportedLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(l => l.code === code);
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function readSelectionCounts(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  return safeJsonParse<Record<string, number>>(localStorage.getItem(LANG_COUNTS_KEY)) || {};
}

function writeSelectionCounts(counts: Record<string, number>) {
  localStorage.setItem(LANG_COUNTS_KEY, JSON.stringify(counts));
}

function bumpLanguageSelectionCount(languageCode: string): number {
  const counts = readSelectionCounts();
  counts[languageCode] = (counts[languageCode] || 0) + 1;
  writeSelectionCounts(counts);
  return counts[languageCode];
}

function setLangCookie(languageCode: string) {
  // Cookie is best-effort (helps server-side rendering/localization later).
  try {
    const oneYearSeconds = 60 * 60 * 24 * 365;
    document.cookie = `coindaily-lang=${encodeURIComponent(languageCode)}; path=/; max-age=${oneYearSeconds}; samesite=lax`;
  } catch {
    // ignore
  }
}

// Supported languages with metadata
export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr', region: 'Global' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', dir: 'ltr', region: 'West/Central Africa' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪', dir: 'ltr', region: 'East Africa' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬', dir: 'ltr', region: 'West Africa' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹', dir: 'ltr', region: 'East Africa' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦', dir: 'ltr', region: 'Southern Africa' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', dir: 'ltr', region: 'West Africa' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇪🇬', dir: 'rtl', region: 'North Africa' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇦🇴', dir: 'ltr', region: 'Southern Africa' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', dir: 'ltr', region: 'Global' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬', dir: 'ltr', region: 'West Africa' },
  { code: 'pcm', name: 'Pidgin', nativeName: 'Naijá', flag: '🇳🇬', dir: 'ltr', region: 'West Africa' },
];

// Browser language to our supported code mapping
const BROWSER_LANG_MAP: Record<string, string> = {
  'en': 'en', 'en-US': 'en', 'en-GB': 'en', 'en-ZA': 'en', 'en-NG': 'en', 'en-KE': 'en', 'en-GH': 'en',
  'fr': 'fr', 'fr-FR': 'fr', 'fr-SN': 'fr', 'fr-CI': 'fr', 'fr-CM': 'fr', 'fr-CD': 'fr', 'fr-ML': 'fr',
  'sw': 'sw', 'sw-KE': 'sw', 'sw-TZ': 'sw', 'sw-UG': 'sw',
  'ha': 'ha', 'ha-NG': 'ha', 'ha-NE': 'ha',
  'am': 'am', 'am-ET': 'am',
  'zu': 'zu', 'zu-ZA': 'zu',
  'yo': 'yo', 'yo-NG': 'yo',
  'ar': 'ar', 'ar-EG': 'ar', 'ar-MA': 'ar', 'ar-DZ': 'ar', 'ar-TN': 'ar', 'ar-LY': 'ar', 'ar-SD': 'ar',
  'pt': 'pt', 'pt-BR': 'pt', 'pt-PT': 'pt', 'pt-AO': 'pt', 'pt-MZ': 'pt',
  'es': 'es', 'es-ES': 'es', 'es-MX': 'es', 'es-AR': 'es', 'es-CO': 'es', 'es-CL': 'es', 'es-PE': 'es', 'es-VE': 'es', 'es-GQ': 'es',
  'ig': 'ig', 'ig-NG': 'ig',
  'pcm': 'pcm',
};

// Basic UI translations for key elements
export const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    home: 'Home', news: 'News', tools: 'Tools', community: 'Community', learn: 'Learn',
    search: 'Search crypto news, tokens, analysis...', login: 'Login', register: 'Register',
    searchTitle: 'Search',
    language: 'Language', breakingNews: 'Breaking News', latestNews: 'Latest News',
    scamWatch: 'Scam Watch', regulation: 'Regulation', events: 'Events', authors: 'Authors',
    taxCalc: 'Tax Calculator', p2pPremium: 'P2P Premium', exchangeRates: 'Exchange Rates',
    remittance: 'Remittance', onramp: 'On/Off-Ramp', aiSummarizer: 'AI Summarizer', newsAggregator: 'News Aggregator',
    cryptoBasics: 'Crypto Basics', expertProgram: 'Expert Program', paymentDir: 'Payment Directory',
    regulatoryBot: 'Regulatory Bot', automations: 'Automations',

    // Landing / Hero / Footer common UI
    todaysTopStories: "Today's Top Stories",
    readFullArticle: 'Read Full Article',
    listenToArticle: 'Listen to Article',
    viewAllNews: 'View All News',
    latestAfricanCryptoNews: 'Latest African Crypto News',
    loadMoreArticles: 'Load More Articles',
    by: 'By',
    image: 'Image',
    quickNavigation: 'Quick Navigation',
    followUs: 'Follow Us',
    trustSecurity: 'Trust & Security',
    regionalFocus: 'Regional Focus',
    cryptoFocus: 'Crypto Focus',
    contactUs: 'Contact Us',
    stayUpdated: 'Stay Updated',
    enterYourEmail: 'Enter your email',
    subscribe: 'Subscribe',
    subscribing: 'Subscribing...',
    successfullySubscribed: '✅ Successfully subscribed!',
    failedToSubscribe: '❌ Failed to subscribe. Please try again.',
    searchFooterPlaceholder: 'Search articles, coins, news...',
    company: 'Company',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    disclaimer: 'Disclaimer',
    toolsData: 'Tools & Data',
    safetyRegulation: 'Safety & Regulation',
    paidServices: 'Paid Services', allServices: 'All Services', membership: 'Membership Plans',
    advertise: 'Advertise With Us', apiPricing: 'API & Data', marketplace: 'Marketplace',
    sponsoredContent: 'Sponsored Content', affiliate: 'Affiliate Program',
    dataInsight: 'Data Insight', newsSubscription: 'News Subscription',
  },
  fr: {
    home: 'Accueil', news: 'Actualités', tools: 'Outils', community: 'Communauté', learn: 'Apprendre',
    search: 'Rechercher actualités crypto, jetons, analyses...', login: 'Connexion', register: "S'inscrire",
    searchTitle: 'Rechercher',
    language: 'Langue', breakingNews: 'Dernières nouvelles', latestNews: 'Actualités récentes',
    scamWatch: 'Alerte Arnaques', regulation: 'Réglementation', events: 'Événements', authors: 'Auteurs',
    taxCalc: 'Calculateur fiscal', p2pPremium: 'Prime P2P', exchangeRates: 'Taux de change',
    remittance: 'Transferts', onramp: 'On/Off-Ramp', aiSummarizer: "Résumé IA", newsAggregator: "Agrégateur d'actualités",
    cryptoBasics: 'Bases Crypto', expertProgram: "Programme d'experts", paymentDir: 'Répertoire paiements',
    regulatoryBot: 'Bot réglementaire', automations: 'Automatisations',

    todaysTopStories: 'Les meilleures actualités du jour',
    readFullArticle: "Lire l'article complet",
    listenToArticle: "Écouter l'article",
    viewAllNews: 'Voir toutes les actualités',
    latestAfricanCryptoNews: 'Dernières actualités crypto en Afrique',
    loadMoreArticles: "Charger plus d'articles",
    by: 'Par',
    image: 'Image',
    quickNavigation: 'Navigation rapide',
    followUs: 'Suivez-nous',
    trustSecurity: 'Confiance & sécurité',
    regionalFocus: 'Focus régional',
    cryptoFocus: 'Focus crypto',
    contactUs: 'Nous contacter',
    stayUpdated: 'Restez informé',
    enterYourEmail: 'Entrez votre e-mail',
    subscribe: "S'abonner",
    subscribing: 'Abonnement...',
    successfullySubscribed: '✅ Abonnement réussi !',
    failedToSubscribe: "❌ Échec de l'abonnement. Veuillez réessayer.",
    searchFooterPlaceholder: 'Rechercher articles, coins, actualités...',
    company: 'Entreprise',
    about: 'À propos',
    privacy: 'Confidentialité',
    terms: 'Conditions',
    disclaimer: 'Avertissement',
    toolsData: 'Outils & données',
    safetyRegulation: 'Sécurité & réglementation',
    paidServices: 'Services Payants', allServices: 'Tous les services', membership: 'Abonnements',
    advertise: 'Publicité', apiPricing: 'API & Données', marketplace: 'Boutique',
    sponsoredContent: 'Contenu Sponsorisé', affiliate: 'Programme Affilié',
  },
  sw: {
    home: 'Nyumbani', news: 'Habari', tools: 'Zana', community: 'Jamii', learn: 'Jifunze',
    search: 'Tafuta habari za crypto, tokeni, uchambuzi...', login: 'Ingia', register: 'Jisajili',
    searchTitle: 'Tafuta',
    language: 'Lugha', breakingNews: 'Habari za Haraka', latestNews: 'Habari za Hivi Karibuni',
    scamWatch: 'Tahadhari Ulaghai', regulation: 'Kanuni', events: 'Matukio', authors: 'Waandishi',
    taxCalc: 'Kikokotoo cha Kodi', p2pPremium: 'Premium ya P2P', exchangeRates: 'Viwango vya Ubadilishaji',
    remittance: 'Uhamisho', onramp: 'On/Off-Ramp', aiSummarizer: 'Muhtasari wa AI', newsAggregator: 'Mkusanyiko wa Habari',
    cryptoBasics: 'Misingi ya Crypto', expertProgram: 'Mpango wa Wataalamu', paymentDir: 'Saraka ya Malipo',
    regulatoryBot: 'Bot ya Kanuni', automations: 'Otomatiki',

    todaysTopStories: 'Habari kuu za leo',
    readFullArticle: 'Soma makala nzima',
    listenToArticle: 'Sikiliza makala',
    viewAllNews: 'Tazama habari zote',
    latestAfricanCryptoNews: 'Habari za hivi karibuni za crypto Afrika',
    loadMoreArticles: 'Pakia makala zaidi',
    by: 'Na',
    image: 'Picha',
    quickNavigation: 'Uelekezaji wa haraka',
    followUs: 'Tufuate',
    trustSecurity: 'Uaminifu & usalama',
    regionalFocus: 'Uzingatiaji wa kikanda',
    cryptoFocus: 'Uzingatiaji wa crypto',
    contactUs: 'Wasiliana nasi',
    stayUpdated: 'Pata taarifa',
    enterYourEmail: 'Weka barua pepe yako',
    subscribe: 'Jiunge',
    subscribing: 'Ina jiunga...',
    successfullySubscribed: '✅ Umejiunga kwa mafanikio!',
    failedToSubscribe: '❌ Imeshindikana kujiunga. Tafadhali jaribu tena.',
    searchFooterPlaceholder: 'Tafuta makala, sarafu, habari...',
    company: 'Kampuni',
    about: 'Kuhusu',
    privacy: 'Faragha',
    terms: 'Masharti',
    disclaimer: 'Kanusho',
    toolsData: 'Zana & data',
    safetyRegulation: 'Usalama & kanuni',
    paidServices: 'Huduma za Kulipa', allServices: 'Huduma Zote', membership: 'Mipango ya Uanachama',
    advertise: 'Tangaza Nasi', apiPricing: 'API & Data', marketplace: 'Soko',
    sponsoredContent: 'Maudhui Yanayofadhiliwa', affiliate: 'Mpango wa Ushirika',
  },
  ha: {
    home: 'Gida', news: 'Labarai', tools: 'Kayan Aiki', community: 'Al\'umma', learn: 'Koyo',
    search: 'Nemo labaran crypto...', login: 'Shiga', register: 'Yi Rajista',
    searchTitle: 'Nema',
    language: 'Harshe', breakingNews: 'Labaran Gaggawa', latestNews: 'Sabbin Labarai',
    scamWatch: 'Faɗakarwa', regulation: 'Doka', events: 'Abubuwan da suka faru', authors: 'Marubuta',
    taxCalc: 'Lissafin Haraji', p2pPremium: 'Premium P2P', exchangeRates: 'Farashin Musaya',
    remittance: 'Aika Kuɗi', onramp: 'On/Off-Ramp', aiSummarizer: 'AI Taƙaitawa', newsAggregator: 'Tattara Labarai',
    cryptoBasics: 'Tushen Crypto', expertProgram: 'Shirin Masana', paymentDir: 'Jagorar Biyan Kuɗi',
    regulatoryBot: 'Bot na Doka', automations: 'Tsarin Kai-tsaye',

    todaysTopStories: 'Manyan labaran yau',
    readFullArticle: 'Karanta cikakken labari',
    listenToArticle: 'Saurari labari',
    viewAllNews: 'Duba duk labarai',
    latestAfricanCryptoNews: 'Sabbin labaran crypto na Afirka',
    loadMoreArticles: 'Loda ƙarin labarai',
    by: 'Daga',
    image: 'Hoto',
    quickNavigation: 'Hanya mai sauri',
    followUs: 'Bi mu',
    trustSecurity: 'Amincewa & tsaro',
    regionalFocus: 'Mayar da hankali yanki',
    cryptoFocus: 'Mayar da hankali crypto',
    contactUs: 'Tuntuɓe mu',
    stayUpdated: 'Ci gaba da sabuntawa',
    enterYourEmail: 'Shigar da imel ɗinka',
    subscribe: 'Yi rijista',
    subscribing: 'Ana rijista...',
    successfullySubscribed: '✅ An yi rijista cikin nasara!',
    failedToSubscribe: '❌ An kasa yin rijista. Sake gwadawa.',
    searchFooterPlaceholder: 'Nemo labarai, tsabar kudi, labarai...',
    company: 'Kamfani',
    about: 'Game da',
    privacy: 'Sirri',
    terms: 'Sharuɗɗa',
    disclaimer: 'Gargaɗi',
    toolsData: 'Kayan aiki & bayanai',
    safetyRegulation: 'Tsaro & doka',
    paidServices: 'Sabis na Biyan Kuɗi', allServices: 'Duk Sabis', membership: 'Tsarin Biyan Kuɗi',
    advertise: 'Tallata Tare da Mu', apiPricing: 'API & Bayanai', marketplace: 'Kasuwa',
    sponsoredContent: 'Abun Ciki Mai Tallafi', affiliate: 'Shirin Haɗin Gwiwa',
  },
  am: {
    home: 'መነሻ', news: 'ዜና', tools: 'መሳሪያዎች', community: 'ማህበረሰብ', learn: 'ተማር',
    search: 'የ crypto ዜና ፈልግ...', login: 'ግባ', register: 'ተመዝገብ',
    searchTitle: 'ፈልግ',
    language: 'ቋንቋ', breakingNews: 'ሰበር ዜና', latestNews: 'የቅርብ ጊዜ ዜና',
    scamWatch: 'ማጭበርበር ማስጠንቀቂያ', regulation: 'ደንብ', events: 'ክስተቶች', authors: 'ደራሲዎች',
    taxCalc: 'የግብር ካልኩሌተር', p2pPremium: 'P2P ፕሪሚየም', exchangeRates: 'የምንዛሪ ተመን',
    remittance: 'ገንዘብ ማስተላለፍ', onramp: 'On/Off-Ramp', aiSummarizer: 'AI ማጠቃለያ', newsAggregator: 'የዜና ስብሰባ',
    cryptoBasics: 'የ Crypto መሰረታዊ', expertProgram: 'የባለሙያ ፕሮግራም', paymentDir: 'የክፍያ ማውጫ',
    regulatoryBot: 'የቁጥጥር ቦት', automations: 'አውቶሜሽን',

    todaysTopStories: 'የዛሬ ዋና ዋና ዜናዎች',
    readFullArticle: 'ሙሉ ጽሑፉን አንብብ',
    listenToArticle: 'ጽሑፉን ያዳምጡ',
    viewAllNews: 'ሁሉንም ዜና ይመልከቱ',
    latestAfricanCryptoNews: 'የአፍሪካ የክሪፕቶ ዜና አዳዲስ',
    loadMoreArticles: 'ተጨማሪ ጽሑፎችን ጫን',
    by: 'በ',
    image: 'ምስል',
    quickNavigation: 'ፈጣን አሰሳ',
    followUs: 'ተከተሉን',
    trustSecurity: 'እምነት & ደህንነት',
    regionalFocus: 'የክልል ትኩረት',
    cryptoFocus: 'የክሪፕቶ ትኩረት',
    contactUs: 'ያግኙን',
    stayUpdated: 'ዝማኔ ይቀበሉ',
    enterYourEmail: 'ኢሜይልዎን ያስገቡ',
    subscribe: 'ይመዝገቡ',
    subscribing: 'በመመዝገብ ላይ...',
    successfullySubscribed: '✅ በተሳካ ሁኔታ ተመዝግበዋል!',
    failedToSubscribe: '❌ መመዝገብ አልተሳካም። እንደገና ይሞክሩ።',
    searchFooterPlaceholder: 'ጽሑፎችን፣ ሳንቲሞችን፣ ዜና...',
    company: 'ኩባንያ',
    about: 'ስለ እኛ',
    privacy: 'ግላዊነት',
    terms: 'ውሎች',
    disclaimer: 'ማስታወቂያ',
    toolsData: 'መሳሪያዎች & ውሂብ',
    safetyRegulation: 'ደህንነት & ደንብ',
    paidServices: 'የሚከፈልባቸው አገልግሎቶች', allServices: 'ሁሉም አገልግሎቶች', membership: 'የአባልነት እቅዶች',
    advertise: 'ከእኛ ጋር ያስተዋውቁ', apiPricing: 'API & ዳታ', marketplace: 'ገበያ',
    sponsoredContent: 'የተደገፈ ይዘት', affiliate: 'የአጋር ፕሮግራም',
  },
  zu: {
    home: 'Ikhaya', news: 'Izindaba', tools: 'Amathuluzi', community: 'Umphakathi', learn: 'Funda',
    search: 'Sesha izindaba ze-crypto...', login: 'Ngena', register: 'Bhalisa',
    searchTitle: 'Sesha',
    language: 'Ulimi', breakingNews: 'Izindaba Eziphuthumayo', latestNews: 'Izindaba Zakamuva',
    scamWatch: 'Isexwayiso Senkohliso', regulation: 'Umthetho', events: 'Imicimbi', authors: 'Ababhali',
    taxCalc: 'Isibali Sentela', p2pPremium: 'I-P2P Premium', exchangeRates: 'Amazinga Okushintsha',
    remittance: 'Ukuthumela Imali', onramp: 'On/Off-Ramp', aiSummarizer: 'Isifinyezo se-AI', newsAggregator: 'Isiqoqo Sezindaba',
    cryptoBasics: 'Izisekelo ze-Crypto', expertProgram: 'Uhlelo Lwochwepheshe', paymentDir: 'Uhla Lwezinkokhelo',
    regulatoryBot: 'I-Bot Yomthetho', automations: 'Ukuzenzakalela',

    todaysTopStories: 'Izindaba ezinkulu zanamuhla',
    readFullArticle: 'Funda isihloko sonke',
    listenToArticle: 'Lalela isihloko',
    viewAllNews: 'Buka zonke izindaba',
    latestAfricanCryptoNews: 'Izindaba ze-crypto zase-Afrika zakamuva',
    loadMoreArticles: 'Layisha ezinye izihloko',
    by: 'Ngu',
    image: 'Isithombe',
    quickNavigation: 'Ukuhamba okusheshayo',
    followUs: 'Silandele',
    trustSecurity: 'Ukwethembana & ukuphepha',
    regionalFocus: 'Ukugxila kwesifunda',
    cryptoFocus: 'Ukugxila kwe-crypto',
    contactUs: 'Xhumana nathi',
    stayUpdated: 'Hlala ubuyekeziwe',
    enterYourEmail: 'Faka i-imeyili yakho',
    subscribe: 'Bhalisa',
    subscribing: 'Kuyabhaliswa...',
    successfullySubscribed: '✅ Ubhalise ngempumelelo!',
    failedToSubscribe: '❌ Yehlulekile ukubhalisa. Sicela uzame futhi.',
    searchFooterPlaceholder: 'Sesha izihloko, izinhlamvu, izindaba...',
    company: 'Inkampani',
    about: 'Mayelana',
    privacy: 'Ubumfihlo',
    terms: 'Imigomo',
    disclaimer: 'Isixwayiso',
    toolsData: 'Amathuluzi & idatha',
    safetyRegulation: 'Ukuphepha & umthetho',
    paidServices: 'Izinsizakalo Ezikhokhwayo', allServices: 'Zonke Izinsizakalo', membership: 'Izinhlelo Zobulungu',
    advertise: 'Khangisa Nathi', apiPricing: 'API & Idatha', marketplace: 'Imakethe',
    sponsoredContent: 'Okuqukethwe Okuxhaswayo', affiliate: 'Uhlelo Lokuhlanganyela',
  },
  yo: {
    home: 'Ile', news: 'Iroyin', tools: 'Awọn irinṣẹ', community: 'Agbegbe', learn: 'Kọ ẹkọ',
    search: 'Wa iroyin crypto...', login: 'Wọle', register: 'Forukọsilẹ',
    searchTitle: 'Wa',
    language: 'Ede', breakingNews: 'Iroyin Pajawiri', latestNews: 'Iroyin Tuntun',
    scamWatch: 'Ìkìlọ̀ Jìbìtì', regulation: 'Ofin', events: 'Awọn iṣẹlẹ', authors: 'Awọn onkọwe',
    taxCalc: 'Ìṣirò Owó-orí', p2pPremium: 'P2P Premium', exchangeRates: 'Oṣuwọn Paṣipaarọ',
    remittance: 'Fifiranṣẹ Owó', onramp: 'On/Off-Ramp', aiSummarizer: 'Àkópọ̀ AI', newsAggregator: 'Àkójọ Ìròyìn',
    cryptoBasics: 'Ìpìlẹ̀ Crypto', expertProgram: 'Ètò Ọjọ́gbọ́n', paymentDir: 'Ìtọ́sọ́nà Ìsanwó',
    regulatoryBot: 'Bot Ìṣàkóso', automations: 'Àṣeaṣefúnrarẹ̀',

    todaysTopStories: 'Àwọn ìròyìn pàtàkì lónìí',
    readFullArticle: 'Ka ìtàn náà pátápátá',
    listenToArticle: 'Gbọ ìtàn náà',
    viewAllNews: 'Wo gbogbo ìròyìn',
    latestAfricanCryptoNews: 'Ìròyìn crypto tuntun ní Afirika',
    loadMoreArticles: 'Gbé àwọn àpilẹ̀kọ míì wá',
    by: 'Látọ̀dọ̀',
    image: 'Àwòrán',
    quickNavigation: 'Ìtọ́sọ́nà kíákíá',
    followUs: 'Tẹ̀lé wa',
    trustSecurity: 'Ìgbẹ́kẹ̀lé & ààbò',
    regionalFocus: 'Ìfọkànsìn agbègbè',
    cryptoFocus: 'Ìfọkànsìn crypto',
    contactUs: 'Bá wa sọ̀rọ̀',
    stayUpdated: 'Máa gba ìmúdójúìwọ̀n',
    enterYourEmail: 'Tẹ imeeli rẹ',
    subscribe: 'Forúkọsílẹ̀',
    subscribing: 'Nínú ìforúkọsílẹ̀...',
    successfullySubscribed: '✅ O ti forúkọsílẹ̀ dáadáa!',
    failedToSubscribe: '❌ Forúkọsílẹ̀ kò ṣeyọrí. Jọ̀wọ́ gbìyànjú lẹ́ẹ̀kansi.',
    searchFooterPlaceholder: 'Wa àpilẹ̀kọ, owó, ìròyìn...',
    company: 'Ilé-iṣẹ́',
    about: 'Nípa',
    privacy: 'Àṣírí',
    terms: 'Àwọn àdéhùn',
    disclaimer: 'Ìkìlọ̀',
    toolsData: 'Àwọn irinṣẹ́ & data',
    safetyRegulation: 'Ààbò & òfin',
    paidServices: 'Iṣẹ́ Tí A Ń Sanwó Fún', allServices: 'Gbogbo Iṣẹ́', membership: 'Ètò Ọmọ Ẹgbẹ́',
    advertise: 'Polówó Pẹ̀lú Wa', apiPricing: 'API & Dátà', marketplace: 'Ọjà',
    sponsoredContent: 'Àkóónú Tí A Ṣètìlẹ́yìn', affiliate: 'Ètò Alájọṣepọ̀',
  },
  ar: {
    home: 'الرئيسية', news: 'أخبار', tools: 'أدوات', community: 'مجتمع', learn: 'تعلم',
    search: 'ابحث عن أخبار العملات المشفرة...', login: 'تسجيل الدخول', register: 'إنشاء حساب',
    searchTitle: 'بحث',
    language: 'اللغة', breakingNews: 'عاجل', latestNews: 'آخر الأخبار',
    scamWatch: 'تحذير احتيال', regulation: 'تنظيمات', events: 'فعاليات', authors: 'كتّاب',
    taxCalc: 'حاسبة الضرائب', p2pPremium: 'P2P بريميوم', exchangeRates: 'أسعار الصرف',
    remittance: 'تحويلات', onramp: 'On/Off-Ramp', aiSummarizer: 'ملخص AI', newsAggregator: 'مجمع الأخبار',
    cryptoBasics: 'أساسيات العملات المشفرة', expertProgram: 'برنامج الخبراء', paymentDir: 'دليل المدفوعات',
    regulatoryBot: 'بوت تنظيمي', automations: 'أتمتة',

    todaysTopStories: 'أهم قصص اليوم',
    readFullArticle: 'اقرأ المقال كاملاً',
    listenToArticle: 'استمع إلى المقال',
    viewAllNews: 'عرض كل الأخبار',
    latestAfricanCryptoNews: 'آخر أخبار العملات المشفرة في أفريقيا',
    loadMoreArticles: 'تحميل المزيد من المقالات',
    by: 'بواسطة',
    image: 'صورة',
    quickNavigation: 'تنقل سريع',
    followUs: 'تابعنا',
    trustSecurity: 'الثقة والأمان',
    regionalFocus: 'التركيز الإقليمي',
    cryptoFocus: 'تركيز العملات',
    contactUs: 'اتصل بنا',
    stayUpdated: 'ابق على اطلاع',
    enterYourEmail: 'أدخل بريدك الإلكتروني',
    subscribe: 'اشترك',
    subscribing: 'جارٍ الاشتراك...',
    successfullySubscribed: '✅ تم الاشتراك بنجاح!',
    failedToSubscribe: '❌ فشل الاشتراك. حاول مرة أخرى.',
    searchFooterPlaceholder: 'ابحث عن مقالات وعملات وأخبار...',
    company: 'الشركة',
    about: 'حول',
    privacy: 'الخصوصية',
    terms: 'الشروط',
    disclaimer: 'إخلاء مسؤولية',
    toolsData: 'أدوات وبيانات',
    safetyRegulation: 'السلامة والتنظيم',
    paidServices: 'خدمات مدفوعة', allServices: 'جميع الخدمات', membership: 'خطط العضوية',
    advertise: 'أعلن معنا', apiPricing: 'API والبيانات', marketplace: 'السوق',
    sponsoredContent: 'محتوى مدعوم', affiliate: 'برنامج الشركاء',
  },
  pt: {
    home: 'Início', news: 'Notícias', tools: 'Ferramentas', community: 'Comunidade', learn: 'Aprender',
    search: 'Pesquisar notícias de crypto...', login: 'Entrar', register: 'Registar',
    searchTitle: 'Pesquisar',
    language: 'Idioma', breakingNews: 'Urgente', latestNews: 'Últimas Notícias',
    scamWatch: 'Alerta de Fraude', regulation: 'Regulamentação', events: 'Eventos', authors: 'Autores',
    taxCalc: 'Calculadora de Impostos', p2pPremium: 'Premium P2P', exchangeRates: 'Taxas de Câmbio',
    remittance: 'Remessas', onramp: 'On/Off-Ramp', aiSummarizer: 'Resumo IA', newsAggregator: 'Agregador de Notícias',
    cryptoBasics: 'Fundamentos Crypto', expertProgram: 'Programa de Especialistas', paymentDir: 'Diretório de Pagamentos',
    regulatoryBot: 'Bot Regulatório', automations: 'Automações',

    todaysTopStories: 'Principais histórias de hoje',
    readFullArticle: 'Ler artigo completo',
    listenToArticle: 'Ouvir o artigo',
    viewAllNews: 'Ver todas as notícias',
    latestAfricanCryptoNews: 'Últimas notícias de crypto em África',
    loadMoreArticles: 'Carregar mais artigos',
    by: 'Por',
    image: 'Imagem',
    quickNavigation: 'Navegação rápida',
    followUs: 'Siga-nos',
    trustSecurity: 'Confiança e segurança',
    regionalFocus: 'Foco regional',
    cryptoFocus: 'Foco crypto',
    contactUs: 'Contacte-nos',
    stayUpdated: 'Fique atualizado',
    enterYourEmail: 'Introduza o seu e-mail',
    subscribe: 'Subscrever',
    subscribing: 'A subscrever...',
    successfullySubscribed: '✅ Subscrição concluída!',
    failedToSubscribe: '❌ Falha ao subscrever. Tente novamente.',
    searchFooterPlaceholder: 'Pesquisar artigos, moedas, notícias...',
    company: 'Empresa',
    about: 'Sobre',
    privacy: 'Privacidade',
    terms: 'Termos',
    disclaimer: 'Aviso legal',
    toolsData: 'Ferramentas e dados',
    safetyRegulation: 'Segurança e regulamentação',
    paidServices: 'Serviços Pagos', allServices: 'Todos os Serviços', membership: 'Planos de Adesão',
    advertise: 'Anuncie Connosco', apiPricing: 'API & Dados', marketplace: 'Loja',
    sponsoredContent: 'Conteúdo Patrocinado', affiliate: 'Programa de Afiliados',
  },
  es: {
    home: 'Inicio', news: 'Noticias', tools: 'Herramientas', community: 'Comunidad', learn: 'Aprender',
    search: 'Buscar noticias crypto, tokens, análisis...', login: 'Iniciar sesión', register: 'Registrarse',
    searchTitle: 'Buscar',
    language: 'Idioma', breakingNews: 'Última hora', latestNews: 'Últimas Noticias',
    scamWatch: 'Alerta de Estafas', regulation: 'Regulación', events: 'Eventos', authors: 'Autores',
    taxCalc: 'Calculadora de Impuestos', p2pPremium: 'P2P Premium', exchangeRates: 'Tipos de Cambio',
    remittance: 'Remesas', onramp: 'On/Off-Ramp', aiSummarizer: 'Resumen IA', newsAggregator: 'Agregador de Noticias',
    cryptoBasics: 'Fundamentos Crypto', expertProgram: 'Programa de Expertos', paymentDir: 'Directorio de Pagos',
    regulatoryBot: 'Bot Regulatorio', automations: 'Automatizaciones',

    todaysTopStories: 'Principales historias de hoy',
    readFullArticle: 'Leer artículo completo',
    listenToArticle: 'Escuchar el artículo',
    viewAllNews: 'Ver todas las noticias',
    latestAfricanCryptoNews: 'Últimas noticias crypto en África',
    loadMoreArticles: 'Cargar más artículos',
    by: 'Por',
    image: 'Imagen',
    quickNavigation: 'Navegación rápida',
    followUs: 'Síguenos',
    trustSecurity: 'Confianza y seguridad',
    regionalFocus: 'Enfoque regional',
    cryptoFocus: 'Enfoque crypto',
    contactUs: 'Contáctanos',
    stayUpdated: 'Mantente actualizado',
    enterYourEmail: 'Introduce tu correo',
    subscribe: 'Suscribirse',
    subscribing: 'Suscribiendo...',
    successfullySubscribed: '✅ ¡Suscripción exitosa!',
    failedToSubscribe: '❌ Error al suscribirse. Inténtalo de nuevo.',
    searchFooterPlaceholder: 'Buscar artículos, monedas, noticias...',
    company: 'Empresa',
    about: 'Acerca de',
    privacy: 'Privacidad',
    terms: 'Términos',
    disclaimer: 'Aviso',
    toolsData: 'Herramientas y datos',
    safetyRegulation: 'Seguridad y regulación',
    paidServices: 'Servicios de Pago', allServices: 'Todos los Servicios', membership: 'Planes de Membresía',
    advertise: 'Anúnciate con Nosotros', apiPricing: 'API & Datos', marketplace: 'Tienda',
    sponsoredContent: 'Contenido Patrocinado', affiliate: 'Programa de Afiliados',
  },
  ig: {
    home: 'Ụlọ', news: 'Akụkọ', tools: 'Ngwaọrụ', community: 'Obodo', learn: 'Mụta',
    search: 'Chọọ akụkọ crypto...', login: 'Banye', register: 'Debanye aha',
    searchTitle: 'Chọọ',
    language: 'Asụsụ', breakingNews: 'Akụkọ Ọhụrụ', latestNews: 'Akụkọ Kachasị Ọhụrụ',
    scamWatch: 'Ịdọ Aka Na Ntị', regulation: 'Iwu', events: 'Ihe Omume', authors: 'Ndị Ode Akwụkwọ',
    taxCalc: 'Ngụkọta Ụtụ', p2pPremium: 'P2P Premium', exchangeRates: 'Ọnụ Ahịa Mgbanwe',
    remittance: 'Nzipu ego', onramp: 'On/Off-Ramp', aiSummarizer: 'Nchịkọta AI', newsAggregator: 'Nchịkọta Akụkọ',
    cryptoBasics: 'Ntọala Crypto', expertProgram: 'Mmemme Ọkachamara', paymentDir: 'Ndekọ Ụgwọ',
    regulatoryBot: 'Bot Iwu', automations: 'Njikwa Akpaaka',

    todaysTopStories: 'Akụkọ kachasị mkpa taa',
    readFullArticle: 'Gụọ akụkọ niile',
    listenToArticle: 'Gee akụkọ ahụ',
    viewAllNews: 'Lee akụkọ niile',
    latestAfricanCryptoNews: 'Akụkọ crypto ọhụrụ n’Afrịka',
    loadMoreArticles: 'Bulite akụkọ ndị ọzọ',
    by: 'Site n’aka',
    image: 'Foto',
    quickNavigation: 'Nduzi ọsọ ọsọ',
    followUs: 'Soro anyị',
    trustSecurity: 'Ntụkwasị obi & nchekwa',
    regionalFocus: 'Elekwasị anya mpaghara',
    cryptoFocus: 'Elekwasị anya crypto',
    contactUs: 'Kpọtụrụ anyị',
    stayUpdated: 'Nọgide na-enweta ọhụrụ',
    enterYourEmail: 'Tinye email gị',
    subscribe: 'Debanye aha',
    subscribing: 'Na debanye...',
    successfullySubscribed: '✅ Debanyere aha nke ọma!',
    failedToSubscribe: '❌ Debanye aha adaala. Biko nwaa ọzọ.',
    searchFooterPlaceholder: 'Chọọ akụkọ, ego, ozi...',
    company: 'Ụlọ ọrụ',
    about: 'Banyere',
    privacy: 'Nzuzo',
    terms: 'Usoro',
    disclaimer: 'Nkwupụta',
    toolsData: 'Ngwaọrụ & data',
    safetyRegulation: 'Nchekwa & iwu',
    paidServices: 'Ọrụ A Na-Akwụ Ụgwọ', allServices: 'Ọrụ Niile', membership: 'Atụmatụ Ndị Otu',
    advertise: 'Kwụpụta Ozi', apiPricing: 'API & Data', marketplace: 'Ahịa',
    sponsoredContent: 'Ọdịnaya Nkwado', affiliate: 'Mmemme Ndị Mmekọ',
  },
  pcm: {
    home: 'Home', news: 'News', tools: 'Tools', community: 'Community', learn: 'Learn',
    search: 'Search crypto news, tokens, analysis...', login: 'Enter', register: 'Register',
    searchTitle: 'Search',
    language: 'Language', breakingNews: 'Breaking News', latestNews: 'Latest News',
    scamWatch: 'Scam Alert', regulation: 'Regulation', events: 'Events', authors: 'Writers',
    taxCalc: 'Tax Calculator', p2pPremium: 'P2P Premium', exchangeRates: 'Exchange Rate',
    remittance: 'Send Money', onramp: 'On/Off-Ramp', aiSummarizer: 'AI Summary', newsAggregator: 'News Gather',
    cryptoBasics: 'Crypto Basics', expertProgram: 'Expert Program', paymentDir: 'Payment Directory',
    regulatoryBot: 'Regulatory Bot', automations: 'Automations',

    todaysTopStories: 'Today Top Stories',
    readFullArticle: 'Read di full article',
    listenToArticle: 'Listen to di article',
    viewAllNews: 'See all news',
    latestAfricanCryptoNews: 'Latest African Crypto News',
    loadMoreArticles: 'Load more articles',
    by: 'By',
    image: 'Picture',
    quickNavigation: 'Quick Navigation',
    followUs: 'Follow us',
    trustSecurity: 'Trust & Security',
    regionalFocus: 'Regional Focus',
    cryptoFocus: 'Crypto Focus',
    contactUs: 'Contact us',
    stayUpdated: 'Stay Updated',
    enterYourEmail: 'Put your email',
    subscribe: 'Subscribe',
    subscribing: 'Subscribing...',
    successfullySubscribed: '✅ You don subscribe!',
    failedToSubscribe: '❌ E no work. Try again.',
    searchFooterPlaceholder: 'Search articles, coins, news...',
    company: 'Company',
    about: 'About',
    privacy: 'Privacy',
    terms: 'Terms',
    disclaimer: 'Disclaimer',
    toolsData: 'Tools & Data',
    safetyRegulation: 'Safety & Regulation',
    paidServices: 'Paid Services', allServices: 'All Services', membership: 'Membership Plans',
    advertise: 'Advertise With Us', apiPricing: 'API & Data', marketplace: 'Marketplace',
    sponsoredContent: 'Sponsored Content', affiliate: 'Affiliate Program',
  },
};

interface LanguageContextType {
  currentLanguage: string;
  languageConfig: LanguageConfig;
  setLanguage: (code: string) => void;
  t: (key: string) => string;
  isRTL: boolean;
  supportedLanguages: LanguageConfig[];
  detectedBrowserLang: string;
  /** Translate arbitrary content text via the NLLB backend */
  translateContent: (text: string, targetLang?: string) => Promise<string>;
  /** True while a content translation request is in-flight */
  isTranslating: boolean;
  /** Translate the entire visible page DOM into the current language */
  translateFullPage: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectBrowserLanguage(): string {
  if (typeof window === 'undefined') return 'en';
  
  // Priority 1: Check browser languages (navigator.language and navigator.languages)
  const browserLangs = [
    navigator.language,
    ...(navigator.languages || []),
  ];
  
  for (const lang of browserLangs) {
    // Exact match
    if (BROWSER_LANG_MAP[lang]) return BROWSER_LANG_MAP[lang];
    // Try base language (e.g., "fr-FR" -> "fr")
    const base = lang.split('-')[0];
    if (BROWSER_LANG_MAP[base]) return BROWSER_LANG_MAP[base];
  }
  
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [detectedBrowserLang, setDetectedBrowserLang] = useState('en');
  const [mounted, setMounted] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Translation cache to avoid redundant API calls
  const translationCache = React.useRef<Map<string, string>>(new Map());

  // On mount: detect browser language, check localStorage override
  useEffect(() => {
    const detected = detectBrowserLanguage();
    setDetectedBrowserLang(detected);

    // Priority 1: default language explicitly learned (>= 3 selections)
    const learnedDefault = localStorage.getItem(LANG_DEFAULT_KEY);
    if (learnedDefault && isSupportedLanguage(learnedDefault)) {
      setCurrentLanguage(learnedDefault);
      setLangCookie(learnedDefault);
      setMounted(true);
      return;
    }

    // Priority 2: session language (persists across navigation/refresh in same tab)
    const sessionLang = sessionStorage.getItem(LANG_SESSION_KEY);
    if (sessionLang && isSupportedLanguage(sessionLang)) {
      setCurrentLanguage(sessionLang);
      setLangCookie(sessionLang);
      setMounted(true);
      return;
    }

    // Priority 3: legacy saved preference (migrate to learned default to avoid breaking existing users)
    const legacySaved = localStorage.getItem(LEGACY_LANG_KEY);
    if (legacySaved && isSupportedLanguage(legacySaved)) {
      localStorage.setItem(LANG_DEFAULT_KEY, legacySaved);
      setCurrentLanguage(legacySaved);
      setLangCookie(legacySaved);
      setMounted(true);
      return;
    }

    // Fallback: browser language (per original requirement)
    setCurrentLanguage(detected);
    setLangCookie(detected);
    
    setMounted(true);
  }, []);

  // Update HTML lang and dir attributes
  useEffect(() => {
    if (!mounted) return;
    const config = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage);
    if (config) {
      document.documentElement.lang = config.code;
      document.documentElement.dir = config.dir;
    }
  }, [currentLanguage, mounted]);

  // Auto-translate page content when language changes (non-English)
  useEffect(() => {
    if (!mounted || currentLanguage === 'en') return;
    // Small delay to let DOM settle after React renders
    const timer = setTimeout(() => {
      translateFullPage();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage, mounted]);

  const setLanguage = useCallback((code: string) => {
    const config = SUPPORTED_LANGUAGES.find(l => l.code === code);
    if (config) {
      setCurrentLanguage(code);
      sessionStorage.setItem(LANG_SESSION_KEY, code);

      // Only learn a persistent default after the user picks the same language 3 times.
      const nextCount = bumpLanguageSelectionCount(code);
      if (nextCount >= 3) {
        localStorage.setItem(LANG_DEFAULT_KEY, code);
        // Keep legacy key in sync so existing code/older builds keep working.
        localStorage.setItem(LEGACY_LANG_KEY, code);
      }

      setLangCookie(code);
      document.documentElement.lang = code;
      document.documentElement.dir = config.dir;

      // Clear translation cache on language change so new translations come through
      translationCache.current.clear();
    }
  }, []);

  const t = useCallback((key: string): string => {
    return UI_TRANSLATIONS[currentLanguage]?.[key] 
      || UI_TRANSLATIONS['en']?.[key] 
      || key;
  }, [currentLanguage]);

  /**
   * Translate arbitrary text content via the backend NLLB translation API.
   * Uses a local cache to avoid redundant calls.
   */
  const translateContent = useCallback(async (text: string, targetLang?: string): Promise<string> => {
    const lang = targetLang || currentLanguage;
    if (lang === 'en' || !text.trim()) return text;

    const cacheKey = `${lang}:${text.substring(0, 100)}`;
    const cached = translationCache.current.get(cacheKey);
    if (cached) return cached;

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: lang }),
        credentials: 'include',
      });
      if (!res.ok) return text;
      const data = await res.json();
      const translated = data.translatedText || data.data?.translatedText || text;
      translationCache.current.set(cacheKey, translated);
      return translated;
    } catch {
      return text; // graceful fallback
    }
  }, [currentLanguage]);

  /**
   * Translate the full visible page by walking the DOM and translating
   * all text nodes within [data-translatable] elements and common content areas.
   * Falls back gracefully if any translation fails.
   */
  const translateFullPage = useCallback(async () => {
    if (currentLanguage === 'en') return;
    setIsTranslating(true);

    try {
      // Collect all translatable text nodes from article content, headings, paragraphs
      const selectors = [
        '[data-translatable]',
        'article p', 'article h1', 'article h2', 'article h3',
        'main p', 'main h1', 'main h2', 'main h3',
        '.article-content p', '.article-content h1', '.article-content h2',
      ];
      const elements = document.querySelectorAll(selectors.join(', '));

      // Batch translate: collect texts, send in chunks
      const nodes: { el: Element; originalText: string }[] = [];
      elements.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 2) {
          // Store original text for potential revert
          if (!el.getAttribute('data-original-text')) {
            el.setAttribute('data-original-text', text);
          }
          nodes.push({ el, originalText: text });
        }
      });

      // Process in batches of 10 for performance
      const BATCH_SIZE = 10;
      for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
        const batch = nodes.slice(i, i + BATCH_SIZE);
        const translations = await Promise.allSettled(
          batch.map(({ originalText }) => translateContent(originalText))
        );

        translations.forEach((result, idx) => {
          if (result.status === 'fulfilled' && result.value) {
            batch[idx].el.textContent = result.value;
          }
        });
      }
    } catch (err) {
      console.error('[LanguageProvider] Full page translation failed:', err);
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage, translateContent]);

  const languageConfig = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];
  const isRTL = languageConfig.dir === 'rtl';

  const value: LanguageContextType = {
    currentLanguage,
    languageConfig,
    setLanguage,
    t,
    isRTL,
    supportedLanguages: SUPPORTED_LANGUAGES,
    detectedBrowserLang,
    translateContent,
    isTranslating,
    translateFullPage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback for components outside provider
    return {
      currentLanguage: 'en',
      languageConfig: SUPPORTED_LANGUAGES[0],
      setLanguage: () => {},
      t: (key: string) => UI_TRANSLATIONS['en']?.[key] || key,
      isRTL: false,
      supportedLanguages: SUPPORTED_LANGUAGES,
      detectedBrowserLang: 'en',
      translateContent: async (text: string) => text,
      isTranslating: false,
      translateFullPage: async () => {},
    };
  }
  return context;
}

export default LanguageContext;
