# Agnes Image MCP 架构设计

> 📚 **本文档隶属 [文档总纲](README.md)** — 关键事实以总纲 §2 SSOT 为准；修改本文档须遵守总纲 §3 同步铁律。

## 1. 目录规划

```text
agnes-image-mcp/
├── src/
│   ├── index.ts                 # stdio 启动入口
│   ├── server.ts                # MCP Server 与工具注册
│   ├── config.ts                # 环境变量与默认值
│   ├── errors.ts                # 统一错误码与错误信封
│   ├── schemas/
│   │   └── generate-images.ts   # 统一单图/批量参数 schema
│   ├── providers/
│   │   ├── image-provider.ts    # Provider 接口
│   │   └── agnes-provider.ts    # Agnes API 实现
│   ├── services/
│   │   ├── image-service.ts     # 业务编排与结果标准化
│   │   ├── batch-service.ts     # 批量执行与部分失败
│   │   ├── download-service.ts  # HTTPS URL 下载
│   │   └── validation-service.ts# 图片格式/尺寸/大小校验
│   ├── infra/
│   │   ├── rate-limiter.ts      # 按 size 分桶限流
│   │   ├── retry.ts             # 指数退避与 Retry-After
│   │   └── http-client.ts       # 超时、响应和敏感信息处理
│   └── types/
│       └── image.ts             # 公共请求/响应类型
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SECURITY.md
│   ├── CONTRIBUTING.md
│   └── RELEASE.md
├── .env.example
├── .gitignore
├── LICENSE
├── package.json
├── tsconfig.json
├── README.md
└── PROJECT_PLAN.md
```

## 2. 模块职责

- `server.ts`：只负责 MCP 工具注册和协议响应，不放 Agnes HTTP 细节。
- `schemas/`：校验调用方输入，拒绝未知危险字段和非法枚举。
- `image-provider.ts`：定义与供应商无关的图片能力接口。
- `agnes-provider.ts`：构造 Agnes 官方请求，确保 `response_format` 放在 `extra_body`，图像输入放在 `extra_body.image`。
- `rate-limiter.ts`：按 `size` 维护免费版 default RPM 桶。
- `retry.ts`：只对已明确可恢复的上游超时和 429 重试；网络错误不自动重试，避免未知状态下重复消耗额度。
- `download-service.ts`：将 Agnes HTTPS 结果落盘到 `output/`，负责 SSRF、重定向、路径安全和下载内容校验。
- `validation-service.ts`：提供本地图片格式校验能力；第一版由下载流程内部完成等价校验，不单独注册 MCP Tool。
- `services/`：将底层结果转换为稳定的 MCP 返回格式。

## 3. 公共接口模型

```ts
interface ImageGenerationRequest {
  prompt: string;
  size?: '1K' | '2K' | '3K' | '4K';
  ratio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | '2:3' | '3:2' | '21:9';
  model?: string;
  images?: string[];
}

interface BatchItem {
  index: number;
  id?: string;
  success: boolean;
  image?: GenerationData;
  file?: {
    path: string;
    bytes: number;
    mimeType: string;
    sha256: string;
    validated: true;
  };
  error?: {
    code: string;
    message: string;
    stage: 'generation' | 'download';
  };
}

interface GenerationBatchResult {
  requestedCount: number;
  succeededCount: number;
  failedCount: number;
  skippedCount: number;
  results: BatchItem[];
}
```

调用方参数使用 `images`，Provider 内部映射为 Agnes 的 `extra_body.image`；第一版固定请求 URL 输出，再由下载服务落盘并校验。`image` 是上游标准化结果，`file` 是对外返回的本地文件结果；`width`、`height` 当前不做解码检测。

## 4. Agnes 请求映射

### 文生图 URL（内部请求，不是 MCP 调用方参数）

```json
{
  "model": "agnes-image-2.5-flash",
  "prompt": "...",
  "size": "1K",
  "ratio": "9:16",
  "extra_body": { "response_format": "url" }
}
```

### 图生图/多图合成（内部请求，不是 MCP 调用方参数）

```json
{
  "model": "agnes-image-2.5-flash",
  "prompt": "...",
  "size": "1K",
  "extra_body": {
    "image": ["https://..."],
    "response_format": "url"
  }
}
```

## 5. 限流与重试

免费版 `default` 实际 RPM：

- 1K：20 RPM，间隔 3 秒；
- 2K：10 RPM，间隔 6 秒；
- 3K：1 RPM，间隔 60 秒；
- 4K：1 RPM，间隔 60 秒。

第一版默认单进程串行。`generate_images` 中每个任务先通过对应档位的 limiter，再执行 Provider。收到 429 时优先使用 `Retry-After`；没有该响应头时采用有上限的指数退避。必须明确说明：多 MCP 进程或多机器无法共享此内存限流状态。

## 6. 调用时序

```text
MCP Client
  → server：调用 generate_images
  → schema：校验 items 与默认值
  → service：按 items 串行处理
  → limiter：按免费 default size 等待
  → retry：执行可恢复重试
  → provider：构造 Agnes 请求并获取 URL
  → download：校验后下载到 output/
  → download：下载响应并校验 MIME、魔数和大小
  → server：返回 image 元数据、本地 file 元数据与批量结果
```

## 7. 安全边界

- API Key 只从运行环境读取，绝不出现在工具参数、返回值、日志或异常中。
- `stdio` stdout 只输出 MCP 协议消息，日志必须输出 stderr。
- 下载器限制 HTTPS、响应大小、重定向次数和目标路径。
- 拒绝 `file://`、内网地址、环回地址、云元数据地址和明显系统目录。
- 不默认覆盖文件，不递归删除，不自动清理目录。
- 不提交 `.env`、真实 API 响应、真实图片和带密钥的日志。
- 明确声明 Agnes API 使用须遵守 Agnes 官方条款和内容政策。

## 8. 实施状态与后续维护

```text
已完成：TypeScript + MCP stdio 骨架、公共类型/schema/错误模型、Agnes Provider、免费 default 分桶限流、可恢复重试、统一图片生成工具（自动下载与校验）、安全底座、MCP registerTool、outputSchema/structuredContent、优雅退出和自动化测试
持续维护：依赖升级、真实上游契约复核、发布门禁和安全回归
```

实现边界以 `docs/DECISIONS.md` 为最高优先级；新增工具或字段必须先更新 SSOT，再同步 API、架构、安全和 QA 文档。
