# agnes-image-mcp

`agnes-image-mcp` is a Model Context Protocol (MCP) stdio server that exposes Agnes image generation and local image utilities to MCP-compatible clients. It is distributed as an npm package and requires Node.js 20 or newer.

## Install and run

The package is published on npm as `agnes-image-mcp`. Use `@latest` for the current stable release, or pin a published version for reproducible deployments.

Install the latest published version globally:

```bash
npm install --global agnes-image-mcp@latest
AGNES_API_KEY=your-key agnes-image-mcp
```

Run without a global install:

```bash
AGNES_API_KEY=your-key npx --yes agnes-image-mcp@latest
```

For reproducible deployments, pin the version explicitly:

```bash
AGNES_API_KEY=your-key npx --yes agnes-image-mcp@0.1.7
```

The package is an MCP **stdio** server. It does not open an HTTP listener and does not make an API request until an MCP tool is called.

## Configuration

Required environment variable:

- `AGNES_API_KEY`: Agnes API credential. Keep it in the environment or a secret manager; never put it in source code or an MCP JSON file committed to version control.

Optional environment variable:

- `AGNES_MODEL`: default model name. If omitted, the server uses `agnes-image-2.5-flash`.

The repository includes `.env.example` as a reference. The server reads environment variables supplied by its parent process; it does not automatically load a `.env` file.

### Generic MCP client configuration

Add a server entry to the MCP client configuration format supported by your client. The following JSON uses the common `mcpServers` shape:

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

If your client does not expand `${AGNES_API_KEY}`, replace it at runtime through the client's secret/environment-variable mechanism. For a global install, use `"command": "agnes-image-mcp"` and omit the package argument.

### Shell environment examples

Bash (Linux/macOS, current shell only):

```bash
export AGNES_API_KEY='your-key'
export AGNES_MODEL='agnes-image-2.5-flash' # optional
npx --yes agnes-image-mcp@0.1.7
```

PowerShell (Windows, current session only):

```powershell
$env:AGNES_API_KEY = 'your-key'
$env:AGNES_MODEL = 'agnes-image-2.5-flash' # optional
npx --yes agnes-image-mcp@0.1.7
```

## Available tools

All tool calls return a structured envelope with `code`, `message`, and `data` fields. Errors are returned as MCP tool errors with a stable error code and do not expose the API key.

### `generate_image`

Generates one image through the Agnes API. Required inputs are `prompt` and `size`; optional inputs include `model`, `ratio`, `images` (reference image strings), and `output` (`url` or `base64`, default `url`). This is a remote, billable/network operation subject to provider availability and configured rate limiting.

### `generate_images`

Processes 1–10 generation items sequentially (`concurrency` is currently fixed at 1). Each item accepts the same generation fields as `generate_image`; an optional `id` labels results. `continueOnError` defaults to `false` and controls whether later items run after a failure.

### `download_image`

Downloads an image from an HTTPS URL to a relative path beneath the current working directory. It rejects non-HTTPS URLs, private/internal network targets, path traversal, overwriting existing files, unsupported content, and responses over `maxBytes` (10 MiB by default). This tool writes a local file and performs network I/O.

### `validate_image`

Reads a relative local path beneath the current working directory and validates file size and image signature. PNG, JPEG, GIF, and WebP are supported. It does not access the network or modify the file.

## Security and operational boundaries

- Treat `AGNES_API_KEY` as a secret. Do not paste it into prompts, logs, issue reports, or checked-in configuration.
- The server only performs remote generation when requested by an MCP client. `validate_image` is local-only.
- Download destinations are constrained to the current working directory, and download URL checks reject insecure schemes and private network access.
- Image data supplied to generation is sent to the configured Agnes endpoint. Do not send confidential images unless your usage and provider policy allow it.
- This package provides image capabilities only; it does not create stories, TTS, subtitles, videos, project files, or persistent databases.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
npm pack --dry-run
```

`npm pack --dry-run` runs the `prepack` hook, builds `dist/`, and previews the exact package contents without publishing. The package allowlist contains `dist`, `README.md`, `LICENSE`, and `CHANGELOG.md`; npm also always includes `package.json`. Source, tests, secrets, and `node_modules` are excluded.

## License

MIT. See [`LICENSE`](LICENSE).
