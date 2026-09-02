#!/usr/bin/env node
/**
 * Verify that npm's publishable archive contains only the release allowlist.
 */
import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCliPath = process.env.npm_execpath;
const npmCommand = isWindows && npmCliPath ? process.execPath : isWindows ? process.env.ComSpec ?? 'cmd.exe' : 'npm';
const npmArgs = isWindows && npmCliPath
  ? [npmCliPath, 'pack', '--dry-run', '--json']
  : isWindows
    ? ['/d', '/s', '/c', 'npm.cmd pack --dry-run --json']
    : ['pack', '--dry-run', '--json'];
const allowedFiles = new Set(['package.json', 'README.md', 'README.zh-CN.md', 'LICENSE', 'CHANGELOG.md']);
const forbiddenSegments = new Set([
  'src',
  'tests',
  'test',
  '.env',
  '.workbuddy',
  '.neuralmemory',
  'node_modules',
  'package-lock.json',
]);

function fail(message) {
  console.error(`pack-check failed: ${message}`);
  process.exitCode = 1;
}

const result = spawnSync(npmCommand, npmArgs, {
  cwd: process.cwd(),
  encoding: 'utf8',
  shell: false,
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (result.error) {
  fail(result.error.message);
} else if (result.status !== 0) {
  fail(`npm pack exited with code ${result.status}: ${result.stderr.trim()}`);
} else {
  try {
    const output = result.stdout.trim();
    const jsonStart = output.indexOf('[');
    if (jsonStart < 0) {
      throw new Error('npm pack did not return JSON metadata');
    }
    const metadata = JSON.parse(output.slice(jsonStart));
    const files = metadata[0]?.files;
    if (!Array.isArray(files)) {
      throw new Error('npm pack metadata did not include files');
    }

    const violations = [];
    for (const entry of files) {
      const path = String(entry.path ?? '').replaceAll('\\', '/');
      const [topLevel] = path.split('/');
      const isAllowedDist = topLevel === 'dist' && path.length > 'dist/'.length;
      const isAllowedRootFile = allowedFiles.has(path);
      const hasForbiddenSegment = path.split('/').some((segment) => forbiddenSegments.has(segment));
      if ((!isAllowedDist && !isAllowedRootFile) || hasForbiddenSegment) {
        violations.push(path);
      }
    }

    if (violations.length > 0) {
      throw new Error(`unexpected package files: ${violations.join(', ')}`);
    }
    console.log(`pack-check passed: ${files.length} files (package.json is npm-mandatory)`);
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}
