/**
 * AI System Integration Module
 * Provides proper module resolution for AI orchestrator components from backend project
 */

export { default as Redis } from 'ioredis';
export { createLogger, Logger, transports, format } from 'winston';
export { EventEmitter } from 'events';