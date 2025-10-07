/**
 * Cookie Consent Banner - Fixed Version
 * Task 30: FR-1394 Cookie Consent Management
 * 
 * GDPR/CCPA/POPIA compliant cookie consent banner
 */

import React, { useState, useEffect } from 'react';
import { Shield, Settings, BarChart3, Eye, Target, X, Check } from 'lucide-react';

interface ConsentPreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  advertising: boolean;
}

interface CookieCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  icon: React.ReactNode;
  purposes: string[];
  cookies: Array<{
    name: string;
    provider: string;
    purpose: string;
    duration: string;
  }>;
}

interface CookieConsentBannerProps {
  onConsentChange?: (preferences: ConsentPreferences) => void;
  position?: 'top' | 'bottom' | 'center';
  theme?: 'light' | 'dark';
  language?: string;
  showDeclineButton?: boolean;
  autoShow?: boolean;
}

const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onConsentChange,
  position = 'bottom',
  theme = 'light',
  language = 'en',
  showDeclineButton = true,
  autoShow = true
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    functional: false,
    analytics: false,
    marketing: false,
    advertising: false
  });

  const cookieCategories: CookieCategory[] = [
    {
      id: 'essential',
      name: 'Essential Cookies',
      description: 'These cookies are necessary for the website to function and cannot be switched off.',
      required: true,
      icon: <Shield className="w-5 h-5" />,
      purposes: ['Website functionality', 'Security', 'Load balancing'],
      cookies: [
        {
          name: 'session_id',
          provider: 'CoinDaily',
          purpose: 'Session management',
          duration: 'Session'
        },
        {
          name: 'csrf_token',
          provider: 'CoinDaily',
          purpose: 'Security protection',
          duration: '1 hour'
        }
      ]
    },
    {
      id: 'functional',
      name: 'Functional Cookies',
      description: 'These cookies enable enhanced functionality and personalization.',
      required: false,
      icon: <Settings className="w-5 h-5" />,
      purposes: ['Language preferences', 'User settings', 'Personalization'],
      cookies: [
        {
          name: 'user_preferences',
          provider: 'CoinDaily',
          purpose: 'Store user preferences',
          duration: '1 year'
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics Cookies',
      description: 'These cookies help us understand how visitors interact with our website.',
      required: false,
      icon: <BarChart3 className="w-5 h-5" />,
      purposes: ['Website analytics', 'Performance monitoring', 'User behavior analysis'],
      cookies: [
        {
          name: '_ga',
          provider: 'Google Analytics',
          purpose: 'Visitor tracking',
          duration: '2 years'
        }
      ]
    },
    {
      id: 'marketing',
      name: 'Marketing Cookies',
      description: 'These cookies are used for email marketing and newsletter subscriptions.',
      required: false,
      icon: <Eye className="w-5 h-5" />,
      purposes: ['Email marketing', 'Newsletter subscriptions', 'Campaign tracking'],
      cookies: [
        {
          name: 'marketing_consent',
          provider: 'CoinDaily',
          purpose: 'Track marketing consent preferences',
          duration: '1 year'
        }
      ]
    },
    {
      id: 'advertising',
      name: 'Advertising Cookies',
      description: 'These cookies are used to make advertising messages more relevant to you.',
      required: false,
      icon: <Target className="w-5 h-5" />,
      purposes: ['Targeted advertising', 'Ad personalization', 'Cross-site tracking'],
      cookies: [
        {
          name: 'ad_preferences',
          provider: 'Google Ads',
          purpose: 'Advertising personalization',
          duration: '90 days'
        }
      ]
    }
  ];

  useEffect(() => {
    if (autoShow) {
      const hasConsent = localStorage.getItem('coindaily_cookie_consent');
      if (!hasConsent) {
        setShowBanner(true);
      }
    }
  }, [autoShow]);

  const handleAcceptAll = () => {
    const allAccepted: ConsentPreferences = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true,
      advertising: true
    };
    
    setPreferences(allAccepted);
    saveConsent(allAccepted);
    setShowBanner(false);
  };

  const handleDeclineAll = () => {
    const minimal: ConsentPreferences = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false,
      advertising: false
    };
    
    setPreferences(minimal);
    saveConsent(minimal);
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const saveConsent = (prefs: ConsentPreferences) => {
    const consentData = {
      preferences: prefs,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    localStorage.setItem('coindaily_cookie_consent', JSON.stringify(consentData));
    
    if (onConsentChange) {
      onConsentChange(prefs);
    }

    // Send to backend API
    fetch('/api/legal/consent/cookies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        preferences: prefs,
        sessionId: generateSessionId(),
        consentMethod: 'banner_accept'
      })
    }).catch(error => {
      console.error('Failed to save consent to backend:', error);
    });
  };

  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const updatePreference = (category: keyof ConsentPreferences, value: boolean) => {
    if (category === 'essential') return; // Essential cookies cannot be disabled
    
    setPreferences(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-0';
      case 'center':
        return 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
      case 'bottom':
      default:
        return 'bottom-0';
    }
  };

  const getThemeClasses = () => {
    return theme === 'dark' 
      ? 'bg-gray-900 text-white border-gray-700' 
      : 'bg-white text-gray-900 border-gray-200';
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop */}
      {position === 'center' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}

      {/* Banner */}
      <div
        className={`fixed ${getPositionClasses()} left-0 right-0 z-50 ${getThemeClasses()} border-t shadow-lg`}
      >
        <div className="max-w-7xl mx-auto p-6">
          {/* Settings Modal */}
          {showSettings && (
            <div className="mb-6 border-b pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Cookie Preferences</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {cookieCategories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">{category.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{category.name}</h4>
                            {category.required && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {category.description}
                          </p>
                          
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Purposes:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {category.purposes.map((purpose, index) => (
                                <li key={index}>• {purpose}</li>
                              ))}
                            </ul>
                          </div>

                          <details className="mt-2">
                            <summary className="text-xs font-medium text-gray-700 cursor-pointer">
                              View Cookies ({category.cookies.length})
                            </summary>
                            <div className="mt-2 space-y-2">
                              {category.cookies.map((cookie, index) => (
                                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                                  <div className="font-medium">{cookie.name}</div>
                                  <div>Provider: {cookie.provider}</div>
                                  <div>Purpose: {cookie.purpose}</div>
                                  <div>Duration: {cookie.duration}</div>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      </div>
                      
                      <div className="ml-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences[category.id as keyof ConsentPreferences]}
                            onChange={(e) => updatePreference(
                              category.id as keyof ConsentPreferences, 
                              e.target.checked
                            )}
                            disabled={category.required}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Save Preferences
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Accept All
                </button>
                {showDeclineButton && (
                  <button
                    onClick={handleDeclineAll}
                    className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                    Decline All
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Main Banner Content */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 lg:mr-8">
              <h2 className="text-lg font-semibold mb-2">
                We value your privacy
              </h2>
              <p className="text-sm opacity-90">
                We use cookies to enhance your browsing experience, serve personalized ads or content, 
                and analyze our traffic. By clicking "Accept All", you consent to our use of cookies. 
                You can customize your preferences in the settings.
              </p>
              <div className="mt-2">
                <a 
                  href="/privacy-policy" 
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Privacy Policy
                </a>
                <span className="mx-2 text-gray-400">•</span>
                <a 
                  href="/cookie-policy" 
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Cookie Policy
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Customize
              </button>
              
              {showDeclineButton && (
                <button
                  onClick={handleDeclineAll}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  Decline All
                </button>
              )}
              
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CookieConsentBanner;