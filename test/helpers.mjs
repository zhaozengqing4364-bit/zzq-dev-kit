import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { context } from '../src/kit.mjs';
import { inventory, hash } from '../src/files.mjs';
export async function fixture(t, options = {}) {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), 'zzq-test-'));
  t.after(() => fs.rm(base, { recursive: true, force: true }));
  const project = path.join(base, 'project'); const home = path.join(base, 'home');
  await fs.mkdir(project); await fs.mkdir(home);
  const ctx = await context({ project, home, ...options });
  return { base, project, home, ctx };
}
export async function hashes(root) {
  const files = await inventory(root);
  return Object.fromEntries(Object.entries(files).map(([p,b]) => [p,hash(b)]));
}
export async function write(root, relative, data) { const p = path.join(root, relative); await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, data); }
