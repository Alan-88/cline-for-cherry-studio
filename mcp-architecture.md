# Cline for Cherry Studio - MCP 服务器架构设计

## 项目概述

**目标**: 将 VSCode 插件 Cline 的核心功能移植到 Cherry Studio 桌面客户端  
**架构模式**: 插件化客户端-服务器架构  
**协议**: Model Context Protocol (MCP) over HTTP  

## 技术选型

### 后端技术栈
- **HTTP 服务器**: Express.js 4.18.3
- **MCP SDK**: @modelcontextprotocol/sdk ^1.10.1
- **语言**: TypeScript 5.8.2
- **数据验证**: Zod ^3.22.4
- **进程管理**: Node.js child_process

### 前端技术栈
- **框架**: React 18
- **语言**: TypeScript
- **UI 组件**: 与 Cherry Studio 保持一致
- **状态管理**: React Context + useReducer

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                Cherry Studio 主应用                         │
│  ┌─────────────┐  ┌─────────────────────────────────────┐   │
│  │   Plugin    │  │         Cline 插件                  │   │
│  │  Manager    │  │  ┌─────────────┐  ┌─────────────┐   │   │
│  │             │  │  │ React 前端  │  │ 插件服务层   │   │   │
│  │             │  │  │    界面     │  │             │   │   │
│  └─────────────┘  └─────────────┴─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼ HTTP/MCP (localhost:3001)
┌─────────────────────────────────────────────────────────────┐
│                    MCP 服务器                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ HTTP 服务器 │  │ MCP 协议层  │  │       工具层        │  │
│  │  (Express)  │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
                                                     │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      工具实现                              │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │文件工具 │ │Shell工具│ │编辑工具 │ │诊断工具 │ │符号工具 │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                       系统层                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────────────────────────────┐ │
│  │文件系统 │ │  终端   │ │    Cherry Studio API           │ │
│  └─────────┘ └─────────┘ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 项目结构

```
cline-for-cherry-studio/
├── src/
│   ├── index.ts                    # 插件入口点
│   ├── server/
│   │   ├── mcp-server.ts          # MCP 服务器核心
│   │   ├── tools/
│   │   │   ├── file-tools.ts      # 文件操作工具
│   │   │   ├── shell-tools.ts     # Shell 执行工具
│   │   │   ├── edit-tools.ts      # 文件编辑工具
│   │   │   └── index.ts           # 工具注册和管理
│   │   └── utils/
│   │       ├── logger.ts          # 日志系统
│   │       └── config.ts          # 配置管理
│   ├── ui/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx  # 聊天界面组件
│   │   │   ├── MessageList.tsx    # 消息列表
│   │   │   ├── InputArea.tsx      # 输入区域
│   │   │   └── StatusBar.tsx      # 状态栏
│   │   ├── hooks/
│   │   │   ├── useMCPClient.ts    # MCP 客户端 Hook
│   │   │   └── useChat.ts         # 聊天状态 Hook
│   │   └── index.tsx              # UI 入口
│   ├── types/
│   │   ├── mcp.ts                 # MCP 相关类型
│   │   ├── chat.ts                # 聊天相关类型
│   │   └── config.ts              # 配置类型
│   └── utils/
│       ├── api.ts                 # API 工具函数
│       └── validation.ts          # 数据验证
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## 核心组件设计

### 1. 插件入口 (src/index.ts)

**职责**:
- Cherry Studio 插件生命周期管理
- MCP 服务器启动/停止控制
- 插件配置管理
- 错误处理和日志记录

**关键接口**:
```typescript
interface ClinePlugin {
  activate(context: PluginContext): Promise<void>
  deactivate(): Promise<void>
  getServerStatus(): ServerStatus
  toggleServer(): Promise<void>
}

interface PluginContext {
  workspacePath: string
  config: PluginConfig
  api: CherryStudioAPI
}
```

### 2. MCP 服务器核心 (src/server/mcp-server.ts)

**职责**:
- HTTP 服务器管理 (Express.js)
- MCP 协议处理 (@modelcontextprotocol/sdk)
- 工具注册和调用
- 错误处理和响应格式化

**关键特性**:
- 默认端口: 3001 (避免与 vscode-mcp-server 冲突)
- 仅本地访问: 127.0.0.1
- 可配置的工具启用/禁用
- 热重启支持
- 请求日志记录

**接口设计**:
```typescript
interface MCPServer {
  start(): Promise<void>
  stop(): Promise<void>
  isRunning(): boolean
  registerTool(tool: MCPTool): void
  unregisterTool(toolName: string): void
  getServerInfo(): ServerInfo
}

interface MCPTool {
  name: string
  description: string
  inputSchema: z.ZodSchema
  execute(params: any, context: ToolContext): Promise<any>
}

