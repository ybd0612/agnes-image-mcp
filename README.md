# agnes-image-mcp

> 当前状态：第一版源码已实现，安全底座、契约统一和 MCP 体验优化均已完成；测试与类型检查通过。
>
> 关键事实统一以 [`docs/README.md`](docs/README.md) 的 SSOT 与 [`docs/DECISIONS.md`](docs/DECISIONS.md) 为准。

一个面向多个项目和 AI Agent 的 Agnes Image 通用 MCP 服务，目标是通过 MCP stdio 统一提供图片生成、批量生成、下载和校验能力。

## 当前决策

- TypeScript
- MCP stdio
- MIT License
- Node.js 20+
- 默认模型：`agnes-image-2.5-flash`
- 服务运行配置：`AGNES_API_KEY`、可选 `AGNES_MODEL`
- 第一版工具：`generate_image`、`generate_images`、`download_image`、`validate_image`

## 项目边界

本项目只负责通用图片能力：

```text
MCP 请求
→ 参数校验
→ Agnes API 调用
→ 限流 / 重试 / 错误标准化
→ URL / Base64 结果
→ 可选下载和图片校验
```

不负责故事 JSON、TTS、字幕、视频渲染、业务项目文件修改或数据库持久化。

## 文档导航

| 文档 | 内容 |
|---|---|
| `PROJECT_PLAN.md` | 产品范围、官方接口基线、RPM、版本规划 |
| `docs/ARCHITECTURE.md` | 目录结构、模块职责、数据模型、调用时序 |
| `docs/API.md` | MCP 工具协议和参数设计 |
| `docs/RATE_LIMITING.md` | 免费版 default RPM 与限流策略 |
| `docs/SECURITY.md` | API Key、SSRF、路径和开源安全边界 |
| `docs/QA_PLAN.md` | 测试矩阵与发布门禁 |
| `docs/CONTRIBUTING.md` | 开源贡献约定（规划） |
| `docs/RELEASE.md` | GitHub 发布检查清单（规划） |
| `docs/sequence-diagram.mermaid` | 调用时序图 |
| `docs/class-diagram.mermaid` | 类与模块关系图 |

## 当前实现说明

当前版本已包含 TypeScript 源码、MCP stdio 入口、四个工具、安全边界和自动化测试。运行前设置 `AGNES_API_KEY`；可选设置 `AGNES_MODEL` 覆盖默认模型。项目不会自动写入 WorkBuddy MCP 配置，也不会在没有调用方请求时访问 Agnes API。

```bash
npm install
npm run build
AGNES_API_KEY=your-key node dist/index.js
```
