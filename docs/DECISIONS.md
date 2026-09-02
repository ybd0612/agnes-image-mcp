# 实施前协议决策记录

## D-001：配置最小化

- 必需：`AGNES_API_KEY`。
- 默认模型：`AGNES_MODEL`，缺省为 `agnes-image-2.5-flash`。
- Endpoint 固定官方默认地址；仅允许测试代码通过依赖注入覆盖，不暴露给 MCP 调用方。

## D-002：工具输入稳定化

- 单图与批量统一使用 `prompt`、`model?`、`size`、`ratio?`、`images?`、`output?`。
- 批量使用 `items[]`，第一版不依赖 Agnes 官方 `n` 字段。
- `output` 统一为 `url` 或 `base64`，内部映射 Agnes 的官方字段。
- P0 仅接受 `1K`、`2K`、`3K`、`4K`，精确尺寸后续再评估。

## D-003：批量语义

- 默认 `continueOnError=false`。
- 默认 `concurrency=1`。
- 每次实际上游请求都要获取对应 size 的 limiter 令牌。
- 失败请求不退还额度。

## D-004：文件与网络边界

- `download_image` 只接受 HTTPS URL，不接受 Data URI。
- `validate_image` P0 只校验本地路径。
- 路径默认限制在 `process.cwd()` 沙箱内，拒绝绝对路径、`..`、符号链接和覆盖已有文件。
- 下载限制响应大小、超时、重定向次数，并逐跳检查 SSRF。

## D-005：发布质量门禁

- 无真实 API Key 的 mock 测试必须通过。
- stdout 只能输出 MCP 协议，日志写 stderr。
- 发布前执行类型检查、测试、密钥扫描、许可证扫描和 npm pack 内容检查。
