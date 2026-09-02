# 本轮实施概览

## 已完成

- 以 `docs/DECISIONS.md` 为最高优先级，新增 `docs/README.md` 文档总纲、SSOT、冲突登记和同步铁律。
- 同步修正 `PROJECT_PLAN.md`、`docs/ARCHITECTURE.md`、`docs/API.md`、`docs/RATE_LIMITING.md`、`docs/SECURITY.md`，并更新 QA、发布、项目索引与概览文档。
- 文档统一为冻结方案：四个工具、`items[]`、`output=url/base64`、四档 size、批量默认停止与串行、HTTPS 下载、本地路径校验、default RPM 和失败不退款。
- 源码统一更新类型、Schema、Provider、配置、批量服务、下载安全和本地校验入口；移除公开 `AGNES_ENDPOINT` 配置和工具字段。
- 依赖恢复后 TypeScript 类型检查通过；旧字段扫描仅剩 Provider 内部读取上游 `b64_json` 的兼容映射。

## 验证与遗留

- `tsc --noEmit`：通过。
- Vitest：已升级至 4.1.11，完整测试通过（3 个文件、10 个测试）。
- TypeScript：`tsc --noEmit` 通过。
- 项目已初始化 Git；`.neuralmemory/`、`.workbuddy/`、`node_modules/` 均已加入忽略，不会提交。
- 本轮使用用户临时注入的 `AGNES_API_KEY` 发起一次最小真实请求：成功返回 1 张 URL 图片；未记录密钥、图片 URL 或请求内容。
- 提交：`56089f4 修复测试环境并收敛项目依赖`、`fad3050 更新验证结果概览`。

## 下一步

可在当前 shell 显式注入 `AGNES_API_KEY` 后，再执行一次带明确 prompt 的真实 API opt-in 测试；密钥不会写入仓库。
