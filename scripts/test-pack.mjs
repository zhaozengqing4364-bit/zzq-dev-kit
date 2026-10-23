import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { packageRoot,pkg } from '../src/kit.mjs';
const base=await fs.mkdtemp(path.join(os.tmpdir(),'zzq-pack-'));const evidence=[];
const npmCli=process.env.npm_execpath;
assert.ok(npmCli?.endsWith('npm-cli.js'),'Run through npm run test:pack');
const env={...process.env,npm_config_cache:path.join(base,'cache'),npm_config_registry:'https://registry.npmjs.org',npm_config_userconfig:path.join(base,'empty.npmrc'),OPENSPEC_TELEMETRY:'0',DO_NOT_TRACK:'1',CI:'true'};
function npm(args,cwd){
 const r=spawnSync(process.execPath,[npmCli,...args],{cwd,env,encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
 evidence.push({command:['npm',...args],exit:r.status,stdout:r.stdout,stderr:r.stderr});
 assert.equal(r.status,0,r.error?.message||r.stderr||r.stdout);return r.stdout;
}
try{
 const pack=JSON.parse(npm(['pack','--ignore-scripts','--json','--pack-destination',base],packageRoot))[0];
 const tarball=path.join(base,pack.filename);
 for(const f of pack.files)assert.ok(!/^(test|scripts|openspec|artifacts|node_modules|\.github|\.git)\//.test(f.path),f.path);
 const project=path.join(base,'old project');const home=path.join(base,'user');await fs.mkdir(project);await fs.mkdir(home);
 const original='# Existing project\nKeep the original rules.\n';await fs.writeFile(path.join(project,'AGENTS.md'),original);
 const prefix=['exec','--yes',`--package=${tarball}`,'--','zzq-dev-kit'];
 const args=['--home',home,'--scope','project','--agents','codex,claude','--json'];
 const installed=JSON.parse(npm([...prefix,'init',...args],project));assert.equal(installed.status,'INSTALLED');
 assert.ok((await fs.readFile(path.join(project,'AGENTS.md'),'utf8')).startsWith(original));
 assert.equal(JSON.parse(npm([...prefix,'init',...args],project)).status,'UNCHANGED');
 assert.equal(JSON.parse(npm([...prefix,'doctor','--home',home,'--json'],project)).status,'PASS');
 assert.equal(npm([...prefix,'openspec','--version'],project).trim(),'1.14.2');
 const launch=spawnSync(process.execPath,['.zzq-dev-kit/openspec.cjs','list','--json'],{cwd:project,env:{...env,ZZQ_DEV_KIT_SOURCE:tarball},encoding:'utf8',timeout:120000,maxBuffer:8*1024*1024});
 evidence.push({command:['node','.zzq-dev-kit/openspec.cjs','list','--json'],exit:launch.status,stdout:launch.stdout,stderr:launch.stderr});
 assert.equal(launch.status,0,launch.stderr);assert.ok(JSON.parse(launch.stdout).root.path);
 assert.equal(JSON.parse(npm([...prefix,'rollback',installed.transaction,'--home',home,'--json'],project)).status,'rolled_back');
 assert.equal(await fs.readFile(path.join(project,'AGENTS.md'),'utf8'),original);
 await fs.mkdir(path.join(packageRoot,'artifacts'),{recursive:true});
 await fs.writeFile(path.join(packageRoot,'artifacts/pack-test.json'),JSON.stringify({status:'PASS',version:pkg.version,sha512:pack.integrity,files:pack.files.map(f=>f.path),commands:evidence},null,2)+'\n');
 console.log('PASS: actual npm tarball -> npm exec init -> repeat -> doctor -> OpenSpec proxy/launcher -> rollback');
}finally{await fs.rm(base,{recursive:true,force:true});}
