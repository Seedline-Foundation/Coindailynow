/**
 * SENDPRESS SDK Entry Point
 * Universal JavaScript SDK for PR distribution
 */

export { CoindailySDK as SendPress } from './core/CoindailySDK.js';
export { PRCard } from './components/PRCard.js';
export { PRFull, PRContainer } from './components/PRFull.js';

// Auto-initialize if partner-id is on script tag
(function() {
    if (typeof document === 'undefined') return;
    
    const script = document.currentScript || 
        document.querySelector('script[data-partner-id]');
    
    if (script && script.dataset.partnerId) {
        const { SendPress } = require('./core/CoindailySDK.js');
        window.sendpress = new SendPress(script.dataset.partnerId, {
            mode: script.dataset.mode || 'AUTO',
            apiUrl: script.dataset.apiUrl
        });
    }
})();
