/**
 * CoinDaily App Mode Configuration
 * Determines which sections of the app are enabled based on deployment
 */

export type AppMode = 'news' | 'admin' | 'pr';

interface ModeConfig {
  mode: AppMode;
  enabledRoutes: string[];
  disabledRoutes: string[];
  features: {
    userDashboard: boolean;
    adminPanel: boolean;
    ceoPanel: boolean;
    prDashboard: boolean;
    newsSection: boolean;
    fundsManagement: boolean;
    aiControl: boolean;
  };
}

const NEWS_MODE: ModeConfig = {
  mode: 'news',
  enabledRoutes: [
    '/',
    '/news',
    '/news/*',
    '/auth',
    '/auth/*',
    '/user',
    '/user/*',
    '/wallet',
    '/subscription',
    '/staking',
  ],
  disabledRoutes: [
    '/admin',
    '/admin/*',
    '/super-admin',
    '/super-admin/*',
    '/pr',
    '/pr/*',
  ],
  features: {
    userDashboard: true,
    adminPanel: false,
    ceoPanel: false,
    prDashboard: false,
    newsSection: true,
    fundsManagement: false,
    aiControl: false,
  },
};

const ADMIN_MODE: ModeConfig = {
  mode: 'admin',
  enabledRoutes: [
    '/',           // Staff landing page
    '/admin',
    '/admin/*',
    '/admin/CEO',
    '/admin/CEO/*',
    '/super-admin',
    '/super-admin/*',
  ],
  disabledRoutes: [
    '/news',
    '/news/*',
    '/user',
    '/user/*',
    '/pr',
    '/pr/*',
  ],
  features: {
    userDashboard: false,
    adminPanel: true,
    ceoPanel: true,
    prDashboard: false,
    newsSection: false,
    fundsManagement: true,
    aiControl: true,
  },
};

const PR_MODE: ModeConfig = {
  mode: 'pr',
  enabledRoutes: [
    '/',
    '/dashboard',
    '/dashboard/*',
    '/campaigns',
    '/campaigns/*',
    '/analytics',
    '/analytics/*',
    '/auth',
    '/auth/*',
    '/operators',
    '/operators/*',
  ],
  disabledRoutes: [
    '/admin',
    '/admin/*',
    '/super-admin',
    '/super-admin/*',
    '/news',
    '/news/*',
  ],
  features: {
    userDashboard: false,
    adminPanel: false,
    ceoPanel: false,
    prDashboard: true,
    newsSection: false,
    fundsManagement: false,
    aiControl: false,
  },
};

export function getAppMode(): AppMode {
  const adminMode = process.env.NEXT_PUBLIC_ADMIN_MODE === 'true' || process.env.ADMIN_MODE === 'true';
  const prMode = process.env.NEXT_PUBLIC_PR_MODE === 'true' || process.env.PR_MODE === 'true';
  
  if (adminMode) return 'admin';
  if (prMode) return 'pr';
  return 'news';
}

export function getModeConfig(): ModeConfig {
  const mode = getAppMode();
  
  switch (mode) {
    case 'admin':
      return ADMIN_MODE;
    case 'pr':
      return PR_MODE;
    default:
      return NEWS_MODE;
  }
}

export function isRouteEnabled(pathname: string): boolean {
  const config = getModeConfig();
  
  // Check if route is explicitly disabled
  for (const pattern of config.disabledRoutes) {
    if (matchRoute(pathname, pattern)) {
      return false;
    }
  }
  
  // Check if route is explicitly enabled
  for (const pattern of config.enabledRoutes) {
    if (matchRoute(pathname, pattern)) {
      return true;
    }
  }
  
  // Default: allow for news mode, deny for others
  return config.mode === 'news';
}

export function isFeatureEnabled(feature: keyof ModeConfig['features']): boolean {
  return getModeConfig().features[feature];
}

function matchRoute(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    return pathname === base || pathname.startsWith(base + '/');
  }
  return pathname === pattern;
}

export { NEWS_MODE, ADMIN_MODE, PR_MODE };
export type { ModeConfig };
