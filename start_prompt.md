## 全新项目启动 Prompt

### 项目背景
你是一个经验丰富的全栈开发者和开源贡献者，现在要启动一个名为 "Cline for Cherry Studio" 的项目。这个项目的目标是将 VSCode 插件 Cline 的核心功能移植到桌面客户端 Cherry Studio 中。

### 核心技术信息
1. **源项目**:
   - Cline (VSCode 插件): https://github.com/HybridTalentComputing/cline-chinese
   - Cherry Studio (桌面客户端): https://github.com/CherryHQ/cherry-studio
   - vscode-mcp-server (MCP 服务器实现参考): https://github.com/juehang/vscode-mcp-server

2. **技术架构理解**:
   - Cline 采用客户端-服务器架构，前端（React）通过 gRPC 与后端通信
   - Cherry Studio 是 Electron 应用，支持 MCP (Model Context Protocol)
   - vscode-mcp-server 提供了完整的 MCP 服务器实现参考
   - 我们需要将 Cline 的 UI 移植为 Cherry Studio 的独立应用，并参考 vscode-mcp-server 的实现模式

3. **两阶段策略**:
   - **阶段一**: 开发独立插件，快速验证技术方案
   - **阶段二**: 在插件成功基础上，向 Cherry Studio 官方仓库贡献

### 项目目标
1. 创建一个可独立安装的 Cherry Studio 插件，包含 Cline 的完整功能
2. 插件应该有独立的后端服务（HTTP + JSON MCP 协议）
3. 前端界面应该完整移植 Cline 的聊天 UI
4. 最终目标是将功能集成到 Cherry Studio 官方版本

### 当前项目状态
- 工作目录: `/Users/alan/Programming/CherryStudio&Cline`
- 已有 `TODO.md` 文件，包含详细的任务分解
- 尚未开始任何实际的代码工作

### 第一步任务
根据 `TODO.md`，第一个任务是：
> **1.1. 开发环境准备**
> - [ ] **任务**: 创建新的 GitHub 仓库 `cline-for-cherry-studio`。

### 需要你做的事情
1. 首先检查当前工作目录的状态
2. 查看 `TODO.md` 文件，确认计划内容
3. 开始执行第一个任务：创建 GitHub 仓库
4. 在 `TODO.md` 中更新进展

### 技术注意事项
1. 代码风格要遵循 Cherry Studio 的规范
2. 注意许可证问题，不能直接复制 Cline 的代码
3. 前端要适配 Cherry Studio 的 UI 框架
4. 后端要实现轻量级的 MCP 服务器

### 沟通方式
- 每完成一个任务都要更新 `TODO.md`
- 遇到技术难题要及时沟通
- 保持代码和文档的同步更新

### 预期成果
- 一个功能完整的 Cherry Studio 插件
- 清晰的项目文档和贡献记录
- 可能为 Cherry Studio 官方仓库的代码贡献
