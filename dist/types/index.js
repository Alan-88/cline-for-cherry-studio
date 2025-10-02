"use strict";
/**
 * Core type definitions for Cline for Cherry Studio MCP server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionError = exports.FileNotFoundError = exports.SecurityError = exports.ValidationError = exports.MCPError = void 0;
// Error types
class MCPError extends Error {
    code;
    data;
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = 'MCPError';
    }
}
exports.MCPError = MCPError;
class ValidationError extends MCPError {
    field;
    constructor(message, field) {
        super(-32602, message, { field });
        this.field = field;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class SecurityError extends MCPError {
    path;
    constructor(message, path) {
        super(-32000, message, { path });
        this.path = path;
        this.name = 'SecurityError';
    }
}
exports.SecurityError = SecurityError;
class FileNotFoundError extends MCPError {
    constructor(path) {
        super(-32001, `File not found: ${path}`, { path });
        this.name = 'FileNotFoundError';
    }
}
exports.FileNotFoundError = FileNotFoundError;
class PermissionError extends MCPError {
    constructor(operation, path) {
        super(-32002, `Permission denied for ${operation} on ${path}`, { operation, path });
        this.name = 'PermissionError';
    }
}
exports.PermissionError = PermissionError;
//# sourceMappingURL=index.js.map