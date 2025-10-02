import { LogEntry, LogLevel } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Simple logger utility for MCP server (without external dependencies)
 */
export class Logger {
  private logs: LogEntry[] = [];
  private maxLogsInMemory = 1000;
  private logLevel: LogLevel;
  private logDir = 'logs';

  constructor(logLevel: LogLevel = 'info') {
    this.logLevel = logLevel;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private writeToFile(level: LogLevel, message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const logLine = `${timestamp} [${level.toUpperCase()}] ${message}${
      context ? ` ${JSON.stringify(context)}` : ''
    }\n`;
    
    const filename = level === 'error' ? 'error.log' : 'combined.log';
    const filepath = path.join(this.logDir, filename);
    
    try {
      fs.appendFileSync(filepath, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private addLogEntry(level: LogLevel, message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogsInMemory entries
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    // Write to file
    this.writeToFile(level, message, context);

    // Console output with colors
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m'  // red
    };
    const reset = '\x1b[0m';
    
    if (this.shouldLog(level)) {
      console.log(`${colors[level]}[${level.toUpperCase()}]${reset} ${message}`, context || '');
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }

  debug(message: string, context?: Record<string, any>): void {
    this.addLogEntry('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.addLogEntry('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.addLogEntry('warn', message, context);
  }

  error(message: string, error?: Error | Record<string, any>): void {
    const context = error instanceof Error 
      ? { error: error.message, stack: error.stack }
      : error;
    
    this.addLogEntry('error', message, context);
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Performance logging
  startTimer(label: string): () => void {
    const start = Date.now();
    this.debug(`Timer started: ${label}`);
    
    return () => {
      const duration = Date.now() - start;
      this.info(`Timer completed: ${label}`, { duration: `${duration}ms` });
    };
  }

  // Request logging
  logRequest(method: string, params: any, requestId: string): void {
    this.debug(`Request received`, {
      method,
      requestId,
      params: typeof params === 'object' ? JSON.stringify(params).substring(0, 200) : params
    });
  }

  logResponse(method: string, result: any, requestId: string, duration: number): void {
    this.debug(`Response sent`, {
      method,
      requestId,
      duration: `${duration}ms`,
      resultType: typeof result
    });
  }

  logError(method: string, error: Error, requestId: string): void {
    this.error(`Request failed`, {
      method,
      requestId,
      error: error.message,
      stack: error.stack
    });
  }
}

// Singleton instance
export const logger = new Logger();
