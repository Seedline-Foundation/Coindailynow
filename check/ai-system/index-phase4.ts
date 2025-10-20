// AI System Phase 4 - Complete Integration
// Brings together all Phase 4 components: real-time monitoring, human approval workflows, and agent configuration

export { AIManagementConsole, aiManagementConsole } from './management/ai-management-console';
export type { 
  AIAgentStatus, 
  SystemMetrics, 
  ContentApprovalItem, 
  WorkflowRule, 
  AgentConfiguration, 
  PerformanceAlert 
} from './management/ai-management-console';

export { phase4Examples } from './examples/phase4-examples';

// Re-export everything from previous phases for complete AI system access
export { aiOrchestrator } from './orchestrator/central-ai-orchestrator';
export { advancedMarketAnalysisAgent } from './agents/analysis/advanced-market-analysis-agent';

// Phase 4 main export - AI Management Console with complete functionality
export class Phase4AISystem {
  static async initialize() {
    const { aiManagementConsole } = await import('./management/ai-management-console');
    await aiManagementConsole.initialize();
    await aiManagementConsole.startRealtimeMonitoring();
    return aiManagementConsole;
  }

  static async getDashboard() {
    const { aiManagementConsole } = await import('./management/ai-management-console');
    return await aiManagementConsole.getDashboardData();
  }

  static async runCompleteDemo() {
    const { demonstrateCompletePhase4Workflow } = await import('./examples/phase4-examples');
    return await demonstrateCompletePhase4Workflow();
  }
}

export default Phase4AISystem;
