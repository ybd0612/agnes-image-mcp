# MCP API 设计

> 📚 **本文档隶属 [文档总纲](README.md)** — 关键事实以总纲 §2 SSOT 为准；修改本文档须遵守总纲 §3 同步铁律。
>
> 规划阶段文档，工具协议尚未实现。

## 通用约定

所有工具 schema 使用 strict 模式，拒绝未声明字段。工具结果统一包装为：

```json
{"code":"OK","message":"success","data":{}}
```

MCP 响应使用 `content: [{ type: "text", text: JSON.stringify(envelope) }]`。失败时同时设置 `isError: true`。

生成工具统一使用 `prompt`、`model?`、`size`、`ratio?`、`images?`、`output?`；`size` 仅接受 `1K`、`2K`、`3K`、`4K`，`output` 仅接受 `url` 或 `base64`。Endpoint 固定官方默认地址，不是工具参数。

## generate_image

单次固定生成一张图片。

### 输入

```json
{
  "prompt": "string，必填",
  "model": "string，可选，默认使用 AGNES_MODEL",
  "size": "1K | 2K | 3K | 4K",
  "ratio": "官方支持比例，可选",
  "images": ["参考图，可选"],
  "output": "url | base64，可选，默认 url"
}
```

### 输出

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "model": "agnes-image-2.5-flash",
    "size": "1K",
    "output": "url",
    "url": "https://...",
    "base64": null,
    "revisedPrompt": null
  }
}
```

服务层将 `output` 映射到 Agnes 官方字段：URL 使用 `extra_body.response_format=url`；文生图 Base64 使用 `return_base64=true`；图生图 Base64 使用 `extra_body.response_format=b64_json`。

## generate_images

批量生成，第一版使用 `items[]`，不使用官方 `n` 字段。每个 item 具有单图生成字段，可选 `id`；批量级可选 `continueOnError` 和 `concurrency`。

### 输入

```json
{
  "items": [
    {"id":"scene-01","prompt":"...","size":"1K","ratio":"9:16","output":"url"}
  ],
  "continueOnError": false,
  "concurrency": 1
}
```

默认串行、默认 `continueOnError=false`；任一项失败后停止后续项目，并返回已完成项与失败项。显式传入 `true` 才继续处理剩余项目。每次真实上游请求独立获取对应 size 令牌，失败不退款。

### 输出

```json
{
  "code": "OK_WITH_ERRORS",
  "message": "部分生成成功",
  "data": {
    "results": [
      {"id":"scene-01","success":true,"image":{}},
      {"id":"scene-02","success":false,"error":{"code":"UPSTREAM_TIMEOUT","message":"请求超时"}}
    ],
    "requestedCount": 2,
    "succeededCount": 1,
    "failedCount": 1
  }
}
```

## download_image

将公网 HTTPS 图片 URL 保存到调用方明确指定的本地路径。不接受 Data URI 或其它 scheme。

### 输入

```json
{"url":"https://...","outputPath":"./public/images/result.png","maxBytes":10485760}
```

### 输出

```json
{"code":"OK","message":"success","data":{"path":"...","bytes":123456,"mimeType":"image/png","sha256":"..."}}
```

遵循路径沙箱、响应大小、超时、重定向和 SSRF 约束，不覆盖已有文件。

## validate_image

第一版仅校验本地路径，不接受 HTTPS URL、Data URI 或其它网络来源。

### 输入

```json
{"path":"./image.png","maxBytes":10485760}
```

### 输出

```json
{"code":"OK","message":"valid image","data":{"valid":true,"format":"png","width":736,"height":1312,"bytes":123456,"reason":null}}
```

校验失败使用 `code=INVALID_IMAGE`，仍返回可安全展示的 metadata 和 reason，不抛出未封装异常。
