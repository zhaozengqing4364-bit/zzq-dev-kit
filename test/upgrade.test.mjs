import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execute,doctor,context } from '../src/kit.mjs';
import { hash,json } from '../src/files.mjs';
import { fixture,write,hashes } from './helpers.mjs';

test('managed old version upgrades and can restore its original contents',async t=>{
 const f=await fixture(t);await execute(f.ctx,'init');
 const stateFile=path.join(f.ctx.roots.state,'user-install.json');const state=JSON.parse(await fs.readFile(stateFile));
 const relative='skills/openspec-review-zzq/SKILL.md';await write(f.ctx.roots.codex,relative,'old managed version');state.kitVersion='0.9.0';state.files[`codex:${relative}`].sha=hash('old managed version');await fs.writeFile(stateFile,json(state));
 await assert.rejects(execute(f.ctx,'init'),e=>e.code==='UPGRADE_REQUIRED');
 const result=await execute(f.ctx,'upgrade');assert.equal(result.status,'INSTALLED');assert.match(await fs.readFile(path.join(f.ctx.roots.codex,relative),'utf8'),/name: openspec-review-zzq/);
 const recovery=await context({...f.ctx.options,transaction:result.transaction});await execute(recovery,'rollback');assert.equal(await fs.readFile(path.join(f.ctx.roots.codex,relative),'utf8'),'old managed version');
});

test('user modification blocks upgrade and leaves project files untouched',async t=>{
 const f=await fixture(t);await execute(f.ctx,'init');await write(f.home,'.codex/skills/openspec-design-zzq/SKILL.md','my custom content');const before=await hashes(f.base);
 await assert.rejects(execute(f.ctx,'upgrade'),e=>e.code==='CONFLICT');assert.deepEqual(await hashes(f.base),before);
});

test('doctor validates real schema availability instead of only root existence',async t=>{
 const f=await fixture(t);await execute(f.ctx,'init');await write(f.project,'openspec/config.yaml','schema: no-such-workflow\n');assert.equal((await doctor(f.ctx)).status,'FAIL');
});

test('doctor finds missing manifest entries and a stale installation lock',async t=>{
 const f=await fixture(t);await execute(f.ctx,'init');const p=path.join(f.ctx.roots.state,'user-install.json');const data=JSON.parse(await fs.readFile(p));delete data.files['codex:skills/openspec-review-zzq/SKILL.md'];await fs.writeFile(p,json(data));
 assert.equal((await doctor(f.ctx)).status,'FAIL');await write(f.ctx.roots.state,'install.lock',json({pid:99999999,token:'stale'}));assert.ok((await doctor(f.ctx)).checks.some(c=>c.name==='install-lock'&&c.status==='FAIL'));
});
