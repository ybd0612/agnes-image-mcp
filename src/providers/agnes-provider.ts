import { AppError } from '../errors.js';
import { DEFAULT_ENDPOINT, DEFAULT_MODEL, getConfig } from '../config.js';
import type { GenerationData, GenerationImage, GenerationRequest } from '../types/image.js';
import type { ImageProvider } from './image-provider.js';

export class AgnesProvider implements ImageProvider {
  constructor(private readonly config: ReturnType<typeof getConfig> & { endpoint?: string } = getConfig(), private readonly fetchImpl: typeof fetch = fetch, private readonly timeoutMs = 120000) {}
  async generate(request: GenerationRequest): Promise<GenerationData> {
    const model = request.model || this.config.model || DEFAULT_MODEL;
    const extra: Record<string, unknown> = {};
    if (request.images?.length) extra.image = request.images;
    const format = request.output || 'url';
    if (request.images?.length || format === 'url') extra.response_format = request.images?.length && format === 'base64' ? 'b64_json' : 'url';
    const body: Record<string, unknown> = { model, prompt: request.prompt, size: request.size };
    if (request.ratio) body.ratio = request.ratio;
    if (!request.images?.length && format === 'base64') body.return_base64 = true;
    if (Object.keys(extra).length) body.extra_body = extra;
    // Endpoint 仅允许测试依赖注入，生产配置不会暴露该字段。
    const endpoint = (this.config as typeof this.config & { endpoint?: string }).endpoint || DEFAULT_ENDPOINT;
    let response: Response;
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try { response = await this.fetchImpl(endpoint, { method: 'POST', headers: { authorization: `Bearer ${this.config.apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal }); }
    catch (e) { if ((e as Error)?.name === 'AbortError') throw new AppError('UPSTREAM_TIMEOUT', 'Agnes 请求超时'); throw new AppError('UPSTREAM_TIMEOUT', 'Agnes 网络请求失败'); }
    finally { clearTimeout(timer); }
    const text = await response.text();
    let payload: any; try { payload = JSON.parse(text); } catch { throw new AppError('UPSTREAM_BAD_RESPONSE', 'Agnes 返回了无效响应'); }
    if (response.status === 401 || response.status === 403) throw new AppError('UPSTREAM_AUTH_ERROR', 'Agnes 认证失败');
    if (response.status === 429) throw new AppError('UPSTREAM_RATE_LIMIT', 'Agnes 请求过于频繁', { retryAfter: response.headers.get('retry-after') });
    if (!response.ok) throw new AppError('UPSTREAM_BAD_RESPONSE', `Agnes 请求失败（HTTP ${response.status}）`);
    const data = Array.isArray(payload?.data) ? payload.data : (payload?.data ? [payload.data] : []);
    if (!data.length) throw new AppError('UPSTREAM_BAD_RESPONSE', 'Agnes 返回缺少图片数据');
    const images: GenerationImage[] = data.map((item: any) => ({ url: item.url, base64: item.b64_json ?? item.b64Json ?? item.base64, revisedPrompt: item.revised_prompt ?? item.revisedPrompt ?? null }));
    return { model, size: request.size, output: format, images, requestId: payload?.id ?? null, created: payload?.created };
  }
}
