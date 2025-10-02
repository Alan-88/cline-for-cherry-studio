/**
 * Main entry point for Cline for Cherry Studio MCP Server
 */

import { MCPServer } from './server/mcp-server.js';
import { configManager } from './utils/config.js';
import { logger } from './utils/logger.js';

/**
 * Main plugin class
 */
export class ClinePlugin {
  private server: MCPServer | null = null;
  private isStarting = false;
  private isStopping = false;

  constructor() {
    this.setupErrorHandling();
    this.setupGracefulShutdown();
  }

  /**
   * Initialize the plugin
   */
  public async initialize(): Promise<void> {
    try {
      logger.info('Initializing Cline for Cherry Studio plugin...');

      // Validate configuration
      const validation = configManager.validateConfig();
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      const config = configManager.getConfig();
      logger.info('Configuration loaded and validated', {
        port: config.server.port,
        host: config.server.host,
        autoStart: config.server.autoStart
      });

      // Create MCP server
      this.server = new MCPServer(config);

      // Register basic tools
      await this.registerBasicTools();

      // Auto-start if configured
      if (config.server.autoStart) {
        await this.start();
      }

      logger.info('Plugin initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize plugin', error as Error);
      throw error;
    }
  }

  /**
   * Start the MCP server
   */
  public async start(): Promise<void> {
    if (this.isStarting) {
      logger.warn('Server is already starting...');
      return;
    }

    if (this.server?.getStatus().running) {
      logger.warn('Server is already running');
      return;
    }

    this.isStarting = true;

    try {
      if (!this.server) {
        throw new Error('Server not initialized. Call initialize() first.');
      }

      await this.server.start();
      logger.info('MCP server started successfully');

      // Log server info
      const status = this.server.getStatus();
      logger.info('Server status', {
        running: status.running,
        port: status.port,
        uptime: `${status.uptime}ms`
      });

    } catch (error) {
      logger.error('Failed to start MCP server', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Stop the MCP server
   */
  public async stop(): Promise<void> {
    if (this.isStopping) {
      logger.warn('Server is already stopping...');
      return;
    }

    if (!this.server?.getStatus().running) {
      logger.warn('Server is not running');
      return;
    }

    this.isStopping = true;

    try {
      if (!this.server) {
        logger.warn('No server to stop');
        return;
      }

      await this.server.stop();
      logger.info('MCP server stopped successfully');

    } catch (error) {
      logger.error('Failed to stop MCP server', error instanceof Error ? error : new Error(String(error)));
      throw error;
    } finally {
      this.isStopping = false;
    }
  }

  /**
   * Get server status
   */
  public getStatus() {
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
  public getConfig() {
    return configManager.getConfig();
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: any): void {
    configManager.updateConfig(updates);
    logger.info('Configuration updated', updates);
  }

  /**
   * Get recent logs
   */
  public getRecentLogs(count: number = 50) {
    return logger.getRecentLogs(count);
  }

  /**
   * Register basic tools for testing
   */
  private async registerBasicTools(): Promise<void> {
    if (!this.server) {
      throw new Error('Server not initialized');
    }

    // Ping tool
    this.server.registerTool({
      name: 'ping',
      description: 'Simple ping tool to test connectivity',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Optional message to echo back'
          }
        }
      },
      handler: async (input: any) => {
        return {
          status: 'pong',
          timestamp: new Date().toISOString(),
          message: input.message || 'Hello from Cline MCP Server!',
          server: 'Cline for Cherry Studio'
        };
      }
    });

    // Echo tool
    this.server.registerTool({
      name: 'echo',
      description: 'Echo back the input message',
      inputSchema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Message to echo back'
          }
        },
        required: ['message']
      },
      handler: async (input: any) => {
        return {
          echo: input.message,
          timestamp: new Date().toISOString(),
          length: input.message.length
        };
      }
    });

    // Server info tool
    this.server.registerTool({
      name: 'server_info',
      description: 'Get server information and status',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        const status = this.server!.getStatus();
        const config = configManager.getConfig();
        
        return {
          server: {
            name: 'Cline for Cherry Studio MCP Server',
            version: '0.1.0',
            status: status,
            config: {
              port: config.server.port,
              host: config.server.host,
              tools: {
                file: config.tools.file.enabled,
                shell: config.tools.shell.enabled,
                edit: config.tools.edit.enabled
              }
            }
          },
          system: {
            platform: process.platform,
            nodeVersion: process.version,
            uptime: process.uptime(),
            memory: process.memoryUsage()
          }
        };
      }
    });

    logger.info('Basic tools registered successfully');
  }

  /**
   * Setup error handling
   */
  private setupErrorHandling(): void {
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', error);
      this.gracefulShutdown('SIGTERM');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
    });
  }

  /**
   * Setup graceful shutdown
   */
  private setupGracefulShutdown(): void {
    const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
    
    signals.forEach((signal) => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        this.gracefulShutdown(signal);
      });
    });
  }

  /**
   * Graceful shutdown handler
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    try {
      logger.info(`Graceful shutdown initiated by ${signal}`);
      
      if (this.server?.getStatus().running) {
        await this.stop();
      }
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', error instanceof Error ? error : new Error(String(error)));
      process.exit(1);
    }
  }
}

/**
 * Plugin instance (singleton)
 */
let pluginInstance: ClinePlugin | null = null;

/**
 * Get or create plugin instance
 */
export function getPlugin(): ClinePlugin {
  if (!pluginInstance) {
    pluginInstance = new ClinePlugin();
  }
  return pluginInstance;
}

/**
 * Initialize plugin (for direct usage)
 */
export async function initializePlugin(): Promise<ClinePlugin> {
  const plugin = getPlugin();
  await plugin.initialize();
  return plugin;
}

// Auto-initialize if this module is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializePlugin()
    .then(() => {
      logger.info('Plugin started successfully');
      logger.info('MCP server is running and ready to accept connections');
      logger.info('Test with: curl http://localhost:3001/health');
    })
    .catch((error) => {
      logger.error('Failed to start plugin', error);
      process.exit(1);
    });
}
