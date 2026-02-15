/**
 * SENDPRESS AI Agents Entry Point
 * Orchestrates all AI verification agents
 */

import { verificationAgent } from './agents/VerificationAgent';
import { monitoringAgent } from './agents/MonitoringAgent';
import { virusAgent } from './agents/VirusAgent';

export interface AgentConfig {
    verification: {
        enabled: boolean;
        batchSize: number;
    };
    monitoring: {
        enabled: boolean;
        intervalMinutes: number;
    };
    security: {
        enabled: boolean;
        intervalHours: number;
    };
}

const defaultConfig: AgentConfig = {
    verification: {
        enabled: true,
        batchSize: 50
    },
    monitoring: {
        enabled: true,
        intervalMinutes: 30
    },
    security: {
        enabled: true,
        intervalHours: 24
    }
};

class AgentOrchestrator {
    private config: AgentConfig;
    private running: boolean = false;
    
    constructor(config: Partial<AgentConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }
    
    /**
     * Start all agents
     */
    async start(): Promise<void> {
        if (this.running) {
            console.log('[Orchestrator] Agents already running');
            return;
        }
        
        console.log('[Orchestrator] Starting AI agents...');
        this.running = true;
        
        try {
            // Initialize all agents
            await Promise.all([
                verificationAgent.init(),
                monitoringAgent.init(),
                virusAgent.init()
            ]);
            
            // Start continuous monitoring
            if (this.config.monitoring.enabled) {
                monitoringAgent.startContinuousMonitoring(this.config.monitoring.intervalMinutes);
            }
            
            // Start security scanning
            if (this.config.security.enabled) {
                virusAgent.startContinuousScanning(this.config.security.intervalHours);
            }
            
            console.log('[Orchestrator] All agents started');
        } catch (error) {
            console.error('[Orchestrator] Failed to start agents:', error);
            this.running = false;
            throw error;
        }
    }
    
    /**
     * Stop all agents
     */
    async stop(): Promise<void> {
        console.log('[Orchestrator] Stopping agents...');
        
        await Promise.all([
            verificationAgent.close(),
            monitoringAgent.close(),
            virusAgent.close()
        ]);
        
        this.running = false;
        console.log('[Orchestrator] All agents stopped');
    }
    
    /**
     * Run verification batch
     */
    async runVerificationBatch(domains: string[]): Promise<void> {
        if (!this.config.verification.enabled) {
            console.log('[Orchestrator] Verification disabled');
            return;
        }
        
        console.log(`[Orchestrator] Running verification for ${domains.length} domains`);
        await verificationAgent.runBatch(domains);
    }
    
    /**
     * Run security scan on specific site
     */
    async runSecurityScan(siteId: string, domain: string): Promise<void> {
        if (!this.config.security.enabled) {
            console.log('[Orchestrator] Security scanning disabled');
            return;
        }
        
        await virusAgent.scanSite(siteId, domain);
    }
    
    /**
     * Get agent status
     */
    getStatus(): { running: boolean; config: AgentConfig } {
        return {
            running: this.running,
            config: this.config
        };
    }
}

export const agentOrchestrator = new AgentOrchestrator();

// Export individual agents for direct access
export { verificationAgent, monitoringAgent, virusAgent };

// Default export
export default agentOrchestrator;

// CLI entry point
if (require.main === module) {
    console.log('Starting SENDPRESS AI Agent Orchestrator...');
    
    agentOrchestrator.start().catch(error => {
        console.error('Failed to start:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('Shutting down...');
        await agentOrchestrator.stop();
        process.exit(0);
    });
}