interface ToolContext {
  workspacePath: string
  logger: Logger
  config: ToolConfig
}
```

### 3. 工具层架构

#### 3.1 文件工具 (src/server/tools/file-tools.ts)

**实现工具**:
- `read_file` - 读取文件内容
- `write_file` - 写入文件内容
- `list_files` - 列出目录文件
- `create_directory` - 创建目录
- `delete_file` - 删除文件

**安全考虑**:
- 文件操作限制在工作目录内
- 文件大小限制 (默认 1MB)
- 路径遍历攻击防护
- 敏感文件访问控制

#### 3.2 Shell 工具 (src/server/tools/shell-tools.ts)

**实现工具**:
- `execute_shell_command` - 执行 shell 命令

**安全考虑**:
- 命令白名单机制
- 危险命令拦截
- 执行超时控制 (默认 30 秒)
- 用户确认机制

#### 3.3 编辑工具 (src/server/tools/edit-tools.ts)

**实现工具**:
- `create_file` - 创建新文件
- `replace_lines` - 替换文件行
- `insert_lines` - 插入行
- `delete_lines` - 删除行

### 4. 前端 UI 设计

#### 4.1 聊天界面 (src/ui/components/ChatInterface.tsx)

**功能**:
- 消息显示和滚动
- 用户输入处理
- 工具调用状态显示
- 错误信息展示

**组件结构**:
```typescript
interface ChatInterfaceProps {
  onSendMessage: (message: string) => void
  messages: Message[]
  isLoading: boolean
  serverStatus: ServerStatus
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
}
```

#### 4.2 MCP 客户端 Hook (src/ui/hooks/useMCPClient.ts)

**职责**:
- 与 MCP 服务器的 HTTP 通信
- 工具调用管理
- 错误处理和重试
- 响应状态管理

### 5. 配置系统

**配置文件结构**:
```typescript
interface PluginConfig {
  server: {
    port: number              // 默认 3001
    host: string              // 默认 '127.0.0.1'
    autoStart: boolean        // 默认 false
  }
  tools: {
    file: {
      enabled: boolean
      maxFileSize: number     // 默认 1MB
      allowedExtensions: string[]
    }
    shell: {
      enabled: boolean
      timeout: number         // 默认 30秒
      requireConfirmation: boolean
      allowedCommands: string[]
    }
    edit: {
      enabled: boolean
      createBackup: boolean
    }
  }
  ui: {
    theme: 'light' | 'dark' | 'auto'
    fontSize: number
    showLineNumbers: boolean
  }
  security: {
    workspaceRestriction: boolean
    allowedPaths: string[]
    blockedPaths: string[]
  }
}
```

## 安全设计

### 1. 网络安全
- 仅监听本地地址 (127.0.0.1)
- 无外部网络访问
- 可选的认证令牌机制

### 2. 文件系统安全
- 工作目录限制
- 路径遍历防护
- 敏感文件黑名单
- 文件大小限制

### 3. 命令执行安全
- 命令白名单
- 危险命令拦截
- 执行超时控制
- 用户确认机制

### 4. 数据安全
- 输入验证和清理
- 错误信息过滤
- 日志脱敏处理

## 通信协议

### MCP 请求格式
```typescript
interface MCPRequest {
  jsonrpc: '2.0'
  id: string | number
  method: string
  params?: any
}
```

### MCP 响应格式
```typescript
interface MCPResponse {
  jsonrpc: '2.0'
  id: string | number
  result?: any
  error?: MCPError
}

interface MCPError {
  code: number
  message: string
  data?: any
}
```

### 工具调用示例
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": {
    "name": "read_file",
    "arguments": {
      "path": "README.md",
      "encoding": "utf-8"
    }
  }
}
```

## 性能优化

### 1. 服务器优化
- 请求缓存机制
- 连接池管理
- 异步处理
- 内存使用监控

### 2. 前端优化
- 虚拟滚动 (大量消息)
- 懒加载
- 防抖处理
- 状态更新优化

### 3. 工具执行优化
- 并发控制
- 结果缓存
- 超时管理
- 资源清理

## 错误处理

### 1. 服务器错误
- 网络错误处理
- 协议错误处理
- 工具执行错误
- 系统资源错误

### 2. 前端错误
- 网络请求错误
- 组件渲染错误
- 状态管理错误
- 用户输入错误

### 3. 错误恢复
- 自动重试机制
- 降级处理
- 错误日志记录
- 用户友好的错误提示

## 测试策略

### 1. 单元测试
- 工具函数测试
- 组件测试
- 工具逻辑测试

### 2. 集成测试
- MCP 协议测试
- 前后端通信测试
- 端到端工作流测试

### 3. 安全测试
- 文件系统安全测试
- 命令注入测试
- 网络安全测试

## 部署和分发

### 1. 插件打包
- Webpack 构建优化
- 依赖管理
- 资源压缩

### 2. 安装方式
- Cherry Studio 插件市场
- GitHub Releases
- 手动安装包

### 3. 版本管理
- 语义化版本控制
- 自动更新机制
- 向后兼容性

---

**设计完成时间**: 2025-10-03  
**设计者**: Alan-88  
**版本**: v1.0  
**状态**: 架构设计完成，准备进入实现阶段
