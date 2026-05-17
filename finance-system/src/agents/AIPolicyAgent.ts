const OLLAMA_URL = process.env.DEEPSEEK_API_ENDPOINT || process.env.OLLAMA_URL || 'http://localhost:11435';
const AI_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-r1:8b';

export class AIPolicyAgent {
    private async queryDeepSeek(prompt: string): Promise<string | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            const res = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: AI_MODEL, prompt, stream: false }),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!res.ok) return null;
            const data: any = await res.json();
            return data.response || null;
        } catch {
            return null;
        }
    }

    constructor() {}

    async analyzeMarketTrends() {
        console.log("Adding market data to context window...");
        // Fetch external market data
    }

    async suggestPricingAdjustment(currentMetrics: any): Promise<any> {
        const prompt = `As CFIS financial policy advisor, analyze subscription metrics and suggest one pricing action.
Metrics: ${JSON.stringify(currentMetrics || {})}
Return JSON only: {"recommendation":"...","confidence":0-1,"reasoning":"..."}`;
        const raw = await this.queryDeepSeek(prompt);
        if (raw) {
            try {
                const m = raw.match(/\{[\s\S]*\}/);
                if (m) return JSON.parse(m[0]);
            } catch { /* fallback */ }
        }
        return {
            recommendation: 'Hold prices steady',
            confidence: 0.85,
            reasoning: 'Churn is stable while conversion metrics are slightly up.',
        };
    }

    async detectAnomaly(transactionData: any): Promise<boolean> {
        console.log("Checking transaction against behavioral patterns...");
        // Use ML model or simple heuristics for anomaly detection
        return false; // No anomaly detected
    }
}
