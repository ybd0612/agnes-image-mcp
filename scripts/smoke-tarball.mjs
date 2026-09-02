#!/usr/bin/env node
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = resolve(process.cwd());
const tempRoot = process.env.TEMP || process.env.TMP || tmpdir();
const workDir = await mkdtemp(join(tempRoot, 'agnes-image-mcp-pack-'));
const npmExecPath = process.env.npm_execpath;
const npmCommand = npmExecPath ? process.execPath : (process.platform === 'win32' ? (process.env.ComSpec || 'cmd.exe') : 'npm');
const npmArgs = npmExecPath
  ? [npmExecPath]
  : process.platform === 'win32'
    ? ['/d', '/s', '/c', 'npm.cmd']
    : [];

function runNpm(args, cwd) {
  const result = spawnSync(npmCommand, [...npmArgs, ...args], { cwd, encoding: 'utf8', shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error || result.status !== 0) throw new Error(`npm ${args[0]} failed: ${result.error?.message || result.stderr.trim()}`);
  return result.stdout;
}

function waitForClose(child, timeoutMs = 10000) {
  return new Promise((resolvePromise, reject) => {
    const timer = setTimeout(() => { child.kill('SIGTERM'); reject(new Error('tarball stdio smoke timed out')); }, timeoutMs);
    child.once('close', (code) => { clearTimeout(timer); resolvePromise(code); });
    child.once('error', reject);
  });
}

try {
  const packOutput = runNpm(['pack', '--json'], root);
  const metadata = JSON.parse(packOutput.slice(packOutput.indexOf('[')));
  const tarballName = metadata[0]?.filename;
  if (!tarballName) throw new Error('npm pack did not return tarball filename');
  const tarballPath = resolve(root, tarballName);
  runNpm(['init', '-y'], workDir);
  runNpm(['install', tarballPath, '--ignore-scripts'], workDir);
  const entry = join(workDir, 'node_modules', 'agnes-image-mcp', 'dist', 'index.js');
  const transport = new StdioClientTransport({ command: process.execPath, args: [entry], env: { ...process.env, AGNES_API_KEY: 'tarball-smoke-key' } });
  const client = new Client({ name: 'agnes-image-mcp-tarball-smoke', version: '0.1.0' });
  try {
    await client.connect(transport);
    const response = await client.listTools();
    const names = response.tools.map((tool) => tool.name);
    const expected = ['generate_image', 'generate_images', 'download_image', 'validate_image'];
    const missing = expected.filter((name) => !names.includes(name));
    if (missing.length) throw new Error(`Missing tools after tarball install: ${missing.join(', ')}`);
    console.log(`tarball smoke test passed (${names.length} tools, clean install)`);
  } finally {
    await client.close().catch(() => undefined);
  }
  await rm(tarballPath, { force: true });
} finally {
  await rm(workDir, { recursive: true, force: true });
}
