import { createRequire } from 'node:module';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import { spawnSync, spawn } from 'node:child_process';
import { KitError } from './files.mjs';

const require = createRequire(import.meta.url);
const engineEntry = require.resolve('@fission-ai/openspec');
export const enginePath = path.resolve(path.dirname(engineEntry), '../bin/openspec.js');
export function engine(args, cwd, extraEnv = {}) {
  const result = spawnSync(process.execPath, [enginePath, ...args], {
    cwd, env: { ...process.env, OPENSPEC_TELEMETRY: '0', DO_NOT_TRACK: '1', ...extraEnv },
    encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024, windowsHide: true,
  });
  if (result.error) throw new KitError('ENGINE_FAILED', `OpenSpec执行失败：${result.error.message}`);
  if (result.status !== 0) throw new KitError('ENGINE_FAILED', 'OpenSpec返回失败', [{ exit: result.status, stdout: result.stdout, stderr: result.stderr }]);
  return result.stdout;
}
export async function newConfig(language) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'zzq-init-'));
  try {
    engine(['init', '--tools', 'none', '--profile', 'core', '--no-animation', '--language', language], temp,
      { XDG_CONFIG_HOME: path.join(temp, '.config'), XDG_DATA_HOME: path.join(temp, '.data'), CI: 'true' });
    return await fs.readFile(path.join(temp, 'openspec/config.yaml'));
  } finally { await fs.rm(temp, { recursive: true, force: true }); }
}
export function forward(args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [enginePath, ...args], { cwd, stdio: 'inherit', env: { ...process.env, OPENSPEC_TELEMETRY: '0', DO_NOT_TRACK: '1' }, windowsHide: true });
    child.on('error', reject);
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}
