import { LogEntry, LogLevel } from '../types/index.js';
/**
 * Simple logger utility for MCP server (without external dependencies)
 */
export declare class Logger {
    private logs;
    private maxLogsInMemory;
    private logLevel;
    private logDir;
    constructor(logLevel?: LogLevel);
    private ensureLogDirectory;
    private writeToFile;
    private addLogEntry;
    private shouldLog;
    debug(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    error(message: string, error?: Error | Record<string, any>): void;
    getRecentLogs(count?: number): LogEntry[];
    getLogsByLevel(level: LogLevel): LogEntry[];
    clearLogs(): void;
    setLogLevel(level: LogLevel): void;
    startTimer(label: string): () => void;
    logRequest(method: string, params: any, requestId: string): void;
    logResponse(method: string, result: any, requestId: string, duration: number): void;
    logError(method: string, error: Error, requestId: string): void;
}
export declare const logger: Logger;
//# sourceMappingURL=logger.d.ts.map