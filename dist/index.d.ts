/**
 * Main entry point for Cline for Cherry Studio MCP Server
 */
/**
 * Main plugin class
 */
export declare class ClinePlugin {
    private server;
    private isStarting;
    private isStopping;
    constructor();
    /**
     * Initialize the plugin
     */
    initialize(): Promise<void>;
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
    getStatus(): {
        running: boolean;
        port: number;
        uptime: number;
        requestCount: number;
        errorCount: number;
        message: string;
    } | {
        uptime: string;
        isStarting: boolean;
        isStopping: boolean;
        running: boolean;
        port: number;
        requestCount: number;
        errorCount: number;
        message?: never;
    };
    /**
     * Get configuration
     */
    getConfig(): import("./types").PluginConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: any): void;
    /**
     * Get recent logs
     */
    getRecentLogs(count?: number): import("./types").LogEntry[];
    /**
     * Register all tools
     */
    private registerBasicTools;
    /**
     * Setup error handling
     */
    private setupErrorHandling;
    /**
     * Setup graceful shutdown
     */
    private setupGracefulShutdown;
    /**
     * Graceful shutdown handler
     */
    private gracefulShutdown;
}
/**
 * Get or create plugin instance
 */
export declare function getPlugin(): ClinePlugin;
/**
 * Initialize plugin (for direct usage)
 */
export declare function initializePlugin(): Promise<ClinePlugin>;
//# sourceMappingURL=index.d.ts.map