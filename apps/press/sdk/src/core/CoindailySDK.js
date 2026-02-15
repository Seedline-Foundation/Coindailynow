/**
 * SENDPRESS SDK - Coindaily PR Distribution Network
 * Universal JavaScript SDK for partner websites
 * 
 * @version 1.0.0
 * @license MIT
 */

const API_BASE = 'https://press.coindaily.online/api';
const WS_BASE = 'wss://press.coindaily.online/ws';

class CoindailySDK {
    constructor(siteId, config = {}) {
        this.siteId = siteId;
        this.config = {
            apiBase: API_BASE,
            wsUrl: WS_BASE,
            mode: 'AUTO', // AUTO, MANUAL
            debug: false,
            ...config
        };
        
        this.siteSecret = null;
        this.ws = null;
        this.positions = new Map();
        this.eventHandlers = new Map();
        this.metricsQueue = [];
        this.initialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            await this.loadWebComponents();
            await this.authenticate();
            this.setupWebSocket();
            this.setupMetricsReporting();
            this.initialized = true;
            this.emit('ready', { siteId: this.siteId });
            this.log('SDK initialized successfully');
        } catch (error) {
            this.log('SDK initialization failed:', error);
            this.emit('error', { error: error.message });
        }
    }
    
    /**
     * Load Web Components for PR display
     */
    loadWebComponents() {
        if (!customElements.get('coindaily-pr-card')) {
            customElements.define('coindaily-pr-card', PRCard);
        }
        if (!customElements.get('coindaily-pr-full')) {
            customElements.define('coindaily-pr-full', PRFull);
        }
        if (!customElements.get('coindaily-pr-container')) {
            customElements.define('coindaily-pr-container', PRContainer);
        }
    }
    
    /**
     * Authenticate with the SENDPRESS API
     */
    async authenticate() {
        const token = this.config.onboardingToken || this.getSiteSecret();
        
        const response = await fetch(`${this.config.apiBase}/press/sdk/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                siteId: this.siteId,
                token: token,
                domain: window.location.hostname
            })
        });
        
        if (!response.ok) {
            throw new Error('Authentication failed');
        }
        
        const data = await response.json();
        this.siteSecret = data.siteSecret;
        this.storeSiteSecret(data.siteSecret);
        return data;
    }
    
    /**
     * Register a position for PR display
     */
    async registerPosition({ id, selectorOrSlug, displayType = 'card', maxWords = 500, mediaTypes = ['image'], priceJOY = null }) {
        const position = {
            id: id || this.generateId(),
            selectorOrSlug,
            displayType,
            maxWords,
            mediaTypes,
            priceJOY
        };
        
        this.positions.set(position.id, position);
        
        // Register with backend
        try {
            await this.apiRequest('POST', `/press/sites/${this.siteId}/positions`, position);
            this.log('Position registered:', position.id);
        } catch (error) {
            this.log('Failed to register position:', error);
        }
        
        return position;
    }
    
    /**
     * Subscribe to events
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    /**
     * Emit events to handlers
     */
    emit(event, data) {
        const handlers = this.eventHandlers.get(event) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                this.log('Event handler error:', e);
            }
        });
    }
    
    /**
     * Publish a PR to a position
     */
    async publishPR(prId, { positionId }) {
        const position = this.positions.get(positionId);
        if (!position) {
            throw new Error(`Position ${positionId} not found`);
        }
        
        // Fetch PR content
        const pr = await this.apiRequest('GET', `/press/prs/${prId}`);
        
        // Insert PR into DOM
        const container = document.querySelector(position.selectorOrSlug);
        if (!container) {
            throw new Error(`Container not found: ${position.selectorOrSlug}`);
        }
        
        const element = position.displayType === 'card' 
            ? document.createElement('coindaily-pr-card')
            : document.createElement('coindaily-pr-full');
            
        element.setAttribute('pr-id', prId);
        element.setAttribute('data-pr-id', prId);
        element.prData = pr;
        
        container.appendChild(element);
        
        // Track impression
        this.trackMetric('impression', { prId, positionId });
        
        // Capture verification snapshot
        const snapshot = await this.captureSnapshot(element);
        
        return { success: true, snapshot };
    }
    
    /**
     * Verify position for AI verification
     */
    async verifyPosition(positionId) {
        const position = this.positions.get(positionId);
        if (!position) {
            throw new Error(`Position ${positionId} not found`);
        }
        
        const container = document.querySelector(position.selectorOrSlug);
        if (!container) {
            return { verified: false, reason: 'Container not found' };
        }
        
        const snapshot = await this.captureSnapshot(container);
        
        return {
            verified: true,
            snapshot,
            domHash: await this.hashElement(container)
        };
    }
    
    /**
     * Track metrics (batched)
     */
    trackMetric(type, data) {
        this.metricsQueue.push({
            type,
            data,
            timestamp: Date.now(),
            siteId: this.siteId
        });
    }
    
    /**
     * Get current metrics
     */
    metrics() {
        return [...this.metricsQueue];
    }
    
    // ========== Private Methods ==========
    
    setupWebSocket() {
        if (this.ws) return;
        
        this.ws = new WebSocket(`${this.config.wsUrl}/press`);
        
        this.ws.onopen = () => {
            this.ws.send(JSON.stringify({
                type: 'register',
                siteId: this.siteId,
                secret: this.siteSecret
            }));
            this.log('WebSocket connected');
        };
        
        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleWSMessage(message);
            } catch (e) {
                this.log('WebSocket message error:', e);
            }
        };
        
        this.ws.onclose = () => {
            this.log('WebSocket disconnected, reconnecting...');
            setTimeout(() => this.setupWebSocket(), 5000);
        };
        
        this.ws.onerror = (error) => {
            this.log('WebSocket error:', error);
        };
    }
    
    handleWSMessage(message) {
        switch (message.type) {
            case 'incomingPR':
                this.emit('incomingPR', message.payload);
                if (this.config.mode === 'AUTO') {
                    this.autoPublishPR(message.payload);
                }
                break;
            case 'verification':
                this.emit('verification', message.payload);
                break;
            case 'positionUpdate':
                this.emit('positionUpdate', message.payload);
                break;
            default:
                this.emit(message.type, message.payload);
        }
    }
    
    async autoPublishPR(prPayload) {
        const { prId, positionId } = prPayload;
        if (positionId && this.positions.has(positionId)) {
            try {
                await this.publishPR(prId, { positionId });
            } catch (e) {
                this.log('Auto-publish failed:', e);
            }
        }
    }
    
    setupMetricsReporting() {
        // Send metrics every 30 seconds
        setInterval(() => {
            if (this.metricsQueue.length > 0) {
                this.sendMetrics();
            }
        }, 30000);
        
        // Send on page unload
        window.addEventListener('beforeunload', () => {
            this.sendMetrics(true);
        });
    }
    
    async sendMetrics(sync = false) {
        if (this.metricsQueue.length === 0) return;
        
        const metrics = [...this.metricsQueue];
        this.metricsQueue = [];
        
        const payload = {
            siteId: this.siteId,
            metrics,
            signature: await this.signPayload(metrics)
        };
        
        if (sync && navigator.sendBeacon) {
            navigator.sendBeacon(
                `${this.config.apiBase}/press/metrics`,
                JSON.stringify(payload)
            );
        } else {
            try {
                await this.apiRequest('POST', '/press/metrics', payload);
            } catch (e) {
                // Re-queue on failure
                this.metricsQueue.push(...metrics);
            }
        }
    }
    
    async apiRequest(method, path, body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Site-Id': this.siteId,
                'X-Site-Signature': await this.signPayload(body || {})
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${this.config.apiBase}${path}`, options);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        return response.json();
    }
    
    async captureSnapshot(element) {
        return {
            html: element.outerHTML,
            boundingRect: element.getBoundingClientRect(),
            visible: this.isElementVisible(element),
            timestamp: Date.now()
        };
    }
    
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    async hashElement(element) {
        const encoder = new TextEncoder();
        const data = encoder.encode(element.outerHTML);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async signPayload(payload) {
        if (!this.siteSecret) return '';
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(payload) + this.siteSecret);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    getSiteSecret() {
        return localStorage.getItem(`coindaily_secret_${this.siteId}`);
    }
    
    storeSiteSecret(secret) {
        localStorage.setItem(`coindaily_secret_${this.siteId}`, secret);
    }
    
    generateId() {
        return 'pos_' + Math.random().toString(36).substr(2, 9);
    }
    
    log(...args) {
        if (this.config.debug) {
            console.log('[SENDPRESS]', ...args);
        }
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CoindailySDK };
}
if (typeof window !== 'undefined') {
    window.CoindailySDK = CoindailySDK;
    window.Coindaily = {
        init: (config) => new CoindailySDK(config.siteId, config)
    };
}

export { CoindailySDK };
export default CoindailySDK;
