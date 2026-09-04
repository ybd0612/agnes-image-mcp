# MCP API 设计

> 本文档隶属 [文档总纲](README.md)，关键事实以 `docs/DECISIONS.md` 与总纲 SSOT 为准。
>
> 第一版定位：为 Agnes 免费用户组 `default` 提供一个简单的图片生成工作流。对外只暴露一个工具，内部自动限流、下载和校验。

## 通用约定

工具 schema 使用 strict 模式，拒绝未声明字段。结果统一包装为：

```json
{"code":"OK","message":"success","data":{}}
```

失败时返回稳定错误码和可操作的阶段信息，不暴露 API Key。

## generate_images

统一生成图片工具。`items` 只有一项时表示单张生成，多项时表示批量生成。第一版同步等待、串行处理，最多 10 项；不提供异步 job 队列。

### 输入

```json
{
  "items": [
    {
      "id": "scene-01",
      "prompt": "一只坐在窗边的猫",
      "model": "agnes-image-2.5-flash",
      "size": "1K",
      "ratio": "1:1",
      "images": ["https://example.com/reference.png"]
    }
  ],
  "continueOnError": false
}
```

只有 `items` 和每项的 `prompt` 必填。可选参数默认值：

| 参数 | 默认值 | 说明 |
|---|---|---|
| `model` | `AGNES_MODEL`，缺省为 `agnes-image-2.5-flash` | 服务配置决定默认模型 |
| `size` | `1K` | 仅支持 `1K`、`2K`、`3K`、`4K` |
| `ratio` | `1:1` | 支持官方八种比例 |
| `continueOnError` | `false` | 失败后停止后续任务 |
| `images` | 不传 | 图生图/多图合成时传公共 HTTPS URL 或 Data URI |

第一版不暴露 `output`、`outputPath`、`concurrency`、`tier` 等参数。输出统一自动下载到当前工作目录的 `output/`，用户组固定为免费 `default`。

### 内部流程

```text
参数校验 → 按 size 限流 → 调 Agnes 生成 → 下载 HTTPS URL → 校验 MIME/魔数/大小 → 写入 output/ → 返回结果
```

下载和校验失败不会生成有效的最终文件；每个任务返回失败阶段 `generation` 或 `download`。

### 输出

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "requestedCount": 1,
    "succeededCount": 1,
    "failedCount": 0,
    "skippedCount": 0,
    "results": [
      {
        "index": 0,
        "id": "scene-01",
        "success": true,
        "image": {"model":"agnes-image-2.5-flash","size":"1K","output":"url","url":"https://..."},
        "file": {"path":"output/agnes-...png","bytes":123456,"mimeType":"image/png","sha256":"...","validated":true}
      }
    ]
  }
}
```

`image` 中的 `output` 和 `url` 是服务内部对 Agnes URL 响应的标准化元数据，不是调用方可配置的输出选项；调用方应使用 `file.path` 获取已落盘图片。远程 URL 可能有时效，不能替代本地文件。

`file.validated=true` 表示已完成文件大小、响应 MIME 和图片魔数校验，不表示图片内容质量或提示词语义一定符合预期。当前不会解码图片，也不会返回真实宽高。

### 免费版 RPM

服务端使用 Agnes 免费用户组 `default` 的实际 RPM：

| `size` | 实际 RPM | 最小间隔 |
|---|---:|---:|
| `1K` | 20 | 3 秒 |
| `2K` | 10 | 6 秒 |
| `3K` | 1 | 60 秒 |
| `4K` | 1 | 60 秒 |

批量任务按顺序排队，不会一次并发发起全部请求。100 个 1K 请求仅按限流容量就至少需要约 5 分钟，实际时间还包括生成、下载和重试耗时。限流只在当前 MCP 进程内生效。

## Agnes 请求映射

服务端固定调用：

```text
POST https://api.agnes-ai.cn/v1/images/generations
```

- `model`、`prompt`、`size` 直接传给官方接口；
- `ratio` 按需传递；
- `images` 映射到 `extra_body.image`；
- URL 输出使用 `extra_body.response_format=url`；
- 不把 `response_format` 放在顶层，也不传 `tags: ["img2img"]`。

## 错误阶段

| 阶段 | 示例错误 | 含义 |
|---|---|---|
| `generation` | `UPSTREAM_RATE_LIMIT`、`UPSTREAM_TIMEOUT` | 上游生成或限流失败 |
| `download` | `IMAGE_DOWNLOAD_FAILED`、`IMAGE_TOO_LARGE` | 图片 URL 下载失败 |
| `download` | `INVALID_IMAGE` | 下载内容不是受支持的 PNG/JPEG/GIF/WebP |
| `download` | `FILE_WRITE_FAILED`、`PATH_NOT_ALLOWED` | 本地安全边界或写入失败 |
