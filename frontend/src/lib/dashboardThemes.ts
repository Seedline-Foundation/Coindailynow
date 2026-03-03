export type DashboardThemeId =
  | 'milk'
  | 'midnight'
  | 'ocean'
  | 'sunset'
  | 'forest';

export interface DashboardTheme {
  id: DashboardThemeId;
  name: string;
  description: string;
  classes: {
    pageBg: string;
    heroBg: string;
    heroBorder: string;
    heroBadgeBg: string;
    heroBadgeText: string;
    headingText: string;
    bodyText: string;
    mutedText: string;
    sectionBg: string;
    sectionBorder: string;
    cardBg: string;
    cardBorder: string;
    cardHoverBorder: string;
    quickLinkBg: string;
    quickLinkBorder: string;
    quickLinkHoverBg: string;
    iconChipBg: string;
    iconChipText: string;
    softAccentText: string;
    arrowText: string;
  };
  preview: {
    bg: string;
    text: string;
    card: string;
    accent: string;
  };
}

export const DASHBOARD_THEME_STORAGE_KEY = 'coindaily_dashboard_theme';

export const dashboardThemes: DashboardTheme[] = [
  {
    id: 'milk',
    name: 'Milk Cream',
    description: 'Clean cream background with black text.',
    classes: {
      pageBg: 'bg-orange-50',
      heroBg: 'bg-gradient-to-br from-orange-50 via-white to-orange-100',
      heroBorder: 'border-orange-200',
      heroBadgeBg: 'bg-orange-100',
      heroBadgeText: 'text-orange-700',
      headingText: 'text-black',
      bodyText: 'text-gray-700',
      mutedText: 'text-gray-600',
      sectionBg: 'bg-white',
      sectionBorder: 'border-orange-100',
      cardBg: 'bg-white',
      cardBorder: 'border-orange-100',
      cardHoverBorder: 'hover:border-orange-300',
      quickLinkBg: 'bg-orange-50',
      quickLinkBorder: 'border-orange-100',
      quickLinkHoverBg: 'hover:bg-orange-100',
      iconChipBg: 'bg-orange-100',
      iconChipText: 'text-orange-700',
      softAccentText: 'text-orange-700 hover:text-orange-800',
      arrowText: 'text-gray-500',
    },
    preview: {
      bg: '#FFF7ED',
      text: '#111827',
      card: '#FFFFFF',
      accent: '#C2410C',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Pro',
    description: 'Deep dark mode with neon highlights.',
    classes: {
      pageBg: 'bg-dark-950',
      heroBg: 'bg-gradient-to-br from-dark-900 via-dark-900 to-primary-500/10',
      heroBorder: 'border-primary-500/20',
      heroBadgeBg: 'bg-primary-500/10',
      heroBadgeText: 'text-primary-400',
      headingText: 'text-white',
      bodyText: 'text-dark-300',
      mutedText: 'text-dark-400',
      sectionBg: 'bg-dark-900',
      sectionBorder: 'border-dark-700',
      cardBg: 'bg-dark-800/80',
      cardBorder: 'border-dark-700',
      cardHoverBorder: 'hover:border-primary-500/40',
      quickLinkBg: 'bg-dark-800/80',
      quickLinkBorder: 'border-dark-700',
      quickLinkHoverBg: 'hover:bg-dark-800',
      iconChipBg: 'bg-primary-500/10',
      iconChipText: 'text-primary-500',
      softAccentText: 'text-primary-400 hover:text-primary-300',
      arrowText: 'text-dark-500',
    },
    preview: {
      bg: '#0B1220',
      text: '#F8FAFC',
      card: '#111827',
      accent: '#F97316',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    description: 'Cool blue tones with calm contrast.',
    classes: {
      pageBg: 'bg-sky-50',
      heroBg: 'bg-gradient-to-br from-sky-50 via-white to-cyan-100',
      heroBorder: 'border-sky-200',
      heroBadgeBg: 'bg-sky-100',
      heroBadgeText: 'text-sky-700',
      headingText: 'text-slate-900',
      bodyText: 'text-slate-700',
      mutedText: 'text-slate-600',
      sectionBg: 'bg-white',
      sectionBorder: 'border-sky-100',
      cardBg: 'bg-white',
      cardBorder: 'border-sky-100',
      cardHoverBorder: 'hover:border-sky-300',
      quickLinkBg: 'bg-sky-50',
      quickLinkBorder: 'border-sky-100',
      quickLinkHoverBg: 'hover:bg-sky-100',
      iconChipBg: 'bg-sky-100',
      iconChipText: 'text-sky-700',
      softAccentText: 'text-sky-700 hover:text-sky-800',
      arrowText: 'text-slate-500',
    },
    preview: {
      bg: '#F0F9FF',
      text: '#0F172A',
      card: '#FFFFFF',
      accent: '#0369A1',
    },
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    description: 'Warm peach and amber tones.',
    classes: {
      pageBg: 'bg-amber-50',
      heroBg: 'bg-gradient-to-br from-amber-50 via-rose-50 to-orange-100',
      heroBorder: 'border-amber-200',
      heroBadgeBg: 'bg-amber-100',
      heroBadgeText: 'text-amber-700',
      headingText: 'text-zinc-900',
      bodyText: 'text-zinc-700',
      mutedText: 'text-zinc-600',
      sectionBg: 'bg-white',
      sectionBorder: 'border-amber-100',
      cardBg: 'bg-white',
      cardBorder: 'border-amber-100',
      cardHoverBorder: 'hover:border-amber-300',
      quickLinkBg: 'bg-amber-50',
      quickLinkBorder: 'border-amber-100',
      quickLinkHoverBg: 'hover:bg-amber-100',
      iconChipBg: 'bg-amber-100',
      iconChipText: 'text-amber-700',
      softAccentText: 'text-amber-700 hover:text-amber-800',
      arrowText: 'text-zinc-500',
    },
    preview: {
      bg: '#FFFBEB',
      text: '#18181B',
      card: '#FFFFFF',
      accent: '#B45309',
    },
  },
  {
    id: 'forest',
    name: 'Forest Mint',
    description: 'Fresh green palette with earthy contrast.',
    classes: {
      pageBg: 'bg-emerald-50',
      heroBg: 'bg-gradient-to-br from-emerald-50 via-white to-green-100',
      heroBorder: 'border-emerald-200',
      heroBadgeBg: 'bg-emerald-100',
      heroBadgeText: 'text-emerald-700',
      headingText: 'text-emerald-950',
      bodyText: 'text-emerald-900',
      mutedText: 'text-emerald-700',
      sectionBg: 'bg-white',
      sectionBorder: 'border-emerald-100',
      cardBg: 'bg-white',
      cardBorder: 'border-emerald-100',
      cardHoverBorder: 'hover:border-emerald-300',
      quickLinkBg: 'bg-emerald-50',
      quickLinkBorder: 'border-emerald-100',
      quickLinkHoverBg: 'hover:bg-emerald-100',
      iconChipBg: 'bg-emerald-100',
      iconChipText: 'text-emerald-700',
      softAccentText: 'text-emerald-700 hover:text-emerald-800',
      arrowText: 'text-emerald-600',
    },
    preview: {
      bg: '#ECFDF5',
      text: '#052E16',
      card: '#FFFFFF',
      accent: '#047857',
    },
  },
];

export const dashboardThemeMap = dashboardThemes.reduce<Record<DashboardThemeId, DashboardTheme>>((acc, theme) => {
  acc[theme.id] = theme;
  return acc;
}, {} as Record<DashboardThemeId, DashboardTheme>);

export function getStoredDashboardThemeId(): DashboardThemeId {
  if (typeof window === 'undefined') return 'milk';
  const stored = localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY) as DashboardThemeId | null;
  if (stored && dashboardThemeMap[stored]) {
    return stored;
  }
  return 'milk';
}
