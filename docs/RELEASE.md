# GitHub / npm 开源发布清单

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
- npm 包内容检查与 tarball clean-install 冒烟测试通过；
- 依赖许可证和漏洞扫描完成（当前仓库未配置自动扫描命令，发布前执行人工检查并记录结果）；
- 版本号、CHANGELOG 和 Node.js 版本要求明确。

## 文档发布门禁

- README 安装、配置和 MCP 客户端示例可复现；
- API、RPM、错误码和安全文档同步；
- Agnes 官方接口来源和链接由维护者在发布前人工复核；
- 明确免费版 default 限制：1K=20 RPM、2K=10 RPM、3K=1 RPM、4K=1 RPM；
- 明确限流只覆盖单 MCP 进程；
- 明确 MIT 不代表 Agnes API 或模型输出授权；
- 提供贡献指南和安全问题报告入口。

## 本地发布前操作顺序

> 本仓库当前自动化命令覆盖类型检查、测试、构建、版本校验、包内容检查和 stdio/tarball 冒烟；许可证、漏洞、密钥/隐私内容和官方链接检查目前是发布前人工检查，不要将其描述为已由脚本自动完成。

1. 确认当前 npm 版本：`npm view agnes-image-mcp version --registry=https://registry.npmjs.org`；
2. 确认 `package.json.repository.url` 与 GitHub 仓库匹配；
3. 在本地执行：`npm ci`、`npm test`、`npm run typecheck`、`npm run build`、`npm run verify-release`、`npm run pack-check`、`npm run smoke`、`npm run smoke:tarball`；
4. 检查 `npm pack --dry-run` 仅包含必要文件；
5. 修改版本后推送标签，例如 `npm version patch`、`git push origin master --tags`；
6. 使用已配置的 npm Trusted Publisher，由 GitHub Actions 自动发布到 npm；
7. 发布后验证：`npm view agnes-image-mcp version --registry=https://registry.npmjs.org`，并使用 `npx -y agnes-image-mcp@latest` 测试。

当前已发布版本为 `0.1.9`。发生破坏性变更时使用 major 版本并更新迁移说明。
