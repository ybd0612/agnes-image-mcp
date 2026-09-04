# 本轮实施概览

## 已完成

- 以 `docs/DECISIONS.md` 为最高优先级，新增 `docs/README.md` 文档总纲、SSOT、冲突登记和同步铁律。
- 同步修正 `PROJECT_PLAN.md`、`docs/ARCHITECTURE.md`、`docs/API.md`、`docs/RATE_LIMITING.md`、`docs/SECURITY.md`，并更新 QA、发布、项目索引与概览文档。
- 第一版已收敛为单一 `generate_images` 工具：`items[]` 一项表示单张、多项表示批量；默认 1K/1:1，免费 `default` 实际 RPM 限流，自动下载和校验到 `output/`，最多 10 项、同步串行，不实现异步队列。
- 源码统一更新类型、Schema、Provider、配置、批量服务、下载安全和本地校验入口；移除公开 `AGNES_ENDPOINT` 配置和工具字段。
- 依赖恢复后 TypeScript 类型检查通过；旧字段扫描仅剩 Provider 内部读取上游 `b64_json` 的兼容映射。

## 验证与遗留

- `tsc --noEmit`：通过。
- Vitest：固定至 3.2.4，完整测试通过（7 个文件、20 个测试）。
- TypeScript：`tsc --noEmit` 通过。
- 项目已初始化 Git；`.neuralmemory/`、`.workbuddy/`、`node_modules/` 均已加入忽略，不会提交。
- 本轮使用用户临时注入的 `AGNES_API_KEY` 发起一次最小真实请求：成功返回 1 张图片并自动下载、校验到 `output/`；未记录密钥、图片 URL 或请求内容。
- 提交：`56089f4 修复测试环境并收敛项目依赖`、`fad3050 更新验证结果概览`。

## 三批优化完成（2026-09-02）

- 第一批安全底座：DNS/IP 级 SSRF、符号链接与 reparse point 防护、下载超时、流式大小限制、Content-Type 与图片魔数校验、上游响应上限。
- 第二批契约统一：可恢复错误重试、单图返回、批量 `id` 与 skipped 统计、`INVALID_IMAGE` 错误码、网络错误分类。
- 第三批 MCP 体验：`registerTool`、`outputSchema`、`structuredContent`、工具描述与 annotations、SIGINT/SIGTERM 优雅退出。

## 发布进展

- 发布改造已完成：npm `files` 白名单、Node >=20、`prepack`、CHANGELOG、发布审计、pack-check、stdio smoke 和版本校验均已加入。
- 发布门禁已纳入 `npm test`、typecheck、build、verify-release、pack-check、stdio smoke 和 clean-install tarball smoke；smoke 统一验证唯一的 `generate_images` 工具契约。
- 发布门禁中的 Vitest 依赖已固定为兼容组合 `vite=7.1.12`、`vitest=3.2.4`；验证命令使用项目锁定依赖，不依赖全局运行器。
- 已补齐 clean-install tarball 冒烟与 tag 发布工作流：`smoke:tarball` 从 npm tgz 安装后验证唯一的 `generate_images` 工具，`.github/workflows/publish.yml` 仅 tag/手动触发并使用 npm Trusted Publishing OIDC，未包含真实凭据。
- 已配置 GitHub remote `git@github.com:ybd0612/agnes-image-mcp.git`，并成功推送 `master` 至 `origin/master`。
- npm 默认源仍为 `https://registry.npmmirror.com`；官方发布已通过 Trusted Publishing 完成，不依赖 `NPM_TOKEN`。
- v0.1.3/v0.1.4 曾因审计步骤与旧标签代码失败；随后修复生产依赖审计、构建顺序和动态版本校验，并在 GitHub Actions 手动运行最新 master 成功发布 `0.1.7`。
- npm 官方当前版本：`0.1.7`，latest dist-tag 为 `0.1.7`；后续版本应升级 package.json 版本并推送对应 `v*` 标签触发 Publish。
- 英文和中文 README 已互相添加语言切换链接，入口分别为 `README.md` 与 `README.zh-CN.md`。
- `.github/workflows/publish.yml` 已切换到 GitHub OIDC：Node 24、`setup-node@v6`、关闭缓存、`npm publish --access public --provenance`；`package.json.repository.url` 已匹配 GitHub 仓库。
- Trusted Publisher 配置需要在 npm 包设置中填写用户 `ybd0612`、仓库 `agnes-image-mcp`、工作流文件 `publish.yml`，允许 `npm publish`。

## 下一步

后续版本按 `docs/RELEASE.md` 执行：升级版本、推送 `v*` 标签，由 GitHub Actions Trusted Publishing 自动发布；发布后核对 npm latest 与 GitHub Actions 结果。