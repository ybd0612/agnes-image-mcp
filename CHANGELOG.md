# Changelog

All notable changes to this project are documented in this file.

## [0.1.8] - 2026-09-04

- 修正文档与第一版 `generate_images` 实际实现、测试及发布门禁之间的口径差异。
- 明确免费 `default` RPM、自动下载校验、重试边界和人工发布检查范围。

## [Unreleased]

## [0.1.10] - 2026-09-08

- 将用户组标识 `default` 作为兼容别名映射到配置模型，避免把它作为实际模型名发送给 Agnes。
- 明确 MCP schema、工具描述和 README 中“用户组”与“模型名”的区别。

## [0.1.7] - 2026-09-02

- Published `agnes-image-mcp@0.1.7` to npm.
- Enabled GitHub Actions npm Trusted Publishing with OIDC provenance.
- Unified MCP server version validation with `package.json`.

## [0.1.0] - 2026-09-02

- Initial release of the Agnes Image MCP stdio server.
- Added the initial image generation workflow with input validation, retry/rate-limit handling, automatic download, and local image validation.
- Added input validation, retry and rate-limit handling, and local file safety checks.
