// Camada de Aplicação - Port de Logger (Interface)
// Define o contrato para serviços de logging

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface ILogger {
  /**
   * Log de debug (desenvolvimento)
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Log informativo
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log de warning
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log de erro
   */
  error(message: string, error?: Error, context?: LogContext): void;

  /**
   * Cria logger com contexto fixo
   */
  child(context: LogContext): ILogger;
}
