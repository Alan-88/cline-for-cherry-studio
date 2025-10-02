"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * Simple logger utility for MCP server (without external dependencies)
 */
class Logger {
    logs = [];
    maxLogsInMemory = 1000;
    logLevel;
    logDir = 'logs';
    constructor(logLevel = 'info') {
        this.logLevel = logLevel;
        this.ensureLogDirectory();
    }
    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }
    writeToFile(level, message, context) {
        const timestamp = new Date().toISOString();
        const logLine = `${timestamp} [${level.toUpperCase()}] ${message}${context ? ` ${JSON.stringify(context)}` : ''}\n`;
        const filename = level === 'error' ? 'error.log' : 'combined.log';
        const filepath = path.join(this.logDir, filename);
        try {
            fs.appendFileSync(filepath, logLine);
        }
        catch (error) {
            console.error('Failed to write to log file:', error);
        }
    }
    addLogEntry(level, message, context) {
        const entry = {
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
            info: '\x1b[32m', // green
            warn: '\x1b[33m', // yellow
            error: '\x1b[31m' // red
        };
        const reset = '\x1b[0m';
        if (this.shouldLog(level)) {
            console.log(`${colors[level]}[${level.toUpperCase()}]${reset} ${message}`, context || '');
        }
    }
    shouldLog(level) {
        const levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
        return levels[level] >= levels[this.logLevel];
    }
    debug(message, context) {
        this.addLogEntry('debug', message, context);
    }
    info(message, context) {
        this.addLogEntry('info', message, context);
    }
    warn(message, context) {
        this.addLogEntry('warn', message, context);
    }
    error(message, error) {
        const context = error instanceof Error
            ? { error: error.message, stack: error.stack }
            : error;
        this.addLogEntry('error', message, context);
    }
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }
    getLogsByLevel(level) {
        return this.logs.filter(log => log.level === level);
    }
    clearLogs() {
        this.logs = [];
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    // Performance logging
    startTimer(label) {
        const start = Date.now();
        this.debug(`Timer started: ${label}`);
        return () => {
            const duration = Date.now() - start;
            this.info(`Timer completed: ${label}`, { duration: `${duration}ms` });
        };
    }
    // Request logging
    logRequest(method, params, requestId) {
        this.debug(`Request received`, {
            method,
            requestId,
            params: typeof params === 'object' ? JSON.stringify(params).substring(0, 200) : params
        });
    }
    logResponse(method, result, requestId, duration) {
        this.debug(`Response sent`, {
            method,
            requestId,
            duration: `${duration}ms`,
            resultType: typeof result
        });
    }
    logError(method, error, requestId) {
        this.error(`Request failed`, {
            method,
            requestId,
            error: error.message,
            stack: error.stack
        });
    }
}
exports.Logger = Logger;
// Singleton instance
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map