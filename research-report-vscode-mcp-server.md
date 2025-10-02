# vscode-mcp-server 项目研究报告

## 项目概述

**项目名称**: vscode-mcp-server  
**作者**: JuehangQin  
**仓库地址**: https://github.com/juehang/vscode-mcp-server  
**版本**: 0.3.1  
**许可证**: MIT  

## 核心架构分析

### 1. 技术栈
- **运行环境**: VSCode 扩展 (TypeScript)
- **MCP SDK**: @modelcontextprotocol/sdk ^1.10.1
- **HTTP 服务器**: Express.js ^4.18.3
- **数据验证**: Zod ^3.22.4
- **开发工具**: TypeScript 5.8.2, ESLint

### 2. 架构模式
```
┌─────────────────┐    HTTP/MCP     ┌──────────────────┐
│   MCP Client    │ ◄─────────────► │  VSCode Extension │
│ (Claude/Cline)  │                 │   (MCP Server)   │
└─────────────────┘                 └──────────────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │  VSCode Workspace│
                                   │   (File System)  │
                                   └──────────────────┘
```

### 3. 核心组件

#### 3.1 扩展入口 (extension.ts)
- **功能**: VSCode 扩展的生命周期管理
- **关键特性**:
  - 可配置的服务器启用/禁用状态
  - 状态栏指示器显示服务器状态
  - 共享终端管理
  - 配置变更监听和热重启

#### 3.2 MCP 服务器 (server.ts)
- **功能**: HTTP MCP 协议服务器实现
- **端口**: 默认 3000，可配置
- **主机**: 默认 127.0.0.1，仅本地访问

#### 3.3 工具系统
实现了 5 大类工具：

1. **文件工具** (file-tools.ts)
   - `list_files_code`: 列出工作区文件
   - `read_file_code`: 读取文件内容

2. **编辑工具** 
   - `create_file_code`: 创建新文件
   - `replace_lines_code`: 替换文件行

3. **诊断工具**
   - `get_diagnostics_code`: 获取代码诊断信息

4. **符号工具**
   - `search_symbols_code`: 搜索符号
   - `get_symbol_definition_code`: 获取符号定义
   - `get_document_symbols_code`: 获取文档符号大纲

5. **Shell 工具**
   - `execute_shell_command_code`: 执行 shell 命令

## 可复用的模式和代码

### 1. 服务器生命周期管理
```typescript
// 可复用的启动/停止模式
async function toggleServerState(context: vscode.ExtensionContext) {
    serverEnabled = !serverEnabled;
    context.globalState.update('mcpServerEnabled', serverEnabled);
    
    if (serverEnabled) {
        // 启动服务器逻辑
        mcpServer = new MCPServer(port, host, terminal, toolConfig);
        await mcpServer.start();
    } else {
        // 停止服务器逻辑
        await mcpServer?.stop();
        mcpServer = undefined;
    }
}
```

### 2. 工具配置系统
```typescript
// 灵活的工具启用/禁用配置
interface ToolConfiguration {
    file: boolean;
    edit: boolean;
    shell: boolean;
    diagnostics: boolean;
    symbol: boolean;
}

function getToolConfiguration(): ToolConfiguration {
    const config = vscode.workspace.getConfiguration('vscode-mcp-server');
    const enabledTools = config.get<any>('enabledTools') || {};
    
    return {
        file: enabledTools.file ?? true,
        edit: enabledTools.edit ?? true,
        shell: enabledTools.shell ?? true,
        diagnostics: enabledTools.diagnostics ?? true,
        symbol: enabledTools.symbol ?? true
    };
}
```

### 3. 共享终端管理
```typescript
// 终端复用模式
export function getExtensionTerminal(context: vscode.ExtensionContext): vscode.Terminal {
    const existingTerminal = vscode.window.terminals.find(t => t.name === TERMINAL_NAME);
    
    if (existingTerminal && existingTerminal.exitStatus === undefined) {
        return existingTerminal; // 复用现有终端
    }
    
    sharedTerminal = vscode.window.createTerminal(TERMINAL_NAME);
    context.subscriptions.push(sharedTerminal);
    return sharedTerminal;
}
```

### 4. 日志系统
```typescript
// 单例日志模式
export class Logger {
    private static instance: Logger;
    private outputChannel: vscode.OutputChannel;
    
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    
    public info(message: string): void {
        this.outputChannel.appendLine(this.formatMessage(`INFO: ${message}`));
    }
}
```

## 对 Cherry Studio 插件的启发

### 1. 架构适配
- **VSCode 扩展 → Cherry Studio 插件**: 生命周期管理模式可以直接复用
- **Express 服务器 → HTTP 服务器**: 可以使用相同的技术栈
- **工具系统 → MCP 工具**: 完全兼容的 MCP 协议实现

### 2. 可直接复用的代码
1. **MCP 协议处理逻辑**
2. **工具注册和调用机制**
3. **HTTP 服务器设置**
4. **配置管理系统**
5. **日志记录系统**

### 3. 需要适配的部分
1. **VSCode API → Cherry Studio API**: 文件系统操作、终端管理等
2. **扩展配置 → 插件配置**: 配置系统的适配
3. **状态栏集成 → 插件 UI**: 用户界面的适配

### 4. 安全考虑
- **本地访问限制**: 默认只监听 127.0.0.1
- **工具权限控制**: 可配置的工具启用/禁用
- **Shell 命令执行**: 需要额外的安全验证

## 技术选型建议

### 1. 后端服务器
- **推荐**: Express.js + @modelcontextprotocol/sdk
- **原因**: 成熟稳定，与 vscode-mcp-server 保持一致

### 2. 前端框架
- **推荐**: React (与 Cherry Studio 保持一致)
- **原因**: 更好地集成到 Cherry Studio 的 UI 系统

### 3. 工具实现
- **文件操作**: 使用 Cherry Studio 的文件 API
- **Shell 执行**: 使用 Node.js child_process
- **诊断功能**: 可能需要集成 TypeScript 编译器 API

## 下一步行动

1. **创建基础项目结构**
2. **实现轻量级 MCP 服务器**
3. **移植核心工具功能**
4. **开发 Cherry Studio 插件界面**
5. **集成前后端通信**

---

**研究完成时间**: 2025-10-03  
**研究者**: Alan-88  
**项目状态**: 研究阶段完成，准备进入开发阶段
