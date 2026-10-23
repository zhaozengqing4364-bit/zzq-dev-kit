import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { KitError, atomic, hash, json, readJson, safe, snapshot, stat, target } from './files.mjs';

export class Plan {
  constructor(roots) { this.roots = roots; this.writes = []; this.conflicts = []; this.notes = []; }
  async put(rootId, relative, bytes, expected, reason) {
    try {
      const before = await snapshot(this.roots[rootId], relative);
      const after = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
      if (before.sha === hash(after)) return before;
      if (expected !== undefined && before.sha !== expected) {
        this.conflicts.push({ path: target(this.roots[rootId], relative), code: 'MODIFIED_FILE', reason: '文件与已知版本不同，保留原件；请先决定如何合并。' });
        return before;
      }
      this.writes.push({ rootId, relative, before: before.bytes?.toString('base64') ?? null, beforeHash: before.sha, beforeMode: before.mode, after: after.toString('base64'), afterHash: hash(after), reason });
      return before;
    } catch (e) {
      if (!(e instanceof KitError)) throw e;
      this.conflicts.push({ path: path.resolve(this.roots[rootId], relative), code: e.code, reason: e.message });
      return null;
    }
  }
  summary() { return { changes: this.writes.map(w => ({ path: target(this.roots[w.rootId], w.relative), action: w.before === null ? 'create' : 'update', reason: w.reason })), conflicts: this.conflicts, notes: this.notes }; }
}

const unfinished = new Set(['prepared','applying','recovery_required']);
export async function pending(stateRoot) {
  const dir = await safe(stateRoot, 'transactions');
  if (!(await stat(dir))) return [];
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (!entry.isFile() || !/^[a-f0-9-]+\.json$/.test(entry.name)) continue;
    const record = await readJson(stateRoot, `transactions/${entry.name}`);
    if (unfinished.has(record.status)) result.push({ id: record.id, status: record.status });
  }
  return result;
}
function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return true;
  try { process.kill(pid, 0); return true; } catch (e) { return e.code !== 'ESRCH'; }
}
export async function withLock(stateRoot, callback, recover = false) {
  const lock = await safe(stateRoot, 'install.lock');
  await fs.mkdir(stateRoot, { recursive: true });
  const token = randomUUID();
  const candidate = path.join(stateRoot, `.lock-${token}.tmp`);
  await atomic(candidate, Buffer.from(json({ pid: process.pid, token })), 0o600);
  try {
    try { await fs.link(candidate, lock); }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      let current;
      try { current = await readJson(stateRoot, 'install.lock'); }
      catch { throw new KitError('LOCK_CORRUPT', `锁文件损坏，无法确定写入者。请先确认无安装进程，再讨论备份此文件：${lock}`); }
      if (!recover || alive(current?.pid)) throw new KitError('LOCKED', '存在安装锁。确认没有运行中的安装后，运行recover或rollback恢复；不要删除仍在运行的进程锁。', [current]);
      await fs.unlink(lock);
      await fs.link(candidate, lock);
    }
  } finally { await fs.rm(candidate, { force: true }); }
  try { return await callback(); }
  finally {
    const current = await readJson(stateRoot, 'install.lock');
    if (current?.token === token) await fs.unlink(lock);
  }
}
async function verifyWrites(roots, writes, accepted) {
  const conflicts = [];
  for (const w of writes) {
    try {
      const snap = await snapshot(roots[w.rootId], w.relative);
      if (!accepted(w).includes(snap.sha)) conflicts.push({ path: target(roots[w.rootId], w.relative), reason: '自规划或安装后文件发生了变化' });
    } catch (e) { conflicts.push({ path: w.relative, reason: e.message }); }
  }
  if (conflicts.length) throw new KitError('CONCURRENT_EDIT', '检测到后续修改，未覆盖这些文件。', conflicts);
}
async function restore(record) {
  await verifyWrites(record.roots, record.writes, w => [w.beforeHash, w.afterHash]);
  for (const w of [...record.writes].reverse()) {
    const snap = await snapshot(record.roots[w.rootId], w.relative);
    if (snap.sha === w.beforeHash) continue;
    if (snap.sha !== w.afterHash) throw new KitError('CONCURRENT_EDIT', w.relative);
    const file = await safe(record.roots[w.rootId], w.relative);
    if (w.before === null) await fs.unlink(file);
    else await atomic(file, Buffer.from(w.before, 'base64'), w.beforeMode ?? 0o644);
  }
}
export async function apply(plan, stateRoot, { failAfter } = {}) {
  if (plan.conflicts.length) throw new KitError('CONFLICT', '存在冲突，未写入任何目标文件。', plan.conflicts);
  return withLock(stateRoot, async () => {
    const incomplete = await pending(stateRoot);
    if (incomplete.length) throw new KitError('RECOVERY_REQUIRED', '上次操作未结束，请先恢复列出的事务。', incomplete);
    if (!plan.writes.length) return { changed: false, transaction: null };
    await verifyWrites(plan.roots, plan.writes, w => [w.beforeHash]);
    const id = randomUUID();
    const record = { format: 1, id, status: 'prepared', roots: plan.roots, writes: plan.writes };
    const journal = await safe(stateRoot, `transactions/${id}.json`);
    await atomic(journal, Buffer.from(json(record)), 0o600);
    try {
      record.status = 'applying'; await atomic(journal, Buffer.from(json(record)), 0o600);
      for (let i = 0; i < plan.writes.length; i++) {
        const w = plan.writes[i];
        await verifyWrites(plan.roots, [w], x => [x.beforeHash]);
        const file = await safe(plan.roots[w.rootId], w.relative);
        await atomic(file, Buffer.from(w.after, 'base64'), w.beforeMode ?? 0o644);
        if (failAfter === i + 1) throw new Error('Injected write failure');
      }
      record.status = 'committed'; await atomic(journal, Buffer.from(json(record)), 0o600);
      return { changed: true, transaction: id };
    } catch (e) {
      try { await restore(record); record.status = 'rolled_back'; }
      catch (rollbackError) { record.status = 'recovery_required'; record.recoveryError = rollbackError.message; }
      record.error = e.message;
      await atomic(journal, Buffer.from(json(record)), 0o600);
      throw new KitError('WRITE_FAILED', `安装失败，事务 ${id} 状态：${record.status}`, [{ error: e.message, transaction: id }]);
    }
  });
}
export async function rollback(stateRoot, id, allowedRoots) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new KitError('INVALID_TRANSACTION', '事务ID格式不正确');
  return withLock(stateRoot, async () => {
    const relative = `transactions/${id}.json`;
    const record = await readJson(stateRoot, relative);
    if (!record || record.id !== id || record.format !== 1 || !Array.isArray(record.writes)) throw new KitError('INVALID_TRANSACTION', '没有有效的事务记录');
    const allowed = new Set(Object.values(allowedRoots));
    for (const root of Object.values(record.roots)) if (!allowed.has(root)) throw new KitError('ROOT_MISMATCH', '此事务属于其他项目或安装目录，请在原项目使用相同参数恢复。');
    for (const w of record.writes) {
      if (!record.roots[w.rootId] || hash(Buffer.from(w.after, 'base64')) !== w.afterHash || (w.before !== null && hash(Buffer.from(w.before, 'base64')) !== w.beforeHash)) throw new KitError('INVALID_TRANSACTION', '事务数据校验失败');
      target(record.roots[w.rootId], w.relative);
    }
    if (record.status === 'rolled_back') return { changed: false, transaction: id, status: 'rolled_back' };
    await restore(record);
    record.status = 'rolled_back';
    await atomic(await safe(stateRoot, relative), Buffer.from(json(record)), 0o600);
    return { changed: true, transaction: id, status: 'rolled_back' };
  }, true);
}
