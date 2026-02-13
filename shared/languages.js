"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COUNTRY_LANGUAGE_MAP = exports.LANGUAGE_REGIONS = exports.SUPPORTED_LANGUAGES = void 0;
exports.SUPPORTED_LANGUAGES = {
    en: { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    sw: { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
    ha: { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
    yo: { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
    ig: { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
    am: { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
    zu: { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
    es: { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
    it: { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    de: { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    fr: { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    ru: { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
};
exports.LANGUAGE_REGIONS = {
    african: ['sw', 'ha', 'yo', 'ig', 'am', 'zu'],
    european: ['es', 'pt', 'it', 'de', 'fr', 'ru'],
    global: ['en'],
};
exports.COUNTRY_LANGUAGE_MAP = {
    KE: 'sw',
    TZ: 'sw',
    NG: 'ig',
    ET: 'am',
    ZA: 'zu',
    ES: 'es',
    MX: 'es',
    PT: 'pt',
    BR: 'pt',
    IT: 'it',
    DE: 'de',
    AT: 'de',
    FR: 'fr',
    RU: 'ru',
    US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en',
};
exports.default = exports.SUPPORTED_LANGUAGES;
//# sourceMappingURL=languages.js.map