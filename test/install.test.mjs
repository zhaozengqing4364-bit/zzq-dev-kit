import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { context, execute, doctor, planInstall, SKILLS, packageRoot } from '../src/kit.mjs';
import { block } from '../src/kit.mjs';
import { fixture, hashes, write } from './helpers.mjs';
import { engine } from '../src/engine.mjs';

test('fresh init installs complete skills and real engine config, repeat is no-op', async t => {
  const f = await fixture(t);
  const first = await execute(f.ctx, 'init'); assert.equal(first.status, 'INSTALLED'); assert.ok(first.transaction);
  for (const name of SKILLS) assert.ok((await fs.stat(path.join(f.home, '.codex/skills', name, 'SKILL.md'))).isFile());
  const initial = await hashes(f.project);
  const second = await execute(f.ctx, 'init'); assert.equal(second.status, 'UNCHANGED'); assert.equal(second.transaction, null);
  assert.deepEqual(await hashes(f.project), initial);
  assert.equal((await doctor(f.ctx)).status, 'PASS');
  assert.equal(JSON.parse(engine(['list','--json'], f.project)).root.path, await fs.realpath(f.project));
});

test('dry-run neither installs skills nor writes the project', async t => {
  const f = await fixture(t, { dryRun: true }); const before = await hashes(f.base);
  const result = await execute(f.ctx, 'init'); assert.equal(result.status, 'PLANNED'); assert.ok(result.changes.length > 20);
  assert.deepEqual(await hashes(f.base), before);
});

test('old project rules, CRLF, config, source and package scripts are preserved', async t => {
  const f = await fixture(t);
  const rules = '# Existing\r\n\r\nDo not use our live API.\r\n';
  const config = 'schema: spec-driven\ncontext: |\n  My project owns its testing policy.\n';
  await write(f.project,'AGENTS.md',rules); await write(f.project,'openspec/config.yaml',config);
  await write(f.project,'package.json','{"scripts":{"unsafe":"do not execute"}}\n');
  await write(f.project,'src/app.js','export const app = 1;\n');
  await execute(f.ctx,'init');
  const after = await fs.readFile(path.join(f.project,'AGENTS.md'),'utf8'); assert.ok(after.startsWith(rules)); assert.ok(block(after));
  assert.equal(await fs.readFile(path.join(f.project,'openspec/config.yaml'),'utf8'),config);
  assert.equal(await fs.readFile(path.join(f.project,'package.json'),'utf8'),'{"scripts":{"unsafe":"do not execute"}}\n');
  await fs.appendFile(path.join(f.project,'AGENTS.md'),'\r\nExtra local rule.\r\n');
  const edited = await fs.readFile(path.join(f.project,'AGENTS.md'),'utf8');
  await execute(f.ctx,'init'); assert.equal(await fs.readFile(path.join(f.project,'AGENTS.md'),'utf8'),edited);
});

test('effective AGENTS.override takes priority without changing AGENTS', async t => {
  const f = await fixture(t); await write(f.project,'AGENTS.md','# original'); await write(f.project,'AGENTS.override.md','# override');
  await execute(f.ctx,'init');
  assert.equal(await fs.readFile(path.join(f.project,'AGENTS.md'),'utf8'),'# original');
  assert.ok(block(await fs.readFile(path.join(f.project,'AGENTS.override.md'),'utf8')));
});

test('custom schema stays unchanged and official status uses it', async t => {
  const f = await fixture(t); await write(f.project,'openspec/config.yaml','schema: custom\ncontext: project rules\n');
  await write(f.project,'openspec/schemas/custom/schema.yaml','name: custom\nversion: 1\ndescription: Minimal workflow\nartifacts:\n  - id: plan\n    generates: plan.md\n    description: Local plan\n    template: plan.md\n    instruction: Write a plan.\n    requires: []\napply:\n  requires: [plan]\n');
  await write(f.project,'openspec/schemas/custom/templates/plan.md','# Plan\n'); const before = await hashes(path.join(f.project,'openspec'));
  await execute(f.ctx,'init'); assert.deepEqual(await hashes(path.join(f.project,'openspec')),before);
  engine(['new','change','local-plan','--json'],f.project);
  assert.equal(JSON.parse(engine(['status','--change','local-plan','--json'],f.project)).schemaName,'custom');
});

