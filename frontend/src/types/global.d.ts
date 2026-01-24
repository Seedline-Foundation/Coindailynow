/// <reference types="next" />
/// <reference types="next/image-types/global" />

// CSS Modules
declare module "*.css";
declare module "*.scss";
declare module "*.sass";

// PWA Types
declare global {
  interface Navigator {
    standalone?: boolean;
  }
  
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export {};