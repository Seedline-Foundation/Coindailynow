/**
 * AI System Local Dependencies
 * Self-contained module — no cross-project filesystem imports
 */

export { default as Redis } from 'ioredis';
export { createLogger, Logger, transports, format } from 'winston';
export { EventEmitter } from 'events';
