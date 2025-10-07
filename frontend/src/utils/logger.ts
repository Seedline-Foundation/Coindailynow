/**
 * Logger Utility
 * Task 22: Centralized logging for market data dashboard
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
      case 'debug':
        if (this.isDevelopment) {
          console.debug(prefix, message, ...args);
        }
        break;
    }
  }

  info(message: string, ...args: any[]): void {
    this.formatMessage('info', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.formatMessage('error', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.formatMessage('debug', message, ...args);
  }
}

export const logger = new Logger();