import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Plan, apply, rollback, withLock, pending } from '../src/transaction.mjs';
import { execute } from '../src/kit.mjs';
import { hash,json } from '../src/files.mjs';
import { fixture,hashes,write } from './helpers.mjs';

test('rollback restores original rules and removes only files it created',async t=>{
 const f=await fixture(t);await write(f.project,'AGENTS.md','# Original rules\n');const original=await hashes(f.project);
 const result=await execute(f.ctx,'init');await rollback(f.ctx.roots.state,result.transaction,f.ctx.roots);
 assert.deepEqual(await hashes(f.project),original);
 assert.equal((await rollback(f.ctx.roots.state,result.transaction,f.ctx.roots)).changed,false);
});

test('rollback refuses all mutations if one file was edited later',async t=>{
 const f=await fixture(t);const result=await execute(f.ctx,'init');await fs.appendFile(path.join(f.project,'AGENTS.md'),'User edit\n');const before=await hashes(f.base);
 await assert.rejects(rollback(f.ctx.roots.state,result.transaction,f.ctx.roots),e=>e.code==='CONCURRENT_EDIT');assert.deepEqual(await hashes(f.base),before);
});

test('injected mid-write failure rolls back previous writes',async t=>{
 const f=await fixture(t);await write(f.project,'a.txt','before');const plan=new Plan(f.ctx.roots);
 await plan.put('project','a.txt','after',hash('before'),'test');await plan.put('project','b.txt','new',null,'test');
 await assert.rejects(apply(plan,f.ctx.roots.state,{failAfter:1}),e=>e.code==='WRITE_FAILED');
 assert.equal(await fs.readFile(path.join(f.project,'a.txt'),'utf8'),'before');assert.equal(await fs.stat(path.join(f.project,'b.txt')).catch(()=>null),null);assert.deepEqual(await pending(f.ctx.roots.state),[]);
});

test('crash journal blocks new install and can recover known partially written data',async t=>{
 const f=await fixture(t);const id=randomUUID();const record={format:1,id,status:'applying',roots:f.ctx.roots,writes:[{rootId:'project',relative:'partial.txt',before:null,beforeHash:null,beforeMode:null,after:Buffer.from('new').toString('base64'),afterHash:hash('new')}]};
 await write(f.project,'partial.txt','new');await write(f.ctx.roots.state,`transactions/${id}.json`,json(record));
 const plan=new Plan(f.ctx.roots);await plan.put('project','next.txt','next',null,'test');await assert.rejects(apply(plan,f.ctx.roots.state),e=>e.code==='RECOVERY_REQUIRED');
 await rollback(f.ctx.roots.state,id,f.ctx.roots);assert.equal(await fs.stat(path.join(f.project,'partial.txt')).catch(()=>null),null);
});

test('preflight detects concurrent changes between plan and apply',async t=>{
 const f=await fixture(t);const plan=new Plan(f.ctx.roots);await plan.put('project','new.txt','kit',null,'test');await write(f.project,'new.txt','user');
 await assert.rejects(apply(plan,f.ctx.roots.state),e=>e.code==='CONCURRENT_EDIT');assert.equal(await fs.readFile(path.join(f.project,'new.txt'),'utf8'),'user');
});

test('live tool lock cannot be recovered or stolen',async t=>{
 const f=await fixture(t);await write(f.ctx.roots.state,'install.lock',json({pid:process.pid,token:'live'}));
 await assert.rejects(withLock(f.ctx.roots.state,async()=>{},true),e=>e.code==='LOCKED');assert.equal(JSON.parse(await fs.readFile(path.join(f.ctx.roots.state,'install.lock'))).token,'live');
});

test('journal with traversal or an unrelated root is refused',async t=>{
 const f=await fixture(t);const id=randomUUID();await write(f.ctx.roots.state,`transactions/${id}.json`,json({format:1,id,status:'applying',roots:{evil:f.base},writes:[]}));
 await assert.rejects(rollback(f.ctx.roots.state,id,f.ctx.roots),e=>e.code==='ROOT_MISMATCH');
 await assert.rejects(rollback(f.ctx.roots.state,'../../other',f.ctx.roots),e=>e.code==='INVALID_TRANSACTION');
});

test('nested symlink does not redirect installation outside its target',async t=>{
 const f=await fixture(t,{scope:'project'});const outside=path.join(f.base,'outside');await fs.mkdir(outside);await fs.mkdir(path.join(f.project,'.agents'));await fs.symlink(outside,path.join(f.project,'.agents/skills'),process.platform==='win32'?'junction':'dir');
 await assert.rejects(execute(f.ctx,'init'),e=>e.code==='CONFLICT');assert.deepEqual(await fs.readdir(outside),[]);assert.equal(await fs.stat(path.join(f.project,'AGENTS.md')).catch(()=>null),null);
});
