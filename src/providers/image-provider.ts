import type { GenerationData, GenerationRequest } from '../types/image.js';
export interface ImageProvider { generate(request: GenerationRequest): Promise<GenerationData>; }
