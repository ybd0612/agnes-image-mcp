import { RateLimiter } from '../infra/rate-limiter.js';
import { retryAfterValueMs, withRetry } from '../infra/retry.js';
import type { ImageProvider } from '../providers/image-provider.js';
import type { GenerationData, GenerationRequest } from '../types/image.js';

export class ImageService {
  constructor(private readonly provider: ImageProvider, private readonly limiter = new RateLimiter()) {}
  async generate(request: GenerationRequest, retries = 2): Promise<GenerationData> {
    return withRetry(async () => { await this.limiter.acquire(request.size); return this.provider.generate(request); }, {
      retries,
      retryAfter: (_attempt, error) => retryAfterValueMs((error as { details?: { retryAfter?: unknown } })?.details?.retryAfter)
    });
  }
}
