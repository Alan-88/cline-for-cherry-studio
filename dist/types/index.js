/**
 * Core type definitions for Cline for Cherry Studio MCP server
 */
// Error types
export class MCPError extends Error {
    code;
    data;
    constructor(code, message, data) {
        super(message);
        this.code = code;
        this.data = data;
        this.name = 'MCPError';
    }
}
export class ValidationError extends MCPError {
    field;
    constructor(message, field) {
        super(-32602, message, { field });
        this.field = field;
        this.name = 'ValidationError';
    }
}
export class SecurityError extends MCPError {
    path;
    constructor(message, path) {
        super(-32000, message, { path });
        this.path = path;
        this.name = 'SecurityError';
    }
}
export class FileNotFoundError extends MCPError {
    constructor(path) {
        super(-32001, `File not found: ${path}`, { path });
        this.name = 'FileNotFoundError';
    }
}
export class PermissionError extends MCPError {
    constructor(operation, path) {
        super(-32002, `Permission denied for ${operation} on ${path}`, { operation, path });
        this.name = 'PermissionError';
    }
}
//# sourceMappingURL=index.js.map