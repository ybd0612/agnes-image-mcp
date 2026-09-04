# agnes-image-mcp

Language: [English](README.md) · **简体中文**

`agnes-image-mcp` 是一个基于 Model Context Protocol（MCP）stdio 的图片服务，为兼容 MCP 的客户端提供 Agnes 图片生成和本地图片工具。项目已发布到 npm，要求 Node.js 20 或更高版本。

## 安装与运行

### 使用 npx 运行最新版

Linux/macOS：

```bash
AGNES_API_KEY=你的密钥 npx --yes agnes-image-mcp@latest
```

Windows PowerShell：

```powershell
$env:AGNES_API_KEY = "你的密钥"
npx --yes agnes-image-mcp@latest
```

当前稳定版本为 `0.1.9`。需要可复现部署时，可固定已发布版本：

```bash
AGNES_API_KEY=你的密钥 npx --yes agnes-image-mcp@0.1.9
```

这是 MCP **stdio** 服务，不会监听 HTTP 端口；只有客户端实际调用 MCP 工具时，才会发起远程图片请求。

## 配置

必填环境变量：

- `AGNES_API_KEY`：Agnes API 密钥。请通过环境变量或密钥管理器提供，不要写入源代码、提示词或提交到 Git。

可选环境变量：

- `AGNES_MODEL`：默认模型名，未设置时使用 `agnes-image-2.5-flash`。

服务只读取父进程传入的环境变量，不会自动加载 `.env` 文件。

## MCP 客户端配置

常见 `mcpServers` 配置示例：

```json
{
  "mcpServers": {
    "agnes-image": {
      "command": "npx",
      "args": ["--yes", "agnes-image-mcp@latest"],
      "env": {
        "AGNES_API_KEY": "${AGNES_API_KEY}",
        "AGNES_MODEL": "agnes-image-2.5-flash"
      }
    }
  }
}
```

如果客户端不支持 `${AGNES_API_KEY}` 展开，请使用客户端提供的密钥或环境变量机制。也可以全局安装后使用：

```bash
npm install --global agnes-image-mcp@latest
```

然后将 MCP 配置中的 `command` 改为 `agnes-image-mcp`，并移除 npm 包参数。

## 可用工具

第一版只暴露一个 `generate_images` 工具，专门服务 Agnes 免费用户组 `default`。所有调用都会返回包含 `code`、`message` 和 `data` 的结构化结果。

### `generate_images`

传入 `items` 数组：一个 item 表示单张生成，多个 item 表示批量生成，最多 10 项。每项只有 `prompt` 必填，`size` 默认 `1K`，`ratio` 默认 `1:1`，`model` 默认使用 `AGNES_MODEL` 或 `agnes-image-2.5-flash`；图生图时可传 `images`。

服务会按免费版 `default` 实际 RPM 串行执行：`1K=20 RPM`、`2K=10 RPM`、`3K=1 RPM`、`4K=1 RPM`。生成后自动将 HTTPS 图片下载到当前工作目录的 `output/`，并校验响应 MIME、图片魔数和大小，成功后返回本地路径、格式、字节数和 SHA-256。默认遇错停止，可传 `continueOnError=true` 继续处理剩余任务。

第一版不暴露 `output`、`outputPath`、`concurrency`、`tier`，也不实现异步 `jobId` 队列。100 个 1K 任务仅按 RPM 容量就至少需要约 5 分钟，实际还包括生成、下载和重试时间。

校验只保证文件是受支持的 PNG、JPEG、GIF 或 WebP 且大小符合限制，不代表图片内容质量或提示词语义一定符合预期。

## 安全边界

- `AGNES_API_KEY` 是敏感凭据，不要写入日志、Issue、提示词或版本库。
- 只有调用 `generate_images` 时才会访问 Agnes 远程 API；下载和校验是其内部步骤。
- 下载路径限制在当前工作目录内，下载地址必须是 HTTPS，且会拒绝内网地址。
- 发送给生成接口的参考图会上传到 Agnes；请确认符合你的数据和服务使用政策。
- 本项目只提供图片能力，不负责故事、TTS、字幕、视频、项目文件或持久化数据库。

## 开发

```bash
npm install
npm run typecheck
npm test
npm run build
npm run verify-release
npm run pack-check
npm run smoke
npm run smoke:tarball
```

## 发布

项目通过 GitHub Actions 的 npm Trusted Publishing（OIDC）发布，不依赖长期 `NPM_TOKEN`。升级版本后推送版本标签即可触发发布：

```bash
npm version patch
git push origin master --tags
```

## 许可证

MIT，详见 [`LICENSE`](LICENSE)。

> Agnes API、模型以及生成内容的使用授权不由本项目许可证授予，请遵守相关服务条款。
