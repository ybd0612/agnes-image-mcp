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

## MCP 深度审查结论（2026-09-02）

当前没有确认会阻断 MCP 握手的 P0 协议错误；但发布前应优先处理以下 P1：MCP 暴露 schema 未保持 strict、重试无条件覆盖认证/参数/响应错误、下载缺少 DNS/IP 级 SSRF 防护、路径沙箱未拒绝符号链接、下载响应先完整读入内存且无超时、下载仅信任 Content-Type、上游响应体无大小上限。

P1 还包括：单图返回结构与 API 文档不一致、批量 item.id 必填与文档冲突、stop-on-error 时未执行项统计语义不清、validate_image 错误码与文档不一致、网络错误统一误报为超时。

P2 优化方向：迁移 SDK 的 registerTool、增加 outputSchema/structuredContent、补齐工具描述与 annotations、增加 SIGTERM/SIGINT 生命周期收尾、补齐下载/校验/重试/批量/MCP 入口测试，并清理文档中的“尚未实现”状态描述。

本轮复核：Vitest 4.1.11（3 文件、10 测试）通过，tsc --noEmit 通过；本轮仅审查，未修改业务源码。

## 下一步

按 P1 安全与契约问题完成一轮小范围修复，再补测试和文档同步；真实 API 仅在明确 opt-in 时调用。
