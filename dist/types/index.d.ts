/**
 * Core type definitions for Cline for Cherry Studio MCP server
 */
export interface PluginConfig {
    server: {
        port: number;
        host: string;
        autoStart: boolean;
    };
    tools: {
        file: {
            enabled: boolean;
            allowedExtensions: string[];
            maxFileSize: number;
        };
        shell: {
            enabled: boolean;
            allowedCommands: string[];
            timeout: number;
        };
        edit: {
            enabled: boolean;
            createBackup: boolean;
        };
    };
    ui: {
        theme: 'light' | 'dark' | 'auto';
        fontSize: number;
        showLineNumbers: boolean;
    };
    security: {
        workspaceRestriction: boolean;
        allowedPaths: string[];
        blockedPaths: string[];
    };
}
export interface MCPServerInfo {
    name: string;
    version: string;
    description: string;
    capabilities: string[];
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    handler: (input: any) => Promise<any>;
}
export interface MCPRequest {
    jsonrpc: '2.0';
    id: string | number;
    method: string;
    params?: any;
}
export interface MCPResponse {
    jsonrpc: '2.0';
    id: string | number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}
export interface FileOperation {
    path: string;
    content?: string;
    encoding?: string;
}
export interface ShellCommand {
    command: string;
    args?: string[];
    cwd?: string;
    timeout?: number;
}
export interface ServerStatus {
    running: boolean;
    port: number;
    uptime: number;
    requestCount: number;
    errorCount: number;
}
export interface ToolExecutionContext {
    requestId: string;
    timestamp: Date;
    workspaceRoot: string;
    userAgent?: string;
}
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: Date;
    context?: Record<string, any> | undefined;
}
export declare class MCPError extends Error {
    code: number;
    data?: any | undefined;
    constructor(code: number, message: string, data?: any | undefined);
}
export declare class ValidationError extends MCPError {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
export declare class SecurityError extends MCPError {
    path?: string | undefined;
    constructor(message: string, path?: string | undefined);
}
export declare class FileNotFoundError extends MCPError {
    constructor(path: string);
}
export declare class PermissionError extends MCPError {
    constructor(operation: string, path: string);
}
//# sourceMappingURL=index.d.ts.map