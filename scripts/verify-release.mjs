#!/usr/bin/env node
/**
 * Check release metadata and ensure the MCP server version cannot drift.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`verify-release failed: ${message}`);
  process.exitCode = 1;
}

try {
  const packagePath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const version = typeof packageJson.version === 'string' ? packageJson.version.trim() : '';
  if (!version) throw new Error('package.json version is empty');

  const binPath = packageJson.bin?.['agnes-image-mcp'];
  if (binPath !== 'dist/index.js') throw new Error(`bin.agnes-image-mcp must be dist/index.js, got ${String(binPath)}`);
  if (!existsSync(path.join(projectRoot, binPath))) throw new Error(`${binPath} does not exist; build before verification`);

  const source = readFileSync(path.join(projectRoot, 'src', 'server.ts'), 'utf8');
  const matches = [...source.matchAll(/new McpServer\(\s*\{[\s\S]*?version:\s*['"]([^'"]+)['"]/g)];
  if (matches.length !== 1) throw new Error('expected exactly one static MCP server version in src/server.ts');
  const serverVersion = matches[0][1];
  if (serverVersion !== version) throw new Error(`MCP server version ${serverVersion} differs from package version ${version}`);

  console.log(`verify-release passed: version ${version}, bin ${binPath}, MCP version aligned`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
