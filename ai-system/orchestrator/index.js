"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIAgentOrchestrator = void 0;
const dependencies_1 = require("../../backend/src/ai/dependencies");
const events_1 = require("events");
const types_1 = require("../types");
class AIAgentOrchestrator extends events_1.EventEmitter {
    config;
    logger;
    redis;
    agents;
    tasks;
    queues;
    deadLetterQueues;
    activeAssignments;
    circuitBreakers;
    running = false;
    healthCheckInterval;
    metricsInterval;
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger;
        this.redis = new dependencies_1.Redis(config.redis);
        this.agents = new Map();
        this.tasks = new Map();
        this.queues = new Map();
        this.deadLetterQueues = new Map();
        this.activeAssignments = new Map();
        this.circuitBreakers = new Map();
        Object.values(types_1.AgentType).forEach(agentType => {
            this.queues.set(agentType, []);
            this.deadLetterQueues.set(agentType, []);
            if (config.performance.enableCircuitBreaker) {
                this.circuitBreakers.set(agentType, new CircuitBreaker({
                    errorThreshold: 5,
                    timeoutMs: config.performance.maxResponseTimeMs,
                    resetTimeoutMs: 30000
                }));
            }
        });
        this.setupEventHandlers();
    }
    async start() {
        try {
            this.logger.info('Starting AI Agent Orchestrator...');
            await this.redis.ping();
            this.logger.info('Redis connection established');
            this.healthCheckInterval = setInterval(() => {
                this.performHealthChecks();
            }, 30000);
            this.metricsInterval = setInterval(() => {
                this.collectMetrics();
            }, this.config.monitoring.metricsInterval);
            this.running = true;
            this.emit('orchestratorStarted');
            this.logger.info('AI Agent Orchestrator started successfully');
        }
        catch (error) {
            this.logger.error('Failed to start AI Agent Orchestrator:', error);
            throw error;
        }
    }
    async shutdown() {
        try {
            this.logger.info('Shutting down AI Agent Orchestrator...');
            this.running = false;
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
            }
            if (this.metricsInterval) {
                clearInterval(this.metricsInterval);
            }
            const shutdownMessage = {
                id: `shutdown-${Date.now()}`,
                from: 'orchestrator',
                to: 'all',
                type: types_1.MessageType.SHUTDOWN,
                payload: { reason: 'graceful_shutdown' },
                timestamp: new Date()
            };
            await this.broadcastMessage(shutdownMessage);
            await this.redis.quit();
            this.emit('orchestratorShutdown');
            this.logger.info('AI Agent Orchestrator shut down successfully');
        }
        catch (error) {
            this.logger.error('Error during orchestrator shutdown:', error);
            throw error;
        }
    }
    isRunning() {
        return this.running;
    }
    async registerAgent(agent) {
        try {
            this.agents.set(agent.id, agent);
            await this.redis.hset('agents', agent.id, JSON.stringify(agent));
            this.logger.info(`Agent registered: ${agent.id} (${agent.type})`);
            this.emitEvent({
                type: types_1.OrchestratorEventType.AGENT_REGISTERED,
                timestamp: new Date(),
                data: { agentId: agent.id, agentType: agent.type },
                severity: 'info'
            });
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to register agent ${agent.id}:`, error);
            return false;
        }
    }
    async unregisterAgent(agentId) {
        try {
            const agent = this.agents.get(agentId);
            if (!agent) {
                return false;
            }
            await this.reassignAgentTasks(agentId);
            this.agents.delete(agentId);
            await this.redis.hdel('agents', agentId);
            this.logger.info(`Agent unregistered: ${agentId}`);
            this.emitEvent({
                type: types_1.OrchestratorEventType.AGENT_DISCONNECTED,
                timestamp: new Date(),
                data: { agentId, agentType: agent.type },
                severity: 'warning'
            });
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to unregister agent ${agentId}:`, error);
            return false;
        }
    }
    async getAgent(agentId) {
        return this.agents.get(agentId) || null;
    }
    async updateAgentHeartbeat(agentId, timestamp) {
        const agent = this.agents.get(agentId);
        if (agent) {
            agent.lastHeartbeat = timestamp;
            this.agents.set(agentId, agent);
            await this.redis.hset('agents', agentId, JSON.stringify(agent));
        }
    }
    async getOfflineAgents() {
        const offlineThreshold = 5 * 60 * 1000;
        const now = Date.now();
        return Array.from(this.agents.values()).filter(agent => {
            return (now - agent.lastHeartbeat.getTime()) > offlineThreshold;
        });
    }
    async queueTask(task) {
        try {
            if (!this.validateTask(task)) {
                throw new Error('Invalid task format');
            }
            const queue = this.queues.get(task.type);
            const queueConfig = this.config.queues[task.type];
            if (queue && queue.length >= queueConfig.maxSize) {
                await this.triggerAlert(`Queue size limit exceeded for ${task.type}`, 'error', { agentType: task.type, queueSize: queue.length, limit: queueConfig.maxSize });
                this.emitEvent({
                    type: types_1.OrchestratorEventType.QUEUE_OVERFLOW,
                    timestamp: new Date(),
                    data: { agentType: task.type, queueSize: queue.length },
                    severity: 'error'
                });
                throw new Error('Queue size limit exceeded');
            }
            task.status = types_1.TaskStatus.QUEUED;
            task.metadata.updatedAt = new Date();
            this.tasks.set(task.id, task);
            this.insertTaskByPriority(task);
            await this.redis.hset('tasks', task.id, JSON.stringify(task));
            this.logger.info(`Task queued: ${task.id} (${task.type}, priority: ${task.priority})`);
            this.emitEvent({
                type: types_1.OrchestratorEventType.TASK_QUEUED,
                timestamp: new Date(),
                data: { taskId: task.id, agentType: task.type, priority: task.priority },
                severity: 'info'
            });
            await this.assignTask(task.type);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to queue task ${task.id}:`, error);
            throw error;
        }
    }
    async getTask(taskId) {
        return this.tasks.get(taskId) || null;
    }
    async getNextTask(agentType) {
        const queue = this.queues.get(agentType);
        if (!queue || queue.length === 0) {
            return null;
        }
        return queue[0] || null;
    }
    async assignTask(agentType) {
        try {
            const availableAgent = this.findAvailableAgent(agentType);
            if (!availableAgent) {
                return null;
            }
            const queue = this.queues.get(agentType);
            if (!queue || queue.length === 0) {
                return null;
            }
            const task = queue.shift();
            task.status = types_1.TaskStatus.PROCESSING;
            task.metadata.assignedAgent = availableAgent.id;
            task.metadata.updatedAt = new Date();
            const assignment = {
                agentId: availableAgent.id,
                task,
                assignedAt: new Date()
            };
            availableAgent.status = types_1.AgentStatus.BUSY;
            this.agents.set(availableAgent.id, availableAgent);
            this.activeAssignments.set(task.id, assignment);
            await this.redis.hset('tasks', task.id, JSON.stringify(task));
            await this.redis.hset('agents', availableAgent.id, JSON.stringify(availableAgent));
            this.logger.info(`Task assigned: ${task.id} to agent ${availableAgent.id}`);
            this.emitEvent({
                type: types_1.OrchestratorEventType.TASK_STARTED,
                timestamp: new Date(),
                data: { taskId: task.id, agentId: availableAgent.id },
                severity: 'info'
            });
            const taskMessage = {
                id: `task-${task.id}`,
                from: 'orchestrator',
                to: availableAgent.id,
                type: types_1.MessageType.TASK_ASSIGNMENT,
                payload: task,
                timestamp: new Date()
            };
            await this.sendMessage(taskMessage);
            return assignment;
        }
        catch (error) {
            this.logger.error(`Failed to assign task for ${agentType}:`, error);
            return null;
        }
    }
    async updateTaskStatus(taskId, status, result) {
        try {
            const task = this.tasks.get(taskId);
            if (!task) {
                return false;
            }
            const oldStatus = task.status;
            task.status = status;
            task.metadata.updatedAt = new Date();
            if (result) {
                task.result = result;
            }
            await this.handleStatusChange(task, oldStatus, status);
            this.tasks.set(taskId, task);
            await this.redis.hset('tasks', taskId, JSON.stringify(task));
            this.logger.info(`Task status updated: ${taskId} from ${oldStatus} to ${status}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to update task status ${taskId}:`, error);
            return false;
        }
    }
    async getDeadLetterTasks(agentType) {
        return this.deadLetterQueues.get(agentType) || [];
    }
    async getAgentMetrics(agentId) {
        const agent = this.agents.get(agentId);
        return agent ? agent.metrics : null;
    }
    async getQueueMetrics(agentType) {
        const queue = this.queues.get(agentType) || [];
        const deadLetterQueue = this.deadLetterQueues.get(agentType) || [];
        const allTasks = Array.from(this.tasks.values()).filter(task => task.type === agentType);
        const processingTasks = allTasks.filter(task => task.status === types_1.TaskStatus.PROCESSING);
        const completedTasks = allTasks.filter(task => task.status === types_1.TaskStatus.COMPLETED);
        const failedTasks = allTasks.filter(task => task.status === types_1.TaskStatus.FAILED);
        const completedTasksWithTiming = completedTasks.filter(task => task.result?.metrics?.startTime && task.result?.metrics?.endTime);
        const averageWaitTime = completedTasksWithTiming.length > 0
            ? completedTasksWithTiming.reduce((sum, task) => {
                const start = task.metadata.createdAt.getTime();
                const processing = task.result.metrics.startTime.getTime();
                return sum + (processing - start);
            }, 0) / completedTasksWithTiming.length
            : 0;
        return {
            queueSize: queue.length,
            pendingTasks: queue.length,
            processingTasks: processingTasks.length,
            completedTasks: completedTasks.length,
            failedTasks: failedTasks.length + deadLetterQueue.length,
            averageWaitTime
        };
    }
    async getSystemMetrics() {
        const totalTasks = this.tasks.size;
        const activeTasks = Array.from(this.tasks.values())
            .filter(task => task.status === types_1.TaskStatus.PROCESSING).length;
        const totalAgents = this.agents.size;
        const activeAgents = Array.from(this.agents.values())
            .filter(agent => agent.status !== types_1.AgentStatus.OFFLINE).length;
        const completedTasks = Array.from(this.tasks.values())
            .filter(task => task.status === types_1.TaskStatus.COMPLETED && task.result?.metrics?.processingTimeMs);
        const averageResponseTime = completedTasks.length > 0
            ? completedTasks.reduce((sum, task) => sum + (task.result.metrics.processingTimeMs || 0), 0) / completedTasks.length
            : 0;
        const totalProcessedTasks = Array.from(this.tasks.values())
            .filter(task => task.status === types_1.TaskStatus.COMPLETED || task.status === types_1.TaskStatus.FAILED).length;
        const failedTasks = Array.from(this.tasks.values())
            .filter(task => task.status === types_1.TaskStatus.FAILED).length;
        const errorRate = totalProcessedTasks > 0 ? failedTasks / totalProcessedTasks : 0;
        const queueMetrics = {};
        for (const agentType of Object.values(types_1.AgentType)) {
            queueMetrics[agentType] = await this.getQueueMetrics(agentType);
        }
        return {
            totalTasks,
            activeTasks,
            totalAgents,
            activeAgents,
            averageResponseTime,
            errorRate,
            queueMetrics
        };
    }
    async triggerAlert(message, severity, data) {
        const alert = {
            message,
            severity,
            timestamp: new Date(),
            data
        };
        const logLevel = severity === 'critical' ? 'error' : severity;
        this.logger[logLevel](`ALERT: ${message}`, data);
        this.emitEvent({
            type: types_1.OrchestratorEventType.PERFORMANCE_THRESHOLD_EXCEEDED,
            timestamp: new Date(),
            data: alert,
            severity
        });
        await this.redis.lpush('alerts', JSON.stringify(alert));
        await this.redis.ltrim('alerts', 0, 99);
    }
    setupEventHandlers() {
        this.on('taskCompleted', this.handleTaskCompleted.bind(this));
        this.on('taskFailed', this.handleTaskFailed.bind(this));
        this.on('agentDisconnected', this.handleAgentDisconnected.bind(this));
    }
    validateTask(task) {
        return !!(task.id &&
            task.type &&
            task.priority &&
            task.payload &&
            task.metadata &&
            task.metadata.maxRetries >= 0);
    }
    insertTaskByPriority(task) {
        const queue = this.queues.get(task.type);
        if (!queue)
            return;
        const priorityOrder = {
            [types_1.TaskPriority.URGENT]: 0,
            [types_1.TaskPriority.HIGH]: 1,
            [types_1.TaskPriority.NORMAL]: 2,
            [types_1.TaskPriority.LOW]: 3
        };
        const insertIndex = queue.findIndex(queuedTask => priorityOrder[task.priority] < priorityOrder[queuedTask.priority]);
        if (insertIndex === -1) {
            queue.push(task);
        }
        else {
            queue.splice(insertIndex, 0, task);
        }
    }
    findAvailableAgent(agentType) {
        const availableAgents = Array.from(this.agents.values()).filter(agent => agent.type === agentType &&
            agent.status === types_1.AgentStatus.IDLE &&
            this.isAgentHealthy(agent));
        if (availableAgents.length === 0) {
            return null;
        }
        return availableAgents.reduce((best, current) => current.metrics.averageProcessingTime < best.metrics.averageProcessingTime ? current : best);
    }
    isAgentHealthy(agent) {
        const healthyThreshold = 2 * 60 * 1000;
        const now = Date.now();
        return (now - agent.lastHeartbeat.getTime()) < healthyThreshold;
    }
    async handleStatusChange(task, oldStatus, newStatus) {
        const assignment = this.activeAssignments.get(task.id);
        switch (newStatus) {
            case types_1.TaskStatus.COMPLETED:
                await this.handleTaskCompleted(task, assignment);
                break;
            case types_1.TaskStatus.FAILED:
                await this.handleTaskFailed(task, assignment);
                break;
        }
    }
    async handleTaskCompleted(task, assignment) {
        if (assignment) {
            const agent = this.agents.get(assignment.agentId);
            if (agent) {
                agent.status = types_1.AgentStatus.IDLE;
                agent.metrics.tasksProcessed++;
                agent.metrics.tasksSuccessful++;
                if (task.result?.metrics?.processingTimeMs) {
                    agent.metrics.averageProcessingTime =
                        (agent.metrics.averageProcessingTime * (agent.metrics.tasksProcessed - 1) + task.result.metrics.processingTimeMs) /
                            agent.metrics.tasksProcessed;
                }
                this.agents.set(agent.id, agent);
                await this.redis.hset('agents', agent.id, JSON.stringify(agent));
            }
            this.activeAssignments.delete(task.id);
        }
        this.emitEvent({
            type: types_1.OrchestratorEventType.TASK_COMPLETED,
            timestamp: new Date(),
            data: { taskId: task.id, agentId: assignment?.agentId },
            severity: 'info'
        });
        await this.assignTask(task.type);
    }
    async handleTaskFailed(task, assignment) {
        if (assignment) {
            const agent = this.agents.get(assignment.agentId);
            if (agent) {
                agent.status = types_1.AgentStatus.IDLE;
                agent.metrics.tasksProcessed++;
                agent.metrics.tasksFailed++;
                agent.metrics.lastError = {
                    message: task.result?.error || 'Unknown error',
                    timestamp: new Date(),
                    taskId: task.id
                };
                this.agents.set(agent.id, agent);
                await this.redis.hset('agents', agent.id, JSON.stringify(agent));
            }
            this.activeAssignments.delete(task.id);
        }
        if (task.metadata.retryCount < task.metadata.maxRetries) {
            task.metadata.retryCount++;
            task.status = types_1.TaskStatus.QUEUED;
            task.metadata.assignedAgent = undefined;
            const retryPolicy = this.config.queues[task.type].retryPolicy;
            const delay = this.calculateRetryDelay(retryPolicy, task.metadata.retryCount);
            setTimeout(() => {
                this.insertTaskByPriority(task);
                this.assignTask(task.type);
            }, delay);
            this.logger.info(`Task ${task.id} queued for retry ${task.metadata.retryCount}/${task.metadata.maxRetries}`);
        }
        else {
            const deadLetterQueue = this.deadLetterQueues.get(task.type);
            if (deadLetterQueue) {
                deadLetterQueue.push(task);
            }
            this.logger.error(`Task ${task.id} moved to dead letter queue after ${task.metadata.retryCount} retries`);
        }
        this.emitEvent({
            type: types_1.OrchestratorEventType.TASK_FAILED,
            timestamp: new Date(),
            data: {
                taskId: task.id,
                agentId: assignment?.agentId,
                error: task.result?.error,
                retryCount: task.metadata.retryCount
            },
            severity: task.metadata.retryCount >= task.metadata.maxRetries ? 'error' : 'warning'
        });
        await this.assignTask(task.type);
    }
    calculateRetryDelay(retryPolicy, retryCount) {
        switch (retryPolicy.backoffStrategy) {
            case 'exponential':
                return Math.min(retryPolicy.baseDelayMs * Math.pow(2, retryCount - 1), retryPolicy.maxDelayMs);
            case 'linear':
                return Math.min(retryPolicy.baseDelayMs * retryCount, retryPolicy.maxDelayMs);
            case 'fixed':
            default:
                return retryPolicy.baseDelayMs;
        }
    }
    async reassignAgentTasks(agentId) {
        const assignments = Array.from(this.activeAssignments.entries())
            .filter(([_, assignment]) => assignment.agentId === agentId);
        for (const [taskId, assignment] of assignments) {
            const task = assignment.task;
            task.status = types_1.TaskStatus.QUEUED;
            task.metadata.assignedAgent = undefined;
            this.activeAssignments.delete(taskId);
            this.insertTaskByPriority(task);
            this.logger.info(`Task ${taskId} reassigned due to agent ${agentId} disconnection`);
        }
    }
    async performHealthChecks() {
        const offlineAgents = await this.getOfflineAgents();
        for (const agent of offlineAgents) {
            if (agent.status !== types_1.AgentStatus.OFFLINE) {
                agent.status = types_1.AgentStatus.OFFLINE;
                this.agents.set(agent.id, agent);
                this.emitEvent({
                    type: types_1.OrchestratorEventType.AGENT_HEALTH_CHANGED,
                    timestamp: new Date(),
                    data: { agentId: agent.id, status: types_1.AgentStatus.OFFLINE },
                    severity: 'warning'
                });
                await this.reassignAgentTasks(agent.id);
            }
        }
    }
    async collectMetrics() {
        try {
            const systemMetrics = await this.getSystemMetrics();
            await this.redis.set('system_metrics', JSON.stringify(systemMetrics));
            await this.checkAlertThresholds(systemMetrics);
        }
        catch (error) {
            this.logger.error('Failed to collect metrics:', error);
        }
    }
    async checkAlertThresholds(metrics) {
        const thresholds = this.config.monitoring.alertThresholds;
        for (const [agentType, queueMetrics] of Object.entries(metrics.queueMetrics)) {
            if (queueMetrics.queueSize > thresholds.queueSize) {
                await this.triggerAlert(`Queue size threshold exceeded for ${agentType}`, 'warning', { agentType, queueSize: queueMetrics.queueSize, threshold: thresholds.queueSize });
            }
        }
        if (metrics.errorRate > thresholds.errorRate) {
            await this.triggerAlert('Error rate threshold exceeded', 'error', { errorRate: metrics.errorRate, threshold: thresholds.errorRate });
        }
        if (metrics.averageResponseTime > thresholds.responseTime) {
            await this.triggerAlert('Response time threshold exceeded', 'warning', { responseTime: metrics.averageResponseTime, threshold: thresholds.responseTime });
        }
    }
    async sendMessage(message) {
        await this.redis.lpush(`agent_messages:${message.to}`, JSON.stringify(message));
    }
    async broadcastMessage(message) {
        const agents = Array.from(this.agents.values());
        for (const agent of agents) {
            const agentMessage = { ...message, to: agent.id };
            await this.sendMessage(agentMessage);
        }
    }
    emitEvent(event) {
        this.emit('orchestratorEvent', event);
        this.redis.lpush('orchestrator_events', JSON.stringify(event));
        this.redis.ltrim('orchestrator_events', 0, 999);
    }
    async handleAgentDisconnected(agentId) {
        await this.reassignAgentTasks(agentId);
    }
}
exports.AIAgentOrchestrator = AIAgentOrchestrator;
class CircuitBreaker {
    errorThreshold;
    timeoutMs;
    resetTimeoutMs;
    errorCount = 0;
    state = 'closed';
    lastErrorTime = 0;
    constructor(config) {
        this.errorThreshold = config.errorThreshold;
        this.timeoutMs = config.timeoutMs;
        this.resetTimeoutMs = config.resetTimeoutMs;
    }
    async execute(operation) {
        if (this.state === 'open') {
            if (Date.now() - this.lastErrorTime > this.resetTimeoutMs) {
                this.state = 'half-open';
            }
            else {
                throw new Error('Circuit breaker is OPEN');
            }
        }
        try {
            const result = await Promise.race([
                operation(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timeout')), this.timeoutMs))
            ]);
            if (this.state === 'half-open') {
                this.state = 'closed';
                this.errorCount = 0;
            }
            return result;
        }
        catch (error) {
            this.errorCount++;
            this.lastErrorTime = Date.now();
            if (this.errorCount >= this.errorThreshold) {
                this.state = 'open';
            }
            throw error;
        }
    }
    getState() {
        return this.state;
    }
}
//# sourceMappingURL=index.js.map