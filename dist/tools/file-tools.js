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
exports.fileTools = exports.deleteFileTool = exports.createDirectoryTool = exports.listFilesTool = exports.writeFileTool = exports.readFileTool = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const logger_1 = require("../utils/logger");
/**
 * 检查路径是否在允许的工作目录内
 */
function isPathAllowed(filePath, workingDirectory) {
    const resolvedPath = path.resolve(workingDirectory, filePath);
    return resolvedPath.startsWith(path.resolve(workingDirectory));
}
/**
 * 读取文件内容工具
 */
exports.readFileTool = {
    name: 'read_file',
    description: '读取指定路径的文件内容',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: '要读取的文件路径（相对于工作目录）'
            }
        },
        required: ['path']
    },
    async handler(args) {
        const { path: filePath } = args;
        const workingDirectory = args._context?.workingDirectory || process.cwd();
        try {
            // 安全检查
            if (!isPathAllowed(filePath, workingDirectory)) {
                throw new Error(`路径 "${filePath}" 不在允许的工作目录内`);
            }
            const fullPath = path.resolve(workingDirectory, filePath);
            // 检查文件是否存在
            try {
                await fs.access(fullPath);
            }
            catch (error) {
                throw new Error(`文件不存在: ${filePath}`);
            }
            // 读取文件内容
            const content = await fs.readFile(fullPath, 'utf-8');
            const stats = await fs.stat(fullPath);
            logger_1.logger.info(`成功读取文件: ${filePath}`, {
                size: content.length,
                lastModified: stats.mtime
            });
            return {
                success: true,
                content,
                metadata: {
                    size: content.length,
                    lastModified: stats.mtime.toISOString(),
                    path: filePath
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`读取文件失败: ${filePath}`, error instanceof Error ? error : { error: String(error) });
            return {
                success: false,
                error: error instanceof Error ? error.message : '读取文件失败'
            };
        }
    }
};
/**
 * 写入文件内容工具
 */
exports.writeFileTool = {
    name: 'write_file',
    description: '将内容写入指定路径的文件',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: '要写入的文件路径（相对于工作目录）'
            },
            content: {
                type: 'string',
                description: '要写入的文件内容'
            }
        },
        required: ['path', 'content']
    },
    async handler(args) {
        const { path: filePath, content } = args;
        const workingDirectory = args._context?.workingDirectory || process.cwd();
        try {
            // 安全检查
            if (!isPathAllowed(filePath, workingDirectory)) {
                throw new Error(`路径 "${filePath}" 不在允许的工作目录内`);
            }
            const fullPath = path.resolve(workingDirectory, filePath);
            // 确保目录存在
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            // 写入文件
            await fs.writeFile(fullPath, content, 'utf-8');
            const stats = await fs.stat(fullPath);
            logger_1.logger.info(`成功写入文件: ${filePath}`, {
                size: content.length,
                lastModified: stats.mtime
            });
            return {
                success: true,
                metadata: {
                    size: content.length,
                    lastModified: stats.mtime.toISOString(),
                    path: filePath
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`写入文件失败: ${filePath}`, error instanceof Error ? error : { error: String(error) });
            return {
                success: false,
                error: error instanceof Error ? error.message : '写入文件失败'
            };
        }
    }
};
/**
 * 列出目录内容工具
 */
exports.listFilesTool = {
    name: 'list_files',
    description: '列出指定目录下的文件和子目录',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: '要列出的目录路径（相对于工作目录，默认为根目录）',
                default: '.'
            },
            recursive: {
                type: 'boolean',
                description: '是否递归列出子目录',
                default: false
            }
        },
        required: []
    },
    async handler(args) {
        const { path: dirPath = '.', recursive = false } = args;
        const workingDirectory = args._context?.workingDirectory || process.cwd();
        try {
            // 安全检查
            if (!isPathAllowed(dirPath, workingDirectory)) {
                throw new Error(`路径 "${dirPath}" 不在允许的工作目录内`);
            }
            const fullPath = path.resolve(workingDirectory, dirPath);
            // 检查目录是否存在
            try {
                const stats = await fs.stat(fullPath);
                if (!stats.isDirectory()) {
                    throw new Error(`路径不是目录: ${dirPath}`);
                }
            }
            catch (error) {
                throw new Error(`目录不存在: ${dirPath}`);
            }
            // 递归列出文件
            async function listFilesRecursively(currentPath, relativePath = '') {
                const items = [];
                const entries = await fs.readdir(currentPath, { withFileTypes: true });
                for (const entry of entries) {
                    const entryPath = path.join(currentPath, entry.name);
                    const relativeEntryPath = path.join(relativePath, entry.name);
                    try {
                        const stats = await fs.stat(entryPath);
                        const item = {
                            name: entry.name,
                            path: relativeEntryPath,
                            type: entry.isDirectory() ? 'directory' : 'file',
                            size: entry.isFile() ? stats.size : undefined,
                            lastModified: stats.mtime.toISOString(),
                            children: entry.isDirectory() && recursive ?
                                await listFilesRecursively(entryPath, relativeEntryPath) : undefined
                        };
                        items.push(item);
                    }
                    catch (error) {
                        // 跳过无法访问的文件/目录
                        logger_1.logger.warn(`无法访问 ${entryPath}: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
                return items.sort((a, b) => {
                    // 目录排在文件前面
                    if (a.type !== b.type) {
                        return a.type === 'directory' ? -1 : 1;
                    }
                    // 按名称排序
                    return a.name.localeCompare(b.name);
                });
            }
            const files = await listFilesRecursively(fullPath, dirPath);
            logger_1.logger.info(`成功列出目录: ${dirPath}`, {
                itemCount: files.length,
                recursive
            });
            return {
                success: true,
                files,
                metadata: {
                    path: dirPath,
                    itemCount: files.length,
                    recursive
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`列出目录失败: ${dirPath}`, error instanceof Error ? error : { error: String(error) });
            return {
                success: false,
                error: error instanceof Error ? error.message : '列出目录失败'
            };
        }
    }
};
/**
 * 创建目录工具
 */
exports.createDirectoryTool = {
    name: 'create_directory',
    description: '创建指定路径的目录',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: '要创建的目录路径（相对于工作目录）'
            },
            recursive: {
                type: 'boolean',
                description: '是否递归创建父目录',
                default: true
            }
        },
        required: ['path']
    },
    async handler(args) {
        const { path: dirPath, recursive = true } = args;
        const workingDirectory = args._context?.workingDirectory || process.cwd();
        try {
            // 安全检查
            if (!isPathAllowed(dirPath, workingDirectory)) {
                throw new Error(`路径 "${dirPath}" 不在允许的工作目录内`);
            }
            const fullPath = path.resolve(workingDirectory, dirPath);
            // 创建目录
            await fs.mkdir(fullPath, { recursive });
            const stats = await fs.stat(fullPath);
            logger_1.logger.info(`成功创建目录: ${dirPath}`, {
                recursive,
                created: stats.birthtime
            });
            return {
                success: true,
                metadata: {
                    path: dirPath,
                    created: stats.birthtime.toISOString(),
                    recursive
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`创建目录失败: ${dirPath}`, error instanceof Error ? error : { error: String(error) });
            return {
                success: false,
                error: error instanceof Error ? error.message : '创建目录失败'
            };
        }
    }
};
/**
 * 删除文件或目录工具
 */
exports.deleteFileTool = {
    name: 'delete_file',
    description: '删除指定的文件或目录',
    inputSchema: {
        type: 'object',
        properties: {
            path: {
                type: 'string',
                description: '要删除的文件或目录路径（相对于工作目录）'
            },
            recursive: {
                type: 'boolean',
                description: '是否递归删除目录及其内容',
                default: false
            }
        },
        required: ['path']
    },
    async handler(args) {
        const { path: filePath, recursive = false } = args;
        const workingDirectory = args._context?.workingDirectory || process.cwd();
        try {
            // 安全检查
            if (!isPathAllowed(filePath, workingDirectory)) {
                throw new Error(`路径 "${filePath}" 不在允许的工作目录内`);
            }
            const fullPath = path.resolve(workingDirectory, filePath);
            // 检查路径是否存在
            try {
                await fs.access(fullPath);
            }
            catch (error) {
                throw new Error(`文件或目录不存在: ${filePath}`);
            }
            const stats = await fs.stat(fullPath);
            if (stats.isDirectory() && recursive) {
                // 递归删除目录
                await fs.rm(fullPath, { recursive: true, force: true });
            }
            else if (stats.isDirectory()) {
                // 删除空目录
                await fs.rmdir(fullPath);
            }
            else {
                // 删除文件
                await fs.unlink(fullPath);
            }
            logger_1.logger.info(`成功删除: ${filePath}`, {
                type: stats.isDirectory() ? 'directory' : 'file',
                recursive
            });
            return {
                success: true,
                metadata: {
                    path: filePath,
                    type: stats.isDirectory() ? 'directory' : 'file',
                    recursive
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`删除失败: ${filePath}`, error instanceof Error ? error : { error: String(error) });
            return {
                success: false,
                error: error instanceof Error ? error.message : '删除失败'
            };
        }
    }
};
// 导出所有文件工具
exports.fileTools = [
    exports.readFileTool,
    exports.writeFileTool,
    exports.listFilesTool,
    exports.createDirectoryTool,
    exports.deleteFileTool
];
//# sourceMappingURL=file-tools.js.map