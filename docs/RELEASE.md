# GitHub 开源发布清单（规划）

> 📚 **本文档隶属 [文档总纲](README.md)** — 关键事实以总纲 §2 SSOT 为准；修改本文档须遵守总纲 §3 同步铁律。

## 仓库初始化

- 仓库名：`agnes-image-mcp`；
- 许可证：MIT；
- 默认分支保护和 Issue/PR 模板；
- README 首屏说明当前项目定位和支持范围；
- `.env.example` 仅包含占位符；
- `.gitignore` 排除 `.env`、输出图片、日志、构建产物和本地路径。

## 技术发布门禁

- TypeScript 类型检查通过；
- 单元测试和 Agnes mock 集成测试通过；
- stdio MCP 启动和工具调用冒烟测试通过；
- Windows、macOS、Linux 路径行为至少完成静态检查；
- npm lockfile 与 package.json 一致；
- `npm pack --dry-run` 不包含密钥、真实素材和测试私密数据；
- 依赖许可证和漏洞扫描通过；
- 版本号、CHANGELOG 和 Node.js 版本要求明确。

## 文档发布门禁

- README 安装、配置和 MCP 客户端示例可复现；
- API、RPM、错误码和安全文档同步；
- Agnes 官方接口来源和链接有效；
- 明确免费版 default 限制：1K=20 RPM、2K=10 RPM、3K=1 RPM、4K=1 RPM；
- 明确限流只覆盖单 MCP 进程；
- 明确 MIT 不代表 Agnes API 或模型输出授权；
- 提供贡献指南和安全问题报告入口。

## 首次发布建议

1. 先发布 `0.1.0`，标注实验性 API；
2. 收集至少一个 `dsp` 和一个非视频项目的接入反馈；
3. 工具 schema 稳定后再发布 `1.0.0`；
4. 发生破坏性变更时使用 major 版本并更新迁移说明。
