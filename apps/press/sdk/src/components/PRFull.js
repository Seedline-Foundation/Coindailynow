/**
 * PR Full Web Component
 * Displays complete PR article content on dedicated page
 */
class PRFull extends HTMLElement {
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
                
                .pr-full {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 24px;
                    background: var(--bg-color, #ffffff);
                    color: var(--text-color, #111827);
                }
                
                .pr-full.dark {
                    --bg-color: #1f2937;
                    --text-color: #f9fafb;
                    --text-secondary: #9ca3af;
                    --border-color: #374151;
                }
                
                .pr-header {
                    margin-bottom: 24px;
                }
                
                .pr-badge {
                    display: inline-block;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 500;
                    margin-bottom: 16px;
                }
                
                .pr-title {
                    margin: 0 0 16px 0;
                    font-size: 32px;
                    font-weight: 700;
                    line-height: 1.3;
                    color: var(--text-color, #111827);
                }
                
                .pr-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    font-size: 14px;
                    color: var(--text-secondary, #6b7280);
                    padding-bottom: 16px;
                    border-bottom: 1px solid var(--border-color, #e5e7eb);
                }
                
                .pr-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                
                .pr-source-icon {
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                }
                
                .pr-image {
                    width: 100%;
                    max-height: 400px;
                    object-fit: cover;
                    border-radius: 12px;
                    margin: 24px 0;
                }
                
                .pr-content {
                    font-size: 18px;
                    line-height: 1.8;
                    color: var(--text-color, #111827);
                }
                
                .pr-content p {
                    margin: 0 0 20px 0;
                }
                
                .pr-content h2 {
                    margin: 32px 0 16px 0;
                    font-size: 24px;
                    font-weight: 600;
                }
                
                .pr-content h3 {
                    margin: 24px 0 12px 0;
                    font-size: 20px;
                    font-weight: 600;
                }
                
                .pr-content a {
                    color: #3b82f6;
                    text-decoration: underline;
                }
                
                .pr-content img {
                    max-width: 100%;
                    border-radius: 8px;
                    margin: 16px 0;
                }
                
                .pr-content blockquote {
                    margin: 24px 0;
                    padding: 16px 24px;
                    border-left: 4px solid #3b82f6;
                    background: var(--quote-bg, #f3f4f6);
                    font-style: italic;
                }
                
                .pr-footer {
                    margin-top: 32px;
                    padding-top: 24px;
                    border-top: 1px solid var(--border-color, #e5e7eb);
                }
                
                .pr-cta {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 500;
                    text-decoration: none;
                    transition: opacity 0.2s;
                }
                
                .pr-cta:hover {
                    opacity: 0.9;
                }
                
                .pr-disclaimer {
                    margin-top: 24px;
                    padding: 16px;
                    background: var(--disclaimer-bg, #f9fafb);
                    border-radius: 8px;
                    font-size: 12px;
                    color: var(--text-secondary, #6b7280);
                }
                
                .loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 300px;
                    color: var(--text-secondary, #6b7280);
                    gap: 16px;
                }
                
                .spinner {
                    width: 32px;
                    height: 32px;
                    border: 3px solid #e5e7eb;
                    border-top-color: #3b82f6;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                
                @media (max-width: 640px) {
                    .pr-full {
                        padding: 16px;
                    }
                    
                    .pr-title {
                        font-size: 24px;
                    }
                    
                    .pr-content {
                        font-size: 16px;
                    }
                }
            </style>
            
            <article class="pr-full ${theme}">
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Loading press release...</span>
                </div>
            </article>
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
            this.trackImpression();
        } catch (error) {
            this.renderError(error.message);
        }
    }
    
    renderContent(data) {
        const theme = this.getAttribute('theme') || 'light';
        const article = this.shadowRoot.querySelector('.pr-full');
        
        const publishedDate = data.publishedAt 
            ? new Date(data.publishedAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })
            : '';
        
        article.innerHTML = `
            <header class="pr-header">
                <span class="pr-badge">Press Release</span>
                <h1 class="pr-title">${this.escapeHtml(data.title)}</h1>
                <div class="pr-meta">
                    <div class="pr-meta-item">
                        ${data.sourceFavicon ? `<img class="pr-source-icon" src="${data.sourceFavicon}" alt="">` : ''}
                        <span>${this.escapeHtml(data.sourceName || 'SENDPRESS')}</span>
                    </div>
                    ${publishedDate ? `<div class="pr-meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span>${publishedDate}</span>
                    </div>` : ''}
                    ${data.wordCount ? `<div class="pr-meta-item">
                        <span>${data.wordCount} words</span>
                    </div>` : ''}
                </div>
            </header>
            
            ${data.image ? `<img class="pr-image" src="${data.image}" alt="${this.escapeHtml(data.title)}" loading="lazy">` : ''}
            
            <div class="pr-content">
                ${data.content || data.summary || ''}
            </div>
            
            <footer class="pr-footer">
                ${data.ctaUrl ? `<a href="${data.ctaUrl}" class="pr-cta" target="_blank" rel="noopener">
                    ${this.escapeHtml(data.ctaText || 'Learn More')}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="7" y1="17" x2="17" y2="7"></line>
                        <polyline points="7,7 17,7 17,17"></polyline>
                    </svg>
                </a>` : ''}
                
                <div class="pr-disclaimer">
                    <strong>Disclaimer:</strong> This is a sponsored press release distributed via SENDPRESS by Coindaily. 
                    The views and opinions expressed in this article are those of the authors and do not necessarily 
                    reflect the official policy or position of Coindaily or any of its affiliates.
                </div>
            </footer>
        `;
    }
    
    renderError(message) {
        const article = this.shadowRoot.querySelector('.pr-full');
        article.innerHTML = `
            <div class="loading">
                <p>Unable to load press release</p>
                <p style="font-size: 14px;">${this.escapeHtml(message)}</p>
            </div>
        `;
    }
    
    updateTheme(theme) {
        const article = this.shadowRoot.querySelector('.pr-full');
        if (article) {
            article.className = `pr-full ${theme}`;
        }
    }
    
    trackImpression() {
        const prId = this.getAttribute('pr-id');
        if (window.Coindaily && prId) {
            window.Coindaily.trackMetric?.('full_view', { prId });
        }
        
        this.dispatchEvent(new CustomEvent('pr-view', {
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

/**
 * PR Container Web Component
 * Container for multiple PR cards
 */
class PRContainer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }
    
    render() {
        const columns = this.getAttribute('columns') || '3';
        const gap = this.getAttribute('gap') || '24';
        
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                
                .pr-container {
                    display: grid;
                    grid-template-columns: repeat(${columns}, 1fr);
                    gap: ${gap}px;
                }
                
                @media (max-width: 1024px) {
                    .pr-container {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                
                @media (max-width: 640px) {
                    .pr-container {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
            
            <div class="pr-container">
                <slot></slot>
            </div>
        `;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PRFull, PRContainer };
}
if (typeof window !== 'undefined') {
    window.PRFull = PRFull;
    window.PRContainer = PRContainer;
}

export { PRFull, PRContainer };
export default PRFull;
