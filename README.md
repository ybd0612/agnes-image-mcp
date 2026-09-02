# agnes-image-mcp

> 当前状态：文档一致性已完成；源码实现尚未开始。
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

## 规划阶段说明

当前不创建源码、不安装依赖、不注册 MCP、不写入 WorkBuddy MCP 配置，也不调用 Agnes API。开始实现前需要再次核对 Agnes 官方接口和依赖版本，并按任务依赖顺序实施。
