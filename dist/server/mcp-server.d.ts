import { MCPTool, PluginConfig, ServerStatus } from '../types/index.js';
/**
 * MCP Server implementation for Cline for Cherry Studio
 */
export declare class MCPServer {
    private app;
    private server;
    private tools;
    private config;
    private startTime;
    private requestCount;
    private errorCount;
    constructor(config: PluginConfig);
    private setupMiddleware;
    private setupRoutes;
    private handleRequest;
    private isValidRequest;
    private handleInitialize;
    private handleToolsList;
    private handleToolsCall;
    private getCapabilities;
    /**
     * Register a new tool
     */
    registerTool(tool: MCPTool): void;
    /**
     * Unregister a tool
     */
    unregisterTool(name: string): boolean;
    /**
     * Start the MCP server
     */
    start(): Promise<void>;
    /**
     * Stop the MCP server
     */
    stop(): Promise<void>;
    /**
     * Get server status
     */
    getStatus(): ServerStatus;
    /**
     * Get registered tools
     */
    getTools(): MCPTool[];
}
//# sourceMappingURL=mcp-server.d.ts.map