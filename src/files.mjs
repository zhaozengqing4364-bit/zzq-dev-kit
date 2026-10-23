import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export class KitError extends Error {
  constructor(code, message, details = []) { super(message); this.code = code; this.details = details; }
}
export const hash = value => createHash('sha256').update(value).digest('hex');
export const json = value => JSON.stringify(value, null, 2) + '\n';
export async function stat(file) { try { return await fs.lstat(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
export async function canonical(file) {
  const absolute = path.resolve(file);
  try { return await fs.realpath(absolute); } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const parent = path.dirname(absolute);
    if (parent === absolute) throw e;
    return path.join(await canonical(parent), path.basename(absolute));
  }
}
export function target(root, relative) {
  if (typeof relative !== 'string' || !relative || path.isAbsolute(relative) || /^[A-Za-z]:/.test(relative) || relative.includes('\\') || relative.split('/').some(p => p === '..' || !p)) {
    throw new KitError('UNSAFE_PATH', `不安全的相对路径：${relative}`);
  }
  const result = path.resolve(root, relative);
  if (!result.startsWith(path.resolve(root) + path.sep)) throw new KitError('UNSAFE_PATH', relative);
  return result;
}
export async function safe(root, relative) {
  const file = target(root, relative);
  let at = path.resolve(root);
  for (const segment of relative.split('/')) {
    const parent = await stat(at);
    if (parent && (parent.isSymbolicLink() || !parent.isDirectory())) throw new KitError('UNSAFE_PATH', `目录不是实体目录：${at}`);
    at = path.join(at, segment);
    const info = await stat(at);
    if (info?.isSymbolicLink()) throw new KitError('SYMLINK_CONFLICT', `保留已有链接，需先决定迁移方式：${at}`);
  }
  return file;
}
export async function snapshot(root, relative) {
  const file = await safe(root, relative);
  const info = await stat(file);
  if (!info) return { bytes: null, sha: null, mode: null };
  if (!info.isFile()) throw new KitError('FILE_CONFLICT', `目标不是普通文件：${file}`);
  if (info.size > 4 * 1024 * 1024) throw new KitError('FILE_TOO_LARGE', `工具文件超过4MiB读取上限：${file}`);
  const bytes = await fs.readFile(file);
  return { bytes, sha: hash(bytes), mode: info.mode & 0o777 };
}
export async function atomic(file, bytes, mode = 0o644) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = path.join(path.dirname(file), `.zzq-${randomUUID()}.tmp`);
  try {
    const handle = await fs.open(temp, 'wx', mode);
    try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
    await fs.rename(temp, file);
  } finally { await fs.rm(temp, { force: true }); }
}
export async function readJson(root, relative) {
  const snap = await snapshot(root, relative);
  if (!snap.bytes) return null;
  try { return JSON.parse(snap.bytes.toString('utf8')); } catch { throw new KitError('INVALID_STATE', `JSON无法解析：${target(root, relative)}`); }
}
export async function inventory(root) {
  const result = {};
  async function visit(dir, prefix) {
    for (const entry of (await fs.readdir(dir, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new KitError('UNSAFE_BUNDLE', `包内不允许链接：${relative}`);
      if (entry.isDirectory()) await visit(path.join(dir, entry.name), relative);
      else if (entry.isFile()) result[relative] = await fs.readFile(path.join(dir, entry.name));
      else throw new KitError('UNSAFE_BUNDLE', relative);
    }
  }
  await visit(root, '');
  return result;
}