test('differing unowned skill blocks ALL writes', async t => {
  const f = await fixture(t); await write(f.home,'.codex/skills/openspec-review-zzq/SKILL.md','User custom skill');
  const before = await hashes(f.base);
  await assert.rejects(execute(f.ctx,'init'),e => e.code === 'CONFLICT');
  assert.deepEqual(await hashes(f.base),before);
});

test('identical unowned files can be reused; extra files are never deleted', async t => {
  const f = await fixture(t);
  await fs.cp(path.join(packageRoot,'skills/openspec-review-zzq'),path.join(f.home,'.codex/skills/openspec-review-zzq'),{recursive:true});
  await execute(f.ctx,'init');
  await write(f.home,'.codex/skills/openspec-review-zzq/local-note.md','Keep this');
  const before = await hashes(f.base); await assert.rejects(execute(f.ctx,'upgrade'),e => e.code === 'CONFLICT'); assert.deepEqual(await hashes(f.base),before);
});

test('invalid existing YAML is not replaced, and no skill is installed', async t => {
  const f = await fixture(t); await write(f.project,'openspec/config.yaml','schema: ['); const before = await hashes(f.base);
  await assert.rejects(execute(f.ctx,'init'),e => e.code === 'INVALID_CONFIG'); assert.deepEqual(await hashes(f.base),before);
});

test('modified managed block is a conflict, outside edits remain allowed', async t => {
  const f = await fixture(t); await execute(f.ctx,'init');
  const p=path.join(f.project,'AGENTS.md'); await fs.writeFile(p,(await fs.readFile(p,'utf8')).replace('## ZZQ 开发流程','## My edited block'));
  const before=await hashes(f.base); await assert.rejects(execute(f.ctx,'upgrade'),e=>e.code==='CONFLICT'); assert.deepEqual(await hashes(f.base),before);
});

test('project scope supports both agents and tracks install-only ownership', async t => {
  const f=await fixture(t,{scope:'project',agents:['codex','claude']}); await execute(f.ctx,'install');
  assert.equal(await fs.stat(path.join(f.project,'AGENTS.md')).catch(()=>null),null);
  assert.ok(await fs.stat(path.join(f.project,'.zzq-dev-kit/manifest.json')));
  for(const dir of ['.agents','.claude']) for(const name of SKILLS) assert.ok(await fs.stat(path.join(f.project,dir,'skills',name,'SKILL.md')));
  assert.equal(await fs.stat(path.join(f.home,'.codex')).catch(()=>null),null);
  const second=await execute(f.ctx,'install');assert.equal(second.status,'UNCHANGED');
});

test('doctor identifies a modified installed skill and does not repair it', async t => {
  const f=await fixture(t);await execute(f.ctx,'init'); await write(f.home,'.codex/skills/openspec-apply-zzq/SKILL.md','modified');
  const before=await hashes(f.base);assert.equal((await doctor(f.ctx)).status,'FAIL');assert.deepEqual(await hashes(f.base),before);
});

test('malformed or duplicate rule block is rejected', async t=>{
  const f=await fixture(t);await write(f.project,'AGENTS.md','<!-- zzq-dev-kit:start -->\nunfinished');const before=await hashes(f.base);
  await assert.rejects(execute(f.ctx,'init'),e=>e.code==='INVALID_BLOCK');assert.deepEqual(await hashes(f.base),before);
});

test('existing config without explicit schema is preserved',async t=>{
 const f=await fixture(t);const config='context: Only current project rules\n';await write(f.project,'openspec/config.yaml',config);await execute(f.ctx,'init');assert.equal(await fs.readFile(path.join(f.project,'openspec/config.yaml'),'utf8'),config);
});
