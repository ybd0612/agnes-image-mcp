# Changelog

All notable changes to this project are documented in this file.

## [Unreleased] - 2026-09-04

- 第一版接口收敛为单一 `generate_images` 工具，使用 `items[]` 统一单张和批量生成。
- 面向 Agnes 免费用户组 `default`，按 1K/2K/3K/4K 实际 RPM 串行限流。
- 生成结果自动下载到 `output/`，下载后校验图片 MIME、魔数和大小。
- 默认 `size=1K`、`ratio=1:1`；最多 10 项；不实现异步 job 队列。

## [0.1.7] - 2026-09-02

- Published `agnes-image-mcp@0.1.7` to npm.
- Enabled GitHub Actions npm Trusted Publishing with OIDC provenance.
- Unified MCP server version validation with `package.json`.

## [0.1.0] - 2026-09-02

- Initial release of the Agnes Image MCP stdio server.
- Added the initial image generation workflow with input validation, retry/rate-limit handling, automatic download, and local image validation.
- Added input validation, retry and rate-limit handling, and local file safety checks.
