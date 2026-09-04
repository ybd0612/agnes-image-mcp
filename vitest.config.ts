import { defineConfig } from 'vitest/config';
import path from 'node:path';
import fs from 'node:fs';

export default defineConfig({
  plugins: [{
    name: 'resolve-typescript-js-imports',
    enforce: 'pre',
    resolveId(source, importer) {
      if (!importer || !source.endsWith('.js') || (!source.startsWith('./') && !source.startsWith('../'))) return null;
      const candidate = path.resolve(path.dirname(importer), `${source.slice(0, -3)}.ts`);
      return fs.existsSync(candidate) ? candidate : null;
    },
  }],
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
