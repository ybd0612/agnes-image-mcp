# Agnes Image MCP 测试与质量门禁

> 📚 **本文档隶属 [文档总纲](README.md)** — 关键事实以总纲 §2 SSOT 为准；修改本文档须遵守总纲 §3 同步铁律。

## 1. P0 验收标准

- stdio MCP 可被客户端启动并完成握手；
- 单一 `generate_images` 工具 schema 与错误响应稳定；
- 文生图请求严格包含 `model`、`prompt`、`size`；
- 图生图使用 `extra_body.image`，不传 `tags`；
- `response_format` 不出现在请求顶层；
- 免费版 default RPM 按 size 分桶：1K=20、2K=10、3K=1、4K=1；
- 网络错误、超时和 429 按策略重试，认证错误不盲目重试；
- 批量任务支持单项失败并返回逐项结果；
- 下载器防止 SSRF、路径越界、超大响应和危险重定向；
- stdout 不输出业务日志或密钥，日志只写 stderr 且脱敏；
- 不提交 `.env`、真实 API Key、真实响应和个人素材。

## 2. 测试矩阵

| 模块 | 测试内容 | 级别 |
|---|---|---:|
| 配置 | 缺少 API Key、默认模型、Endpoint 仅测试依赖注入 | P0 |
| Schema | 缺 prompt、非法 size/ratio、图生图无 images | P0 |
| 请求映射 | URL/Base64、文生图/图生图、多图字段位置 | P0 |
| Provider | 成功、4xx、5xx、429、畸形 JSON | P0 |
| 限流 | 四个 size 档位间隔、批量不突发 | P0 |
| 重试 | Retry-After、指数退避、最大次数、不可重试错误 | P0 |
| 批量 | 全成功、部分失败、全部失败、继续执行 | P0 |
| 下载 | 仅 HTTPS、重定向、响应大小、URL 校验 | P0 |
| 路径 | 相对路径、绝对路径、越界、系统目录、覆盖行为 | P0 |
| 图片校验 | 仅本地 PNG/JPEG、损坏文件、尺寸和大小元数据 | P0 |
| MCP | 启动、握手、工具调用、错误 envelope | P0 |
| 安全 | 日志脱敏、stdout 协议纯净、密钥扫描 | P0 |
| 回归 | Node/TypeScript 版本、Windows 路径、空环境 | P1 |

## 3. Agnes mock 测试

所有自动化测试默认使用本地 HTTP mock，不消耗 Agnes 额度。必须断言：

1. Authorization 只来自服务端环境；
2. 请求体字段符合官方文档；
3. `size` 与 ratio 原样传递；
4. 参考图位于 `extra_body.image`；
5. URL 返回读取 `data[0].url`；
6. Base64 返回读取 `data[0].b64_json`；
7. 错误响应不泄露 API Key。

真实 API 测试必须是显式 opt-in，默认不运行，不在 CI 中使用真实密钥。

## 4. RPM 验证

不通过真实等待 60 秒验证，而是注入可控时钟或 limiter 时钟抽象，验证：

- 同一 size 连续请求必须等待对应间隔；
- 不同 size 使用独立桶；
- 批量默认串行；
- 429 的 Retry-After 不绕过 limiter；
- 多进程不共享状态的限制已在文档中声明。

## 5. 开源发布门禁

发布前必须通过：

- TypeScript 类型检查；
- 单元测试与 mock 集成测试；
- MCP stdio 冒烟测试；
- `npm pack --dry-run` 内容检查；
- 密钥和隐私数据扫描；
- `.gitignore` 检查；
- README 安装配置示例可复现；
- LICENSE、贡献指南、安全政策和变更日志存在；
- Windows 路径示例与 Linux/macOS 路径示例不混淆；
- 明确 Agnes 官方文档、额度和内容政策链接。

## 6. 已知风险

- 免费版 RPM 可能由上游动态调整，代码默认值必须可升级；
- 多进程/多机器限流无法由内存 limiter 统一保证；
- URL 图片可能失效，调用方应尽快下载或自行持久化；
- Base64 可能造成内存峰值，必须设置输入和输出大小上限；
- 下载功能天然涉及 SSRF 和文件写入风险，宁可拒绝不明确请求；
- Agnes 服务接口变化时只修改 Provider，不改工具协议。
