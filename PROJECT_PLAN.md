# Agnes Image MCP 项目规划

> 📚 **本文档隶属 [文档总纲](docs/README.md)** — 关键事实以总纲 §2 SSOT 为准；修改本文档须遵守总纲 §3 同步铁律。
>
> 状态：规划阶段，仅包含设计文档，尚未实现代码。
>
> 目标：构建一个面向多个项目和 AI Agent 的通用 Agnes Image MCP 服务，并以开源项目形式发布到 GitHub。

## 1. 项目决策

| 项目 | 决策 |
|---|---|
| 项目名 | `agnes-image-mcp` |
| 目标目录 | `C:\\Users\\ybd06\\Documents\\project\\agnes-image-mcp` |
| 技术语言 | TypeScript |
| MCP 传输 | stdio |
| 开源协议 | MIT |
| 第一版范围 | 单图生成、批量生成、图片下载、图片校验 |
| 服务配置 | `AGNES_API_KEY`、`AGNES_MODEL` |
| API 默认地址 | `https://api.agnes-ai.cn/v1/images/generations` |
| 默认模型 | `agnes-image-2.5-flash` |
| 当前账户 | 免费版 `default` |

## 2. 官方接口基线

Agnes Image 2.5 Flash 官方接口：

```text
POST https://api.agnes-ai.cn/v1/images/generations
```

文生图必填：`model`、`prompt`、`size`。

可选或场景参数：

- `ratio`：`1:1`、`3:4`、`4:3`、`16:9`、`9:16`、`2:3`、`3:2`、`21:9`；
- 图生图/多图合成：通过 `extra_body.image` 传入参考图；具体来源校验遵循安全边界。
- URL 输出：`extra_body.response_format = "url"`；
- Base64 输出：文生图可使用 `return_base64 = true`，图生图使用 `extra_body.response_format = "b64_json"`；
- 不在顶层放置 `response_format`；不传递 `tags: ["img2img"]`。

## 3. 免费版 RPM 基线

服务端默认按免费版 `default` 执行限流。RPM 是按分辨率档位分别计算，不是统一一个全局值。

| size | default RPM | 最小请求间隔 |
|---|---:|---:|
| `1K` | 20 | 3 秒 |
| `2K` | 10 | 6 秒 |
| `3K` | 1 | 60 秒 |
| `4K` | 1 | 60 秒 |

限流设计：

1. 按 `size` 分桶，分别维护最近请求时间；
2. 默认串行执行，避免同一进程内突发请求；
3. 每次请求前等待对应档位的间隔；
4. 服务端 429 时遵循 `Retry-After`，否则指数退避；
5. 限流只保护本 MCP 进程，不能宣称跨进程全局限流；
6. 多实例共享额度属于后续问题，第一版文档必须明确这一限制。

## 4. 配置边界

### 必需配置

```text
AGNES_API_KEY
```

### 默认配置

```text
AGNES_MODEL=agnes-image-2.5-flash
```

### Endpoint 边界

Endpoint 固定官方默认地址，不作为环境变量或工具参数暴露；仅允许测试代码通过依赖注入覆盖。

### 调用方参数

以下字段全部由工具调用方传入，不进入环境变量：

```text
model
prompt
size
ratio
images
output
outputPath
concurrency
continueOnError
```

## 5. MCP 工具范围

### `generate_image`

生成单张图片，支持文生图、图生图和多图合成。

输入核心字段：

```json
{
  "prompt": "...",
  "size": "1K",
  "ratio": "9:16",
  "model": "可选",
  "images": [],
  "output": "url"
}
```

返回标准结果：

```json
{
  "success": true,
  "provider": "agnes",
  "model": "agnes-image-2.5-flash",
  "url": "https://...",
  "base64": null,
  "revisedPrompt": null,
  "created": 1780000000
}
```

### `generate_images`

批量生成。第一版默认串行，单项独立重试，单项失败不丢失其他成功结果。

```json
{
  "items": [
    { "id": "scene-01", "prompt": "...", "size": "1K", "ratio": "9:16" }
  ],
  "continueOnError": false,
  "concurrency": 1
}
```

### `download_image`

将 HTTPS URL 图片保存到调用方明确指定的本地路径。第一版不接受 Data URI 或 Base64 作为下载输入，默认不落盘。

安全要求：

- 规范化目标路径；
- 拒绝系统目录和明显危险目录；
- 防止路径越界；
- 限制重定向次数；
- 仅允许 `https`（本地测试可显式放宽）；
- 限制响应大小；
- 不自动删除或覆盖无关文件。

### `validate_image`

校验沙箱内本地图片是否可读取，并返回格式、宽度、高度和文件大小。第一版不接受 URL/Data URI，不承担图片压缩、裁剪或重编码。

## 6. 错误码

统一返回以下错误类别：

```text
INVALID_ARGUMENT
MISSING_API_KEY
UNSUPPORTED_MODEL
UNSUPPORTED_SIZE
UNSUPPORTED_RATIO
MISSING_REFERENCE_IMAGE
UPSTREAM_AUTH_ERROR
UPSTREAM_RATE_LIMIT
UPSTREAM_TIMEOUT
UPSTREAM_BAD_RESPONSE
IMAGE_DOWNLOAD_FAILED
IMAGE_TOO_LARGE
INVALID_IMAGE
PATH_NOT_ALLOWED
FILE_WRITE_FAILED
```

错误信息不得包含 API Key、Authorization 请求头或完整敏感 URL 查询参数。

## 7. 核心架构原则

```text
MCP Tools
  ↓
Input Schemas / Validation
  ↓
Image Service
  ↓
Agnes Provider
  ↓
Rate Limiter + Retry Policy
  ↓
Agnes API
```

调用方项目负责业务提示词、业务文件命名和业务数据回填；MCP 不修改 `story.json`，不负责 TTS、字幕、视频或 Remotion。

## 8. 版本范围

### P0：第一版必须有

- stdio MCP 服务启动；
- `generate_image`；
- `generate_images`；
- 参数校验；
- 免费版 default RPM 限流；
- 429、超时、网络错误重试；
- URL/Base64 标准化；
- `download_image`；
- `validate_image`；
- 日志脱敏；
- 单元测试和 API mock 测试；
- README、LICENSE、`.env.example`、安全说明。

### P1：第一版稳定后

- 断点恢复；
- 批量任务状态查询；
- 更细粒度的缓存策略；
- 图片哈希去重；
- 多 Provider 接口；
- 真实 API 集成测试开关；
- 可配置并发策略。

### P2：暂不规划实现

- HTTP/SSE 传输；
- Web 管理界面；
- 数据库任务队列；
- 多租户额度系统；
- 自动修改业务项目文件；
- 视频、TTS、字幕编排。
