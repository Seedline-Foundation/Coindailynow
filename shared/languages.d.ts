export declare const SUPPORTED_LANGUAGES: {
    readonly en: {
        readonly code: "en";
        readonly name: "English";
        readonly nativeName: "English";
        readonly flag: "🇬🇧";
    };
    readonly sw: {
        readonly code: "sw";
        readonly name: "Swahili";
        readonly nativeName: "Kiswahili";
        readonly flag: "🇰🇪";
    };
    readonly ha: {
        readonly code: "ha";
        readonly name: "Hausa";
        readonly nativeName: "Hausa";
        readonly flag: "🇳🇬";
    };
    readonly yo: {
        readonly code: "yo";
        readonly name: "Yoruba";
        readonly nativeName: "Yorùbá";
        readonly flag: "🇳🇬";
    };
    readonly ig: {
        readonly code: "ig";
        readonly name: "Igbo";
        readonly nativeName: "Igbo";
        readonly flag: "🇳🇬";
    };
    readonly am: {
        readonly code: "am";
        readonly name: "Amharic";
        readonly nativeName: "አማርኛ";
        readonly flag: "🇪🇹";
    };
    readonly zu: {
        readonly code: "zu";
        readonly name: "Zulu";
        readonly nativeName: "isiZulu";
        readonly flag: "🇿🇦";
    };
    readonly es: {
        readonly code: "es";
        readonly name: "Spanish";
        readonly nativeName: "Español";
        readonly flag: "🇪🇸";
    };
    readonly pt: {
        readonly code: "pt";
        readonly name: "Portuguese";
        readonly nativeName: "Português";
        readonly flag: "🇵🇹";
    };
    readonly it: {
        readonly code: "it";
        readonly name: "Italian";
        readonly nativeName: "Italiano";
        readonly flag: "🇮🇹";
    };
    readonly de: {
        readonly code: "de";
        readonly name: "German";
        readonly nativeName: "Deutsch";
        readonly flag: "🇩🇪";
    };
    readonly fr: {
        readonly code: "fr";
        readonly name: "French";
        readonly nativeName: "Français";
        readonly flag: "🇫🇷";
    };
    readonly ru: {
        readonly code: "ru";
        readonly name: "Russian";
        readonly nativeName: "Русский";
        readonly flag: "🇷🇺";
    };
};
export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
export declare const LANGUAGE_REGIONS: {
    african: LanguageCode[];
    european: LanguageCode[];
    global: LanguageCode[];
};
export declare const COUNTRY_LANGUAGE_MAP: Record<string, LanguageCode>;
export default SUPPORTED_LANGUAGES;
//# sourceMappingURL=languages.d.ts.map