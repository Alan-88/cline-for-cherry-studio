"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shellTools = exports.checkCommandExistsTool = exports.getSystemInfoTool = exports.executeShellCommandTool = void 0;
const child_process_1 = require("child_process");
const logger_1 = require("../utils/logger");
/**
 * 执行 shell 命令工具
 */
exports.executeShellCommandTool = {
    name: 'execute_shell_command',
    description: '执行 shell 命令并返回输出结果',
    inputSchema: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: '要执行的 shell 命令'
            },
            args: {
                type: 'array',
                items: { type: 'string' },
                description: '命令参数数组（可选）'
            },
            cwd: {
                type: 'string',
                description: '工作目录（可选，默认为当前工作目录）'
            },
            timeout: {
                type: 'number',
                description: '超时时间（毫秒，默认 30000）'
            },
            env: {
                type: 'object',
                description: '环境变量（可选）'
            }
        },
        required: ['command']
    },
    async handler(args) {
        const { command, args: cmdArgs = [], cwd, timeout = 30000, env, _context } = args;
        logger_1.logger.info('execute_shell_command', {
            command,
            cmdArgs,
            cwd: cwd || _context?.workingDirectory || process.cwd(),
            timeout,
            env: env ? Object.keys(env) : undefined
        });
        try {
            // 安全检查：禁止危险命令
            const dangerousCommands = [
                'rm -rf /',
                'sudo rm',
                'format',
                'del /s',
                'shutdown',
                'reboot',
                'halt',
                'poweroff',
                '> /dev/sda',
                'dd if=',
                'mkfs'
            ];
            const fullCommand = [command, ...cmdArgs].join(' ').toLowerCase();
            for (const dangerous of dangerousCommands) {
                if (fullCommand.includes(dangerous.toLowerCase())) {
                    throw new Error(`危险命令被阻止: ${dangerous}`);
                }
            }
            // 确定工作目录
            const workingDirectory = cwd || _context?.workingDirectory || process.cwd();
            // 执行命令
            const result = await executeCommand(command, cmdArgs, {
                cwd: workingDirectory,
                timeout,
                env: { ...process.env, ...env }
            });
            logger_1.logger.info('execute_shell_command success', {
                command,
                exitCode: result.exitCode,
                stdoutLength: result.stdout.length,
                stderrLength: result.stderr.length
            });
            return {
                success: true,
                output: result.stdout,
                error: result.stderr,
                exitCode: result.exitCode,
                command: [command, ...cmdArgs].join(' '),
                workingDirectory,
                executionTime: result.executionTime,
                timedOut: result.timedOut
            };
        }
        catch (error) {
            logger_1.logger.error(`execute_shell_command error: ${error instanceof Error ? error.message : String(error)}`, { command, cmdArgs });
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                command: [command, ...cmdArgs].join(' '),
                workingDirectory: cwd || _context?.workingDirectory || process.cwd()
            };
        }
    }
};
/**
 * 执行命令的辅助函数
 */
async function executeCommand(command, args, options) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        let stdout = '';
        let stderr = '';
        let timedOut = false;
        const child = (0, child_process_1.spawn)(command, args, {
            cwd: options.cwd,
            env: options.env,
            shell: true,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        // 设置超时
        const timeoutId = setTimeout(() => {
            timedOut = true;
            child.kill('SIGKILL');
            reject(new Error(`命令执行超时 (${options.timeout}ms): ${command}`));
        }, options.timeout);
        // 收集输出
        if (child.stdout) {
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
        }
        if (child.stderr) {
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
        }
        // 处理进程结束
        child.on('close', (code) => {
            clearTimeout(timeoutId);
            if (timedOut) {
                return; // 已经在超时处理中拒绝了
            }
            const executionTime = Date.now() - startTime;
            resolve({
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                exitCode: code,
                executionTime,
                timedOut: false
            });
        });
        // 处理错误
        child.on('error', (error) => {
            clearTimeout(timeoutId);
            reject(error);
        });
    });
}
/**
 * 获取系统信息工具
 */
exports.getSystemInfoTool = {
    name: 'get_system_info',
    description: '获取系统信息',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    },
    async handler() {
        logger_1.logger.info('get_system_info');
        try {
            const platform = process.platform;
            const arch = process.arch;
            const nodeVersion = process.version;
            const cwd = process.cwd();
            // 获取基本信息
            const systemInfo = {
                platform,
                arch,
                nodeVersion,
                workingDirectory: cwd,
                environment: process.env['NODE_ENV'] || 'development'
            };
            // 尝试获取更多系统信息
            try {
                if (platform === 'darwin') {
                    // macOS
                    const result = await executeCommand('sw_vers', [], { cwd, timeout: 5000, env: process.env });
                    systemInfo.osInfo = result.stdout;
                }
                else if (platform === 'linux') {
                    // Linux
                    const result = await executeCommand('uname', ['-a'], { cwd, timeout: 5000, env: process.env });
                    systemInfo.osInfo = result.stdout;
                }
                else if (platform === 'win32') {
                    // Windows
                    const result = await executeCommand('ver', [], { cwd, timeout: 5000, env: process.env });
                    systemInfo.osInfo = result.stdout;
                }
            }
            catch (error) {
                logger_1.logger.warn('Failed to get additional OS info', error);
                systemInfo.osInfo = 'Unable to retrieve OS info';
            }
            logger_1.logger.info('get_system_info success', systemInfo);
            return {
                success: true,
                systemInfo
            };
        }
        catch (error) {
            logger_1.logger.error('get_system_info error', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
};
/**
 * 检查命令是否存在工具
 */
exports.checkCommandExistsTool = {
    name: 'check_command_exists',
    description: '检查指定的命令是否存在于系统中',
    inputSchema: {
        type: 'object',
        properties: {
            command: {
                type: 'string',
                description: '要检查的命令名称'
            }
        },
        required: ['command']
    },
    async handler(args) {
        const { command, _context } = args;
        const workingDirectory = _context?.workingDirectory || process.cwd();
        logger_1.logger.info('check_command_exists', { command, workingDirectory });
        try {
            let result;
            if (process.platform === 'win32') {
                // Windows: 使用 where 命令
                result = await executeCommand('where', [command], { cwd: workingDirectory, timeout: 5000, env: process.env });
            }
            else {
                // Unix-like: 使用 which 命令
                result = await executeCommand('which', [command], { cwd: workingDirectory, timeout: 5000, env: process.env });
            }
            const exists = result.exitCode === 0 && result.stdout.trim().length > 0;
            logger_1.logger.info('check_command_exists result', { command, exists, path: result.stdout.trim() });
            return {
                success: true,
                command,
                exists,
                path: exists ? result.stdout.trim() : null
            };
        }
        catch (error) {
            logger_1.logger.error(`check_command_exists error: ${error instanceof Error ? error.message : String(error)}`, { command });
            return {
                success: false,
                command,
                exists: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
};
// 导出所有 shell 工具
exports.shellTools = [
    exports.executeShellCommandTool,
    exports.getSystemInfoTool,
    exports.checkCommandExistsTool
];
//# sourceMappingURL=shell-tools.js.map