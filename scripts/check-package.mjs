import fs from 'node:fs/promises';
import path from 'node:path';
import { parseDocument } from 'yaml';
import { inventory } from '../src/files.mjs';
import { SKILLS,packageRoot } from '../src/kit.mjs';
const all=await inventory(path.join(packageRoot,'skills'));const errors=[];
const dirs=[...new Set(Object.keys(all).map(p=>p.split('/')[0]))].sort();
if(JSON.stringify(dirs)!==JSON.stringify(SKILLS))errors.push('Expected eleven skills');
for(const name of SKILLS){
 const raw=all[`${name}/SKILL.md`]?.toString('utf8')||'';const sections=raw.split('---');
 const doc=parseDocument(sections[1]||'');const meta=doc.toJS();
 if(doc.errors.length||meta?.name!==name||!meta.description)errors.push(`Invalid skill ${name}`);
 const ui=parseDocument(all[`${name}/agents/openai.yaml`]?.toString('utf8')||'').toJS();
 if(!ui?.interface?.default_prompt?.includes('$'+name))errors.push(`Invalid prompt ${name}`);
}
for(const [relative,bytes]of Object.entries(all)){
 const text=bytes.toString('utf8');
 if(/\/Users\/|campus-latest|校招|user-driven-spec|CONTEXT\.md/.test(text))errors.push(`Project-coupled resource ${relative}`);
 if(relative.endsWith('.md'))for(const match of text.matchAll(/(?<!!)\[[^\]\n]+\]\(([^\s)]+)\)/g)){
  const dest=match[1].split('#')[0];if(!dest||/^(https?:|mailto:)/.test(dest))continue;
  const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(relative),dest));
  if(!all[resolved]||resolved.startsWith('../'))errors.push(`Missing or external reference ${relative}: ${dest}`);
 }
}
for(const required of ['README.md','LICENSE','NOTICE.md'])if(!(await fs.stat(path.join(packageRoot,required)).catch(()=>null)))errors.push(`Missing ${required}`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`PASS: ${SKILLS.length} skills, ${Object.keys(all).length} bundled skill files, references and package prerequisites`);
