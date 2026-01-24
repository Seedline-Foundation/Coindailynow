// Affiliate tracking utilities for client-side usage

export const AFFILIATE_CODE_KEY = 'affiliate_ref_code';
export const AFFILIATE_EXPIRY_KEY = 'affiliate_ref_expiry';
export const AFFILIATE_TRACKED_KEY = 'affiliate_tracked';

// 30 days in milliseconds
const EXPIRY_DURATION = 30 * 24 * 60 * 60 * 1000;

/**
 * Check if the stored code has expired
 */
function isCodeExpired(): boolean {
  if (typeof window === 'undefined') return true;
  
  const expiryTime = localStorage.getItem(AFFILIATE_EXPIRY_KEY);
  if (!expiryTime) return true;
  
  const expiry = parseInt(expiryTime, 10);
  return Date.now() > expiry;
}

/**
 * Check if there's an affiliate code in the URL and store it with 30-day expiration
 */
export function captureAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');

  if (refCode) {
    // Store in localStorage with 30-day expiration
    const expiryTime = Date.now() + EXPIRY_DURATION;
    localStorage.setItem(AFFILIATE_CODE_KEY, refCode);
    localStorage.setItem(AFFILIATE_EXPIRY_KEY, expiryTime.toString());
    
    // Track the click
    trackAffiliateClick(refCode);

    return refCode;
  }

  // Check if existing code has expired
  if (isCodeExpired()) {
    clearAffiliateCode();
    return null;
  }

  // Return existing code from localStorage
  return localStorage.getItem(AFFILIATE_CODE_KEY);
}

/**
 * Get the stored affiliate code (only if not expired)
 */
export function getStoredAffiliateCode(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check if code has expired
  if (isCodeExpired()) {
    clearAffiliateCode();
    return null;
  }
  
  return localStorage.getItem(AFFILIATE_CODE_KEY);
}

/**
 * Clear the stored affiliate code
 */
export function clearAffiliateCode(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AFFILIATE_CODE_KEY);
  localStorage.removeItem(AFFILIATE_EXPIRY_KEY);
  localStorage.removeItem(AFFILIATE_TRACKED_KEY);
}

/**
 * Get remaining days until code expires
 */
export function getDaysUntilExpiry(): number | null {
  if (typeof window === 'undefined') return null;
  
  const expiryTime = localStorage.getItem(AFFILIATE_EXPIRY_KEY);
  if (!expiryTime) return null;
  
  const expiry = parseInt(expiryTime, 10);
  const remaining = expiry - Date.now();
  
  if (remaining <= 0) return 0;
  
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

/**
 * Track affiliate link click
 */
async function trackAffiliateClick(affiliateCode: string): Promise<void> {
  // Check if already tracked in this session
  const tracked = sessionStorage.getItem(AFFILIATE_TRACKED_KEY);
  if (tracked === affiliateCode) return;

  try {
    const response = await fetch(`/api/affiliate/track?ref=${affiliateCode}`);
    
    if (response.ok) {
      // Mark as tracked for this session
      sessionStorage.setItem(AFFILIATE_TRACKED_KEY, affiliateCode);
    }
  } catch (error) {
    console.error('Failed to track affiliate click:', error);
  }
}

/**
 * Submit whitelist form with affiliate code
 */
export async function submitWhitelistWithAffiliate(
  email: string,
  name?: string
): Promise<{ success: boolean; error?: string }> {
  const affiliateCode = getStoredAffiliateCode();

  try {
    const response = await fetch('/api/whitelist/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        affiliateCode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Submission failed' };
    }

    // Clear affiliate code after successful submission
    clearAffiliateCode();

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}
