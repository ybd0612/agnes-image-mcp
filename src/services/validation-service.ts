import { promises as fs } from 'node:fs';
import path from 'node:path';
import { AppError } from '../errors.js';
import type { ValidateImageInput } from '../schemas/validate-image.js';
const signatures: Array<[string, number[], number[]]> = [['png',[0x89,0x50,0x4e,0x47],[0,1,2,3]],['jpeg',[0xff,0xd8,0xff],[0,1,2]],['gif',[0x47,0x49,0x46],[0,1,2]],['webp',[0x52,0x49,0x46,0x46],[0,1,2,3]]];
function detect(buf: Uint8Array): string | undefined { return signatures.find(([,sig,pos]) => sig.every((v,i) => buf[pos[i]] === v))?.[0]; }
function safeLocal(source: string): string { if (source.includes('\0') || path.isAbsolute(source)) throw new AppError('PATH_NOT_ALLOWED', '仅允许工作目录下的相对路径'); const root = path.resolve(process.cwd()); const out = path.resolve(root, source); if (!out.startsWith(root + path.sep)) throw new AppError('PATH_NOT_ALLOWED', '路径越界'); return out; }
export async function validateImage(input: ValidateImageInput) {
  let bytes: Uint8Array;
  const localPath = safeLocal(input.path);
  try { bytes = new Uint8Array(await fs.readFile(localPath)); } catch { return invalid('无法读取本地文件'); }
  if (bytes.byteLength > input.maxBytes) return invalid('图片超过大小限制'); const format = detect(bytes); if (!format) return invalid('无法识别图片格式', bytes.byteLength); return { valid: true, format, width: null, height: null, bytes: bytes.byteLength, reason: null };
}
function invalid(reason: string, bytes = 0) { return { valid: false, format: null, width: null, height: null, bytes, reason }; }
