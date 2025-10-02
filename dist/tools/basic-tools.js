"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basicTools = exports.serverInfoTool = exports.echoTool = exports.pingTool = void 0;
const logger_1 = require("../utils/logger");
/**
 * Ping 工具 - 用于测试连接
 */
exports.pingTool = {
    name: 'ping',
    description: '测试服务器连接状态',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        logger_1.logger.info('ping tool called');
        return {
            success: true,
            message: 'pong',
            timestamp: new Date().toISOString(),
            server: 'Cline for Cherry Studio MCP Server'
        };
    }
};
/**
 * Echo 工具 - 用于测试参数传递
 */
exports.echoTool = {
    name: 'echo',
    description: '回显输入的消息',
    inputSchema: {
        type: 'object',
        properties: {
            message: {
                type: 'string',
                description: '要回显的消息'
            }
        },
        required: ['message']
    },
    async handler(args) {
        logger_1.logger.info('echo tool called', { message: args.message });
        return {
            success: true,
            originalMessage: args.message,
            echo: args.message,
            timestamp: new Date().toISOString()
        };
    }
};
/**
 * 服务器信息工具
 */
exports.serverInfoTool = {
    name: 'server_info',
    description: '获取服务器信息',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        logger_1.logger.info('server_info tool called');
        const info = {
            name: 'Cline for Cherry Studio MCP Server',
            version: '0.1.0',
            description: 'MCP server providing Cline functionality for Cherry Studio',
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
        return {
            success: true,
            serverInfo: info
        };
    }
};
// 导出所有基础工具
exports.basicTools = [
    exports.pingTool,
    exports.echoTool,
    exports.serverInfoTool
];
//# sourceMappingURL=basic-tools.js.map