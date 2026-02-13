"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorEventType = exports.MessageType = exports.TaskPriority = exports.TaskStatus = exports.AgentStatus = exports.AgentType = void 0;
var AgentType;
(function (AgentType) {
    AgentType["CONTENT_GENERATION"] = "content_generation";
    AgentType["MARKET_ANALYSIS"] = "market_analysis";
    AgentType["QUALITY_REVIEW"] = "quality_review";
    AgentType["TRANSLATION"] = "translation";
    AgentType["SENTIMENT_ANALYSIS"] = "sentiment_analysis";
    AgentType["MODERATION"] = "moderation";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["MAINTENANCE"] = "maintenance";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["QUEUED"] = "queued";
    TaskStatus["PROCESSING"] = "processing";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
    TaskStatus["RETRY"] = "retry";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["NORMAL"] = "normal";
    TaskPriority["HIGH"] = "high";
    TaskPriority["URGENT"] = "urgent";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var MessageType;
(function (MessageType) {
    MessageType["TASK_ASSIGNMENT"] = "task_assignment";
    MessageType["TASK_UPDATE"] = "task_update";
    MessageType["TASK_COMPLETE"] = "task_complete";
    MessageType["TASK_FAILED"] = "task_failed";
    MessageType["HEARTBEAT"] = "heartbeat";
    MessageType["HEALTH_CHECK"] = "health_check";
    MessageType["SHUTDOWN"] = "shutdown";
})(MessageType || (exports.MessageType = MessageType = {}));
var OrchestratorEventType;
(function (OrchestratorEventType) {
    OrchestratorEventType["AGENT_REGISTERED"] = "agent_registered";
    OrchestratorEventType["AGENT_DISCONNECTED"] = "agent_disconnected";
    OrchestratorEventType["AGENT_HEALTH_CHANGED"] = "agent_health_changed";
    OrchestratorEventType["TASK_QUEUED"] = "task_queued";
    OrchestratorEventType["TASK_STARTED"] = "task_started";
    OrchestratorEventType["TASK_COMPLETED"] = "task_completed";
    OrchestratorEventType["TASK_FAILED"] = "task_failed";
    OrchestratorEventType["QUEUE_OVERFLOW"] = "queue_overflow";
    OrchestratorEventType["PERFORMANCE_THRESHOLD_EXCEEDED"] = "performance_threshold_exceeded";
})(OrchestratorEventType || (exports.OrchestratorEventType = OrchestratorEventType = {}));
//# sourceMappingURL=index.js.map