# agnes-image-mcp

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

当前稳定版本为 `0.1.7`。需要可复现部署时，可固定已发布版本：

```bash
AGNES_API_KEY=你的密钥 npx --yes agnes-image-mcp@0.1.7
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

所有工具调用都会返回包含 `code`、`message` 和 `data` 的结构化结果。错误使用稳定错误码返回，不会暴露 API 密钥。

### `generate_image`

调用 Agnes API 生成一张图片。必填参数为 `prompt` 和 `size`；支持 `model`、`ratio`、参考图 `images` 和 `output`。`output` 可选 `url` 或 `base64`，默认是 `url`。这是远程网络操作，会消耗上游额度并受限流策略影响。

### `generate_images`

批量生成 1 至 10 张图片。默认串行执行（`concurrency=1`），遇到失败默认停止（`continueOnError=false`）。每个项目可通过 `id` 标记结果。

### `download_image`

将 HTTPS 图片 URL 下载到当前工作目录下的相对路径。会拒绝非 HTTPS、内网目标、路径穿越、覆盖已有文件、不支持的内容以及超过默认 10 MiB 限制的响应。

### `validate_image`

读取当前工作目录下的相对本地路径，校验文件大小和图片签名。支持 PNG、JPEG、GIF 和 WebP，不访问网络，也不会修改文件。

## 安全边界

- `AGNES_API_KEY` 是敏感凭据，不要写入日志、Issue、提示词或版本库。
- 只有调用生成工具时才会访问 Agnes 远程 API。
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
