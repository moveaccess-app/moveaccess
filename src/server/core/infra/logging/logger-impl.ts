// Infrastructure Layer - Logger Implementation
// Implementação concreta do port ILogger usando console

import { singleton } from 'tsyringe';
import type { ILogger, LogLevel, LogContext } from '@/server/core/application/ports/logger';

@singleton()
export class LoggerImpl implements ILogger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const timestamp = new Date().toISOString();
    const mergedContext = { ...this.context, ...context };
    
    const logData = {
      timestamp,
      level,
      message,
      ...(Object.keys(mergedContext).length > 0 && { context: mergedContext }),
      ...(error && { 
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    const formattedLog = JSON.stringify(logData, null, 2);

    switch (level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
        console.error(formattedLog);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }

  child(context: LogContext): ILogger {
    return new LoggerImpl({ ...this.context, ...context });
  }
}
