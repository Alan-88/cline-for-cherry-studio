"use strict";
/**
 * Main entry point for Cline for Cherry Studio MCP Server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinePlugin = void 0;
exports.getPlugin = getPlugin;
exports.initializePlugin = initializePlugin;
const mcp_server_1 = require("./server/mcp-server");
const config_1 = require("./utils/config");
const logger_1 = require("./utils/logger");
const basic_tools_1 = require("./tools/basic-tools");
const file_tools_1 = require("./tools/file-tools");
const shell_tools_1 = require("./tools/shell-tools");
/**
 * Main plugin class
 */
class ClinePlugin {
    server = null;
    isStarting = false;
    isStopping = false;
    constructor() {
        this.setupErrorHandling();
        this.setupGracefulShutdown();
    }
    /**
     * Initialize the plugin
     */
    async initialize() {
        try {
            logger_1.logger.info('Initializing Cline for Cherry Studio plugin...');
            // Validate configuration
            const validation = config_1.configManager.validateConfig();
            if (!validation.valid) {
                throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
            }
            const config = config_1.configManager.getConfig();
            logger_1.logger.info('Configuration loaded and validated', {
                port: config.server.port,
                host: config.server.host,
                autoStart: config.server.autoStart
            });
            // Create MCP server
            this.server = new mcp_server_1.MCPServer(config);
            // Register basic tools
            await this.registerBasicTools();
            // Auto-start if configured
            if (config.server.autoStart) {
                await this.start();
            }
            logger_1.logger.info('Plugin initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize plugin', error);
            throw error;
        }
    }
    /**
     * Start the MCP server
     */
    async start() {
        if (this.isStarting) {
            logger_1.logger.warn('Server is already starting...');
            return;
        }
        if (this.server?.getStatus().running) {
            logger_1.logger.warn('Server is already running');
            return;
        }
        this.isStarting = true;
        try {
            if (!this.server) {
                throw new Error('Server not initialized. Call initialize() first.');
            }
            await this.server.start();
            logger_1.logger.info('MCP server started successfully');
            // Log server info
            const status = this.server.getStatus();
            logger_1.logger.info('Server status', {
                running: status.running,
                port: status.port,
                uptime: `${status.uptime}ms`
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to start MCP server', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
        finally {
            this.isStarting = false;
        }
    }
    /**
     * Stop the MCP server
     */
    async stop() {
        if (this.isStopping) {
            logger_1.logger.warn('Server is already stopping...');
            return;
        }
        if (!this.server?.getStatus().running) {
            logger_1.logger.warn('Server is not running');
            return;
        }
        this.isStopping = true;
        try {
            if (!this.server) {
                logger_1.logger.warn('No server to stop');
                return;
            }
            await this.server.stop();
            logger_1.logger.info('MCP server stopped successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to stop MCP server', error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
        finally {
            this.isStopping = false;
        }
    }
    /**
     * Get server status
     */
    getStatus() {
        if (!this.server) {
            return {
                running: false,
                port: 0,
                uptime: 0,
                requestCount: 0,
                errorCount: 0,
                message: 'Server not initialized'
            };
        }
        const status = this.server.getStatus();
        return {
            ...status,
            uptime: `${status.uptime}ms`,
            isStarting: this.isStarting,
            isStopping: this.isStopping
        };
    }
    /**
     * Get configuration
     */
    getConfig() {
        return config_1.configManager.getConfig();
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        config_1.configManager.updateConfig(updates);
        logger_1.logger.info('Configuration updated', updates);
    }
    /**
     * Get recent logs
     */
    getRecentLogs(count = 50) {
        return logger_1.logger.getRecentLogs(count);
    }
    /**
     * Register all tools
     */
    async registerBasicTools() {
        if (!this.server) {
            throw new Error('Server not initialized');
        }
        // Register basic tools
        for (const tool of basic_tools_1.basicTools) {
            this.server.registerTool(tool);
        }
        // Register file tools
        for (const tool of file_tools_1.fileTools) {
            this.server.registerTool(tool);
        }
        // Register shell tools
        for (const tool of shell_tools_1.shellTools) {
            this.server.registerTool(tool);
        }
        const totalTools = basic_tools_1.basicTools.length + file_tools_1.fileTools.length + shell_tools_1.shellTools.length;
        logger_1.logger.info(`All tools registered successfully`, {
            basicTools: basic_tools_1.basicTools.length,
            fileTools: file_tools_1.fileTools.length,
            shellTools: shell_tools_1.shellTools.length,
            total: totalTools
        });
    }
    /**
     * Setup error handling
     */
    setupErrorHandling() {
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught exception', error);
            this.gracefulShutdown('SIGTERM');
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled rejection', { reason, promise });
        });
    }
    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
        signals.forEach((signal) => {
            process.on(signal, () => {
                logger_1.logger.info(`Received ${signal}, starting graceful shutdown...`);
                this.gracefulShutdown(signal);
            });
        });
    }
    /**
     * Graceful shutdown handler
     */
    async gracefulShutdown(signal) {
        try {
            logger_1.logger.info(`Graceful shutdown initiated by ${signal}`);
            if (this.server?.getStatus().running) {
                await this.stop();
            }
            logger_1.logger.info('Graceful shutdown completed');
            process.exit(0);
        }
        catch (error) {
            logger_1.logger.error('Error during graceful shutdown', error instanceof Error ? error : new Error(String(error)));
            process.exit(1);
        }
    }
}
exports.ClinePlugin = ClinePlugin;
/**
 * Plugin instance (singleton)
 */
let pluginInstance = null;
/**
 * Get or create plugin instance
 */
function getPlugin() {
    if (!pluginInstance) {
        pluginInstance = new ClinePlugin();
    }
    return pluginInstance;
}
/**
 * Initialize plugin (for direct usage)
 */
async function initializePlugin() {
    const plugin = getPlugin();
    await plugin.initialize();
    return plugin;
}
// Auto-initialize if this module is run directly
if (require.main === module) {
    initializePlugin()
        .then(() => {
        logger_1.logger.info('Plugin started successfully');
        logger_1.logger.info('MCP server is running and ready to accept connections');
        logger_1.logger.info('Test with: curl http://localhost:3001/health');
    })
        .catch((error) => {
        logger_1.logger.error('Failed to start plugin', error);
        process.exit(1);
    });
}
//# sourceMappingURL=index.js.map