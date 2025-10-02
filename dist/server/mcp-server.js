"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const index_js_1 = require("../types/index.js");
const logger_js_1 = require("../utils/logger.js");
/**
 * MCP Server implementation for Cline for Cherry Studio
 */
class MCPServer {
    app;
    server = null;
    tools = new Map();
    config;
    startTime = new Date();
    requestCount = 0;
    errorCount = 0;
    constructor(config) {
        this.config = config;
        this.app = (0, express_1.default)();
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Security middleware
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: false, // Allow local development
        }));
        // CORS for local development
        this.app.use((0, cors_1.default)({
            origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
            credentials: true
        }));
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging
        this.app.use((req, _res, next) => {
            logger_js_1.logger.debug(`HTTP ${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent')
            });
            next();
        });
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (_req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.startTime.getTime()
            });
        });
        // Server info
        this.app.get('/info', (_req, res) => {
            const info = {
                name: 'Cline for Cherry Studio MCP Server',
                version: '0.1.0',
                description: 'MCP server providing Cline functionality for Cherry Studio',
                capabilities: this.getCapabilities()
            };
            res.json(info);
        });
        // Server status
        this.app.get('/status', (_req, res) => {
            const status = {
                running: this.server !== null,
                port: this.config.server.port,
                uptime: Date.now() - this.startTime.getTime(),
                requestCount: this.requestCount,
                errorCount: this.errorCount
            };
            res.json(status);
        });
        // MCP JSON-RPC endpoint
        this.app.post('/mcp', async (req, res) => {
            try {
                const response = await this.handleRequest(req.body);
                res.json(response);
            }
            catch (error) {
                logger_js_1.logger.error('MCP request failed', error instanceof Error ? error : new Error(String(error)));
                const errorResponse = {
                    jsonrpc: '2.0',
                    id: req.body?.id || null,
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error instanceof Error ? error.message : String(error)
                    }
                };
                res.status(500).json(errorResponse);
            }
        });
        // List available tools
        this.app.get('/tools', (_req, res) => {
            const tools = Array.from(this.tools.values()).map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }));
            res.json({ tools });
        });
        // Error handling
        this.app.use((err, _req, res, _next) => {
            this.errorCount++;
            logger_js_1.logger.error('Unhandled error in express', err);
            res.status(500).json({
                error: 'Internal server error',
                message: err.message
            });
        });
        // 404 handling
        this.app.use((req, res) => {
            res.status(404).json({
                error: 'Not found',
                message: `Route ${req.method} ${req.path} not found`
            });
        });
    }
    async handleRequest(request) {
        const startTime = Date.now();
        this.requestCount++;
        try {
            // Validate JSON-RPC request
            if (!this.isValidRequest(request)) {
                throw new index_js_1.MCPError(-32600, 'Invalid Request');
            }
            const { method, params, id } = request;
            logger_js_1.logger.logRequest(method, params, String(id));
            let result;
            switch (method) {
                case 'initialize':
                    result = await this.handleInitialize(params);
                    break;
                case 'tools/list':
                    result = await this.handleToolsList();
                    break;
                case 'tools/call':
                    result = await this.handleToolsCall(params);
                    break;
                case 'ping':
                    result = { status: 'pong', timestamp: new Date().toISOString() };
                    break;
                default:
                    throw new index_js_1.MCPError(-32601, `Method not found: ${method}`);
            }
            logger_js_1.logger.logResponse(method, result, String(id), Date.now() - startTime);
            return {
                jsonrpc: '2.0',
                id,
                result
            };
        }
        catch (error) {
            this.errorCount++;
            logger_js_1.logger.logError(request.method, error instanceof Error ? error : new Error(String(error)), String(request.id));
            return {
                jsonrpc: '2.0',
                id: request.id,
                error: {
                    code: error instanceof index_js_1.MCPError ? error.code : -32603,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    data: error instanceof index_js_1.MCPError ? error.data : undefined
                }
            };
        }
    }
    isValidRequest(request) {
        return (request &&
            typeof request === 'object' &&
            request.jsonrpc === '2.0' &&
            typeof request.method === 'string' &&
            (request.id === null || typeof request.id === 'string' || typeof request.id === 'number'));
    }
    async handleInitialize(params) {
        logger_js_1.logger.info('MCP server initialized', params);
        return {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {},
                logging: {}
            },
            serverInfo: {
                name: 'cline-for-cherry-studio',
                version: '0.1.0'
            }
        };
    }
    async handleToolsList() {
        const tools = Array.from(this.tools.values()).map(tool => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema
        }));
        return { tools };
    }
    async handleToolsCall(params) {
        if (!params || typeof params.name !== 'string') {
            throw new index_js_1.MCPError(-32602, 'Invalid tool call parameters');
        }
        const tool = this.tools.get(params.name);
        if (!tool) {
            throw new index_js_1.MCPError(-32601, `Tool not found: ${params.name}`);
        }
        try {
            logger_js_1.logger.info(`Executing tool: ${params.name}`, { params: params.arguments });
            const result = await tool.handler(params.arguments || {});
            logger_js_1.logger.info(`Tool completed: ${params.name}`, { resultType: typeof result });
            return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
        }
        catch (error) {
            logger_js_1.logger.error(`Tool failed: ${params.name}`, error instanceof Error ? error : new Error(String(error)));
            throw new index_js_1.MCPError(-32000, `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    getCapabilities() {
        const capabilities = ['tools'];
        if (this.config.tools.file.enabled)
            capabilities.push('file-operations');
        if (this.config.tools.shell.enabled)
            capabilities.push('shell-commands');
        if (this.config.tools.edit.enabled)
            capabilities.push('file-editing');
        return capabilities;
    }
    /**
     * Register a new tool
     */
    registerTool(tool) {
        this.tools.set(tool.name, tool);
        logger_js_1.logger.info(`Tool registered: ${tool.name}`);
    }
    /**
     * Unregister a tool
     */
    unregisterTool(name) {
        const removed = this.tools.delete(name);
        if (removed) {
            logger_js_1.logger.info(`Tool unregistered: ${name}`);
        }
        return removed;
    }
    /**
     * Start the MCP server
     */
    async start() {
        return new Promise((resolve, reject) => {
            try {
                this.server = this.app.listen(this.config.server.port, this.config.server.host, () => {
                    logger_js_1.logger.info(`MCP server started on ${this.config.server.host}:${this.config.server.port}`);
                    resolve();
                });
                this.server.on('error', (error) => {
                    logger_js_1.logger.error('Server error', error);
                    reject(error);
                });
            }
            catch (error) {
                logger_js_1.logger.error('Failed to start server', error instanceof Error ? error : new Error(String(error)));
                reject(error);
            }
        });
    }
    /**
     * Stop the MCP server
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    logger_js_1.logger.info('MCP server stopped');
                    this.server = null;
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    }
    /**
     * Get server status
     */
    getStatus() {
        return {
            running: this.server !== null,
            port: this.config.server.port,
            uptime: Date.now() - this.startTime.getTime(),
            requestCount: this.requestCount,
            errorCount: this.errorCount
        };
    }
    /**
     * Get registered tools
     */
    getTools() {
        return Array.from(this.tools.values());
    }
}
exports.MCPServer = MCPServer;
//# sourceMappingURL=mcp-server.js.map