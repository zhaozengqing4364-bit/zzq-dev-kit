import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { context,execute,doctor } from '../src/kit.mjs';
import { rollback,withLock } from '../src/transaction.mjs';
import { json } from '../src/files.mjs';
import { fixture,write,hashes } from './helpers.mjs';

test('default agent root symlink is rejected before canonicalization',async t=>{
 const f=await fixture(t);const outside=path.join(f.base,'outside');await fs.mkdir(outside);await fs.symlink(outside,path.join(f.home,'.codex'),process.platform==='win32'?'junction':'dir');
 await assert.rejects(execute(await context({project:f.project,home:f.home}),'init'),e=>e.code==='CONFLICT');assert.deepEqual(await fs.readdir(outside),[]);
});

test('removed managed block is not silently reinserted by upgrade',async t=>{
 const f=await fixture(t);await write(f.project,'AGENTS.md','# user rules\n');await execute(f.ctx,'init');await write(f.project,'AGENTS.md','# user rules\n');const before=await hashes(f.base);
 await assert.rejects(execute(f.ctx,'upgrade'),e=>e.code==='CONFLICT'&&e.details.some(c=>c.code==='RULE_BLOCK_REMOVED'));assert.deepEqual(await hashes(f.base),before);
});

test('another project reference prevents rollback deleting its shared user skills',async t=>{
 const f=await fixture(t);const a=await execute(f.ctx,'init');const other=path.join(f.base,'project-b');await fs.mkdir(other);const b=await context({project:other,home:f.home});await execute(b,'init');
 await assert.rejects(rollback(f.ctx.roots.state,a.transaction,f.ctx.roots),e=>e.code==='CONCURRENT_EDIT');assert.equal((await doctor(b)).status,'PASS');
});

test('doctor fails when a user-scope project loses the shared user installation',async t=>{
 const f=await fixture(t);await execute(f.ctx,'init');await fs.unlink(path.join(f.ctx.roots.state,'user-install.json'));await fs.rm(path.join(f.ctx.roots.codex,'skills'),{recursive:true});
 assert.equal((await doctor(f.ctx)).status,'FAIL');
});

test('install-only then upgrade does not attach the current project or expand agents',async t=>{
 const f=await fixture(t,{agents:['claude']});await execute(f.ctx,'install');const next=await context({project:f.project,home:f.home});
 const before=await hashes(f.project);const result=await execute(next,'upgrade');assert.equal(result.status,'UNCHANGED');assert.deepEqual(await hashes(f.project),before);assert.equal(await fs.stat(path.join(f.home,'.codex')).catch(()=>null),null);
});

test('published lock is complete before callback and stale lock can be recovered',async t=>{
 const f=await fixture(t);await withLock(f.ctx.roots.state,async()=>{const owner=JSON.parse(await fs.readFile(path.join(f.ctx.roots.state,'install.lock')));assert.equal(owner.pid,process.pid);assert.ok(owner.token);});
 await write(f.ctx.roots.state,'install.lock',json({pid:99999999,token:'old'}));let ran=false;await withLock(f.ctx.roots.state,async()=>{ran=true;},true);assert.equal(ran,true);
});

test('externally corrupted lock is preserved with an actionable error',async t=>{
 const f=await fixture(t);await write(f.ctx.roots.state,'install.lock','');await assert.rejects(withLock(f.ctx.roots.state,async()=>{},true),e=>e.code==='LOCK_CORRUPT'&&e.message.includes('备份'));assert.equal(await fs.readFile(path.join(f.ctx.roots.state,'install.lock'),'utf8'),'');
});

test('empty AGENTS.override stays empty so original AGENTS rules remain effective',async t=>{
 const f=await fixture(t);await write(f.project,'AGENTS.override.md','');await write(f.project,'AGENTS.md','# Existing substantive rules\n');await execute(f.ctx,'init');
 assert.equal(await fs.readFile(path.join(f.project,'AGENTS.override.md'),'utf8'),'');assert.ok((await fs.readFile(path.join(f.project,'AGENTS.md'),'utf8')).startsWith('# Existing substantive rules\n'));
});

test('Claude integration preserves its own existing rules and is checked by doctor',async t=>{
 const f=await fixture(t,{agents:['claude']});await write(f.project,'CLAUDE.md','# Claude project rules\n');await execute(f.ctx,'init');
 const p=path.join(f.project,'CLAUDE.md');assert.ok((await fs.readFile(p,'utf8')).startsWith('# Claude project rules\n'));assert.equal((await doctor(f.ctx)).status,'PASS');await fs.writeFile(p,'# Claude project rules\n');assert.equal((await doctor(f.ctx)).status,'FAIL');
});

test('project-scope Claude setup ignores an unrelated user Codex link',async t=>{
 const f=await fixture(t,{scope:'project',agents:['claude']});const outside=path.join(f.base,'unused');await fs.mkdir(outside);await fs.symlink(outside,path.join(f.home,'.codex'),process.platform==='win32'?'junction':'dir');
 const ctx=await context({...f.ctx.options});assert.equal((await execute(ctx,'init')).status,'INSTALLED');assert.deepEqual(await fs.readdir(outside),[]);assert.equal((await doctor(ctx)).status,'PASS');
});
