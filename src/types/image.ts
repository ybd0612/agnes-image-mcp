export type Size = '1K' | '2K' | '3K' | '4K';
export type Ratio = '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | '2:3' | '3:2' | '21:9';
export type OutputFormat = 'url' | 'base64';
export interface GenerationRequest { prompt: string; size: Size; ratio?: Ratio; model?: string; images?: string[]; output?: OutputFormat; }
export interface GenerationImage { url?: string; base64?: string; revisedPrompt?: string | null; }
export interface GenerationData { model: string; size: Size; output: OutputFormat; url?: string | null; base64?: string | null; revisedPrompt?: string | null; requestId?: string | null; created?: number; }
export interface Envelope<T = unknown> { code: string; message: string; data: T; }
