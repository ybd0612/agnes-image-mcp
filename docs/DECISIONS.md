# 实施前协议决策记录

## D-001：配置最小化

- 必需：`AGNES_API_KEY`。
- 默认模型：`AGNES_MODEL`，缺省为 `agnes-image-2.5-flash`。
- Endpoint 固定官方默认地址；仅允许测试代码通过依赖注入覆盖，不暴露给 MCP 调用方。

## D-002：第一版统一生成工作流

- 对外仅暴露 `generate_images`，使用 `items[]`；一项表示单张，多项表示批量。
- 每项支持 `prompt`（必填）、`model?`、`size?`、`ratio?`、`images?`；`size` 默认 `1K`，`ratio` 默认 `1:1`。
- 生成结果自动下载到当前工作目录的 `output/`，随后校验 MIME、图片魔数和大小；不对外暴露独立下载/校验工具。
- 第一版不暴露 `output`、`outputPath`、`concurrency` 等实现参数；不依赖 Agnes 官方 `n` 字段。
- P0 仅接受 `1K`、`2K`、`3K`、`4K`，精确尺寸后续再评估。

## D-003：免费 default 批量语义与限流

- 服务定位为 Agnes 免费用户组 `default`，不允许调用方通过参数伪造用户组。
- 默认 `continueOnError=false`；第一版同步等待、串行执行，最多 10 项，不实现异步 job 队列。
- 每次实际上游请求都要获取对应 size 的 limiter 令牌，使用实际 RPM：1K=20、2K=10、3K=1、4K=1。
- 失败请求不退还额度；重试请求视为新的实际上游请求，同样受限流保护。

## D-004：文件与网络边界

- 生成结果必须通过 HTTPS URL 下载到 `process.cwd()/output`，不接受调用方任意输出路径。
- 下载完成后校验响应 MIME 与图片魔数，限制响应大小；只有校验成功才写入最终文件。
- 路径默认限制在 `process.cwd()` 沙箱内，拒绝绝对路径、`..`、符号链接和覆盖已有文件。
- 下载限制响应大小、超时、重定向次数，并逐跳检查 SSRF。

## D-005：发布质量门禁

- 无真实 API Key 的 mock 测试必须通过。
- stdout 只能输出 MCP 协议，日志写 stderr。
- 发布前执行类型检查、测试、密钥扫描、许可证扫描和 npm pack 内容检查。
