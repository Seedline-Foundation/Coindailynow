/**
 * PR Card Web Component
 * Displays PR content as a card with redirect to full article
 */
class PRCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.prData = null;
    }
    
    static get observedAttributes() {
        return ['pr-id', 'theme'];
    }
    
    connectedCallback() {
        this.render();
        if (this.getAttribute('pr-id') && !this.prData) {
            this.loadPRContent();
        } else if (this.prData) {
            this.renderContent(this.prData);
        }
    }
    
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'pr-id' && newValue !== oldValue) {
            this.loadPRContent();
        }
        if (name === 'theme') {
            this.updateTheme(newValue);
        }
    }
    
    render() {
        const theme = this.getAttribute('theme') || 'light';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .pr-card {
                    border: 1px solid var(--border-color, #e5e7eb);
                    border-radius: 12px;
                    overflow: hidden;
                    background: var(--bg-color, #ffffff);
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                    transition: box-shadow 0.2s, transform 0.2s;
                    cursor: pointer;
                }
                
                .pr-card:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    transform: translateY(-2px);
                }
                
                .pr-card.dark {
                    --bg-color: #1f2937;
                    --border-color: #374151;
                    --text-color: #f9fafb;
                    --text-secondary: #9ca3af;
                }
                
                .pr-image {
                    width: 100%;
                    height: 200px;
                    object-fit: cover;
                    background: #f3f4f6;
                }
                
                .pr-content {
                    padding: 16px;
                }
                
                .pr-title {
                    margin: 0 0 8px 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--text-color, #111827);
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .pr-summary {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    color: var(--text-secondary, #6b7280);
                    line-height: 1.5;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                
                .pr-meta {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 12px;
                    color: var(--text-secondary, #6b7280);
                }
                
                .pr-source {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .pr-source-icon {
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                }
                
                .pr-badge {
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: 500;
                }
                
                .loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 200px;
                    color: var(--text-secondary, #6b7280);
                }
                
                .spinner {
                    width: 24px;
                    height: 24px;
                    border: 2px solid #e5e7eb;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
            
            <div class="pr-card ${theme}">
                <div class="loading">
                    <div class="spinner"></div>
                </div>
            </div>
        `;
    }
    
    async loadPRContent() {
        const prId = this.getAttribute('pr-id');
        if (!prId) return;
        
        try {
            const response = await fetch(`https://press.coindaily.online/api/press/prs/${prId}`);
            if (!response.ok) throw new Error('Failed to load PR');
            
            const data = await response.json();
            this.prData = data;
            this.renderContent(data);
        } catch (error) {
            this.renderError(error.message);
        }
    }
    
    renderContent(data) {
        const theme = this.getAttribute('theme') || 'light';
        const card = this.shadowRoot.querySelector('.pr-card');
        
        card.innerHTML = `
            ${data.image ? `<img class="pr-image" src="${data.image}" alt="${data.title}" loading="lazy">` : ''}
            <div class="pr-content">
                <h3 class="pr-title">${this.escapeHtml(data.title)}</h3>
                <p class="pr-summary">${this.escapeHtml(data.summary || '')}</p>
                <div class="pr-meta">
                    <div class="pr-source">
                        ${data.sourceFavicon ? `<img class="pr-source-icon" src="${data.sourceFavicon}" alt="">` : ''}
                        <span>${this.escapeHtml(data.sourceName || 'SENDPRESS')}</span>
                    </div>
                    <span class="pr-badge">Sponsored</span>
                </div>
            </div>
        `;
        
        card.onclick = () => {
            this.trackClick();
            if (data.url) {
                window.open(data.url, '_blank', 'noopener');
            }
        };
    }
    
    renderError(message) {
        const card = this.shadowRoot.querySelector('.pr-card');
        card.innerHTML = `
            <div class="pr-content">
                <p class="pr-summary">Unable to load content</p>
            </div>
        `;
    }
    
    updateTheme(theme) {
        const card = this.shadowRoot.querySelector('.pr-card');
        if (card) {
            card.className = `pr-card ${theme}`;
        }
    }
    
    trackClick() {
        const prId = this.getAttribute('pr-id');
        if (window.Coindaily && prId) {
            window.Coindaily.trackMetric?.('click', { prId });
        }
        
        this.dispatchEvent(new CustomEvent('pr-click', {
            bubbles: true,
            detail: { prId, prData: this.prData }
        }));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PRCard };
}
if (typeof window !== 'undefined') {
    window.PRCard = PRCard;
}

export { PRCard };
export default PRCard;
