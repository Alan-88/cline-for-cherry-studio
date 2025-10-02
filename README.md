# Cline for Cherry Studio

将 VSCode 插件 Cline 的核心功能移植到桌面客户端 Cherry Studio 中的项目。

## 项目概述

这个项目旨在为 Cherry Studio 提供 Cline 的功能，通过实现一个轻量级的 MCP (Model Context Protocol) 服务器来提供 AI 助手功能。

### 核心特性

- 🚀 **轻量级 MCP 服务器**: 基于 Express.js 和 TypeScript 构建
- 🔧 **工具系统**: 支持文件操作、Shell 命令、代码编辑等工具
- 🛡️ **安全策略**: 工作目录限制、路径白名单/黑名单
- 📊 **日志系统**: 完整的请求日志和性能监控
- ⚙️ **配置管理**: 灵活的配置系统，支持运行时更新

## 项目结构

```
cline-for-cherry-studio/
├── src/
│   ├── index.ts                 # 插件入口点
│   ├── server/
│   │   └── mcp-server.ts        # MCP 服务器核心
│   ├── tools/                   # 工具实现
│   ├── types/
│   │   └── index.ts             # 类型定义
│   └── utils/
│       ├── config.ts            # 配置管理
│       └── logger.ts            # 日志系统
├── docs/                        # 文档
├── logs/                        # 日志文件
├── dist/                        # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```

### 启动服务器

```bash
npm start
```

## API 端点

服务器运行在 `http://localhost:3001`，提供以下端点：

### 健康检查

```bash
GET /health
```

### 服务器信息

```bash
GET /info
```

### 服务器状态

```bash
GET /status
```

### MCP JSON-RPC 端点

```bash
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

### 可用工具列表

```bash
GET /tools
```

## 配置

项目使用 `cline-config.json` 文件进行配置。首次运行时会自动创建默认配置。

### 默认配置

```json
{
  "server": {
    "port": 3001,
    "host": "localhost",
    "autoStart": true
  },
  "tools": {
    "file": {
      "enabled": true,
      "allowedExtensions": [".txt", ".md", ".js", ".ts", ".json"],
      "maxFileSize": 10485760
    },
    "shell": {
      "enabled": true,
      "allowedCommands": ["ls", "pwd", "cat", "echo"],
      "timeout": 30000
    },
    "edit": {
      "enabled": true,
      "createBackup": true
    }
  },
  "ui": {
    "theme": "auto",
    "fontSize": 14,
    "showLineNumbers": true
  },
  "security": {
    "workspaceRestriction": true,
    "allowedPaths": [],
    "blockedPaths": ["/etc", "/usr/bin", "/bin"]
  }
}
```

## 开发

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 和 Prettier 配置
- 编写单元测试
- 提交前运行 `npm run lint` 和 `npm test`

### 测试

```bash
# 运行测试
npm test

# 运行测试并监听文件变化
npm run test:watch

# 生成测试覆盖率报告
npm run test:coverage
```

### 构建和发布

```bash
# 构建生产版本
npm run build

# 检查构建输出
ls -la dist/
```

## 使用示例

### 基本工具调用

```bash
# Ping 测试
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "ping",
      "arguments": {
        "message": "Hello World"
      }
    }
  }'
```

### 获取服务器信息

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "server_info"
    }
  }'
```

## 架构设计

### MCP 服务器架构

- **Express.js**: HTTP 服务器框架
- **TypeScript**: 类型安全的开发体验
- **JSON-RPC 2.0**: 标准的远程过程调用协议
- **工具系统**: 可扩展的工具注册和调用机制
- **安全层**: 路径验证、权限控制、工作目录限制

### 工具系统

工具是 MCP 服务器的核心功能，每个工具包含：

- **名称和描述**: 工具的标识和说明
- **输入模式**: JSON Schema 定义的参数验证
- **处理函数**: 异步的工具执行逻辑

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 相关项目

- [Cline (VSCode 插件)](https://github.com/HybridTalentComputing/cline-chinese)
- [Cherry Studio](https://github.com/CherryHQ/cherry-studio)
- [vscode-mcp-server](https://github.com/juehang/vscode-mcp-server)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 联系方式

- 项目主页: https://github.com/Alan-88/cline-for-cherry-studio
- 问题反馈: https://github.com/Alan-88/cline-for-cherry-studio/issues

---

*注意: 这是一个正在开发中的项目，功能可能不完整。请查看 TODO.md 了解当前进展和计划。*
