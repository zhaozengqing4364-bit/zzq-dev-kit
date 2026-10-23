import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';
import { KitError, canonical, hash, inventory, json, readJson, safe, snapshot, stat, target } from './files.mjs';
import { Plan, apply, pending, rollback } from './transaction.mjs';
import { engine, newConfig } from './engine.mjs';

export const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const pkg = JSON.parse(await fs.readFile(path.join(packageRoot, 'package.json'), 'utf8'));
const START = '<!-- zzq-dev-kit:start -->';
const END = '<!-- zzq-dev-kit:end -->';
const PROJECT_STATE = '.zzq-dev-kit/manifest.json';
const USER_STATE = 'user-install.json';
export const SKILLS = ['apply','archive','debug','design','explore','grill-with-docs','handoff','prototype','retro','review','setup'].map(s => `openspec-${s}-zzq`).sort();

export async function context(options = {}) {
  const home = await canonical(options.home || os.homedir());
  const project = await canonical(options.project || process.cwd());
  // Keep logical installation paths so safety checks can see existing links.
  // Only roots used by the operation are inspected; unrelated agents do not gate it.
  const state = path.resolve(options.stateDir || process.env.ZZQ_DEV_KIT_HOME || path.join(home, '.zzq-dev-kit'));
  const codex = path.resolve(options.codexHome || (!options.home && process.env.CODEX_HOME) || path.join(home, '.codex'));
  const claude = path.resolve(options.claudeHome || (!options.home && process.env.CLAUDE_CONFIG_DIR) || path.join(home, '.claude'));
  const roots = { project, state, codex, claude };
  if (new Set(Object.values(roots)).size !== 4) throw new KitError('ROOT_COLLISION', '项目、状态和Agent目录不能是同一个目录');
  return { home, roots, options };
}
export function block(text) {
  const starts = [...text.matchAll(/<!-- zzq-dev-kit:start -->/g)];
  const ends = [...text.matchAll(/<!-- zzq-dev-kit:end -->/g)];
  if (!starts.length && !ends.length) return null;
  if (starts.length !== 1 || ends.length !== 1 || starts[0].index >= ends[0].index) throw new KitError('INVALID_BLOCK', 'ZZQ规则块标记不完整或重复，请先人工核对');
  return { start: starts[0].index, end: ends[0].index + END.length, value: text.slice(starts[0].index, ends[0].index + END.length) };
}
function ruleBlock() {
  return `${START}\n## ZZQ 开发流程\n\n本项目使用 ZZQ 开发技能。先读取当前项目与目标目录的规则；业务约定、技术栈和验证边界由项目决定。\n\n- 接入或核对项目：\`$openspec-setup-zzq\`；已有决定与 OpenSpec change 继续复用。\n- 调查使用 explore；明确要求原型时才使用 prototype；设计、实施、审查按当前授权推进。\n- 详见 [.zzq-dev-kit/guide.md](.zzq-dev-kit/guide.md)。没有全局 OpenSpec 时使用 \`node .zzq-dev-kit/openspec.cjs\` 代理同版本引擎。\n- 当前文件中原有的规则和更具体的项目约定继续有效，技能安装不改变测试、部署或外部写入授权。\n${END}`;
}
function guide() {
  return `# ZZQ 项目接入\n\n工具包版本：${pkg.version}。安装检查只证明工具接入，不代表已理解或验收业务。\n\n先运行 \`$openspec-setup-zzq\`，调查项目入口、已有规则、当前 Schema 与实际验证脚本，并将必要事实放回已有项目权威位置。已有 OpenSpec 配置保持原样。\n\n## 独立入口\n\n${SKILLS.map(n => `- \`$${n}\``).join('\n')}\n\n## OpenSpec 引擎\n\n优先使用本项目代理（与本次工具包固定版本一致）：\n\n\`\`\`sh\nnode .zzq-dev-kit/openspec.cjs list --json\nnode .zzq-dev-kit/openspec.cjs status --change CHANGE --json\n\`\`\`\n\n代理通过 npm exec 加载固定版本工具包，不修改应用的 package.json。首次使用或缓存清除后需要网络。已有全局 OpenSpec 只有兼容且符合项目要求时才复用；不会自动切换项目 Schema。\n\n## 检查与维护\n\n\`\`\`sh\nnpx zzq-dev-kit@${pkg.version} doctor\nnpx zzq-dev-kit@latest upgrade --dry-run\n\`\`\`\n\n升级只处理工具已管理且未被修改的内容。冲突先讨论处理方式，不删除旧技能、覆盖已有规则或重置仓库。用户安装目录的恢复记录保存在工具状态目录；rollback 使用成功安装时输出的事务 ID。\n`;
}
const launcherTemplate = await fs.readFile(path.join(packageRoot, 'src/launcher-template.cjs'), 'utf8');
function launcher() { return launcherTemplate.replace('__KIT_SOURCE__', `zzq-dev-kit@${pkg.version}`); }
function validState(value, where) {
  if (value === null) return { format: 1, kitVersion: null, files: {} };
  if (value.format !== 1 || typeof value.files !== 'object' || value.files === null || Array.isArray(value.files)) throw new KitError('INVALID_STATE', `安装记录无效：${where}`);
  return value;
}
function utf8(bytes, where) {
  const text = bytes?.toString('utf8') || '';
  if (bytes && !Buffer.from(text).equals(bytes)) throw new KitError('INVALID_TEXT', `文件不是有效UTF-8，保留原件：${where}`);
  return text;
}
export async function planInstall(ctx, command = 'init') {
  const { roots, options } = ctx;
  const plan = new Plan(roots);
  const oldProject = validState(await readJson(roots.project, PROJECT_STATE), PROJECT_STATE);
  const oldUser = validState(await readJson(roots.state, USER_STATE), USER_STATE);
  const scope = options.scope || oldProject.scope || 'user';
  const agents = options.agents || oldProject.agents || oldUser.agents || ['codex'];
  const integrateProject = command === 'init' || (command === 'upgrade' && Boolean(oldProject.rule));
  if (integrateProject && (roots.project === ctx.home || path.dirname(roots.project) === roots.project)) throw new KitError('PROJECT_REQUIRED', '请进入具体项目目录或传入项目路径，不能把用户主目录或文件系统根目录整体接入。仅安装用户级技能请用install。');
  if (!['user','project'].includes(scope)) throw new KitError('INVALID_ARGUMENT', 'scope应为user或project');
  if (!agents.length || agents.some(a => !['codex','claude'].includes(a)) || new Set(agents).size !== agents.length) throw new KitError('INVALID_ARGUMENT', 'agents只能选择codex,claude且不能重复');
  if (oldProject.kitVersion && command !== 'install' && (scope !== oldProject.scope || json(agents) !== json(oldProject.agents))) throw new KitError('MIGRATION_REQUIRED', '更换已有项目的安装范围或Agent集合需要单独迁移，请先讨论旧目录的保留方式。');
  const bundle = await inventory(path.join(packageRoot, 'skills'));
  const nextProject = { ...oldProject, format: 1, kitVersion: pkg.version, scope, agents, files: { ...oldProject.files } };
  const nextUser = { ...oldUser, format: 1, kitVersion: pkg.version, agents: [...new Set([...(oldUser.agents || []), ...agents])].sort(), files: { ...oldUser.files } };
  if (scope === 'user' && integrateProject) nextUser.projects = { ...(oldUser.projects || {}), [hash(roots.project)]: { root: roots.project, kitVersion: pkg.version, agents } };
  const owned = scope === 'user' ? oldUser : oldProject;
  const next = scope === 'user' ? nextUser : nextProject;
  if (command === 'upgrade' && !oldProject.kitVersion && !oldUser.kitVersion) throw new KitError('NOT_INSTALLED', '没有可升级的已管理安装，请先使用init或install');
  if (owned.kitVersion && owned.kitVersion !== pkg.version && command !== 'upgrade') throw new KitError('UPGRADE_REQUIRED', `已安装 ${owned.kitVersion}，当前为 ${pkg.version}。请运行upgrade --dry-run检查差异。`);
  const seen = new Set();
  for (const agent of agents) {
    const rootId = scope === 'user' ? agent : 'project';
    const prefix = scope === 'user' ? 'skills' : agent === 'codex' ? '.agents/skills' : '.claude/skills';
    try { await safe(roots[rootId], prefix); }
    catch (e) { plan.conflicts.push({ path: target(roots[rootId], prefix), code: e.code || 'UNSAFE_PATH', reason: e.message }); continue; }
    for (const name of SKILLS) {
      try {
        const folder = await safe(roots[rootId], `${prefix}/${name}`);
        const info = await stat(folder);
        if (info?.isSymbolicLink()) throw new KitError('SYMLINK_CONFLICT', `已有技能链接需要先决定迁移方式：${folder}`);
        if (info && !info.isDirectory()) throw new KitError('FILE_CONFLICT', folder);
        if (info) {
          const current = await inventory(folder);
          const extras = Object.keys(current).filter(p => !bundle[`${name}/${p}`]);
          if (extras.length) plan.conflicts.push({ path: folder, code: 'EXTRA_FILES', reason: '存在本包未包含的文件；不会自动删除。', files: extras });
        }
      } catch (e) { plan.conflicts.push({ path: `${prefix}/${name}`, code: e.code || 'IO_ERROR', reason: e.message }); }
    }
    for (const [relative, content] of Object.entries(bundle)) {
      if (!SKILLS.includes(relative.split('/')[0])) throw new KitError('INVALID_BUNDLE', relative);
      const destination = `${prefix}/${relative}`;
      const key = `${rootId}:${destination}`;
      seen.add(key);
      const previous = owned.files[key];
      await plan.put(rootId, destination, content, previous?.sha ?? null, '安装技能及配套参考');
      next.files[key] = { rootId, relative: destination, sha: hash(content) };
    }
  }
  for (const [key, record] of Object.entries(owned.files)) {
    if (record.relative?.includes('/skills/') && agents.includes(record.rootId) && !seen.has(key)) plan.conflicts.push({ path: record.relative, code: 'RETIRED_FILE', reason: '旧版本包含已退役文件，需要单独决定保留或移除。' });
  }
  if (scope === 'user') await plan.put('state', USER_STATE, json(nextUser), (await snapshot(roots.state, USER_STATE)).sha, '记录用户技能版本');
  if (integrateProject) {
    const config = await snapshot(roots.project, 'openspec/config.yaml');
    if (config.bytes) {
      const parsed = parseDocument(utf8(config.bytes, 'openspec/config.yaml'), { uniqueKeys: true });
      if (parsed.errors.length || !parsed.toJS() || typeof parsed.toJS() !== 'object' || Array.isArray(parsed.toJS())) throw new KitError('INVALID_CONFIG', '已有OpenSpec配置无效，保留原件，请先修复配置。');
      plan.notes.push('已有OpenSpec配置和Schema保持原样。');
    } else {
      const configBytes = await newConfig(options.language || 'zh');
      await plan.put('project', 'openspec/config.yaml', configBytes, null, '由官方OpenSpec生成初始配置');
      nextProject.files['project:openspec/config.yaml'] = { rootId: 'project', relative: 'openspec/config.yaml', sha: hash(configBytes), preserve: true };
    }
    for (const [relative, content] of [['.zzq-dev-kit/guide.md', guide()], ['.zzq-dev-kit/openspec.cjs', launcher()]]) {
      const key = `project:${relative}`;
      await plan.put('project', relative, content, oldProject.files[key]?.sha ?? null, '项目接入资源');
      nextProject.files[key] = { rootId: 'project', relative, sha: hash(content) };
    }
    const override = await snapshot(roots.project, 'AGENTS.override.md');
    const ruleFile = override.bytes && utf8(override.bytes, 'AGENTS.override.md').trim() ? 'AGENTS.override.md' : 'AGENTS.md';
    async function attachRule(file, field) {
      const rule = await snapshot(roots.project, file);
      const text = utf8(rule.bytes, file);
      const current = block(text);
      const eol = text.includes('\r\n') ? '\r\n' : '\n';
      const desired = ruleBlock().replaceAll('\n', eol);
      const prior = oldProject[field];
      if (prior && prior.path !== file) plan.conflicts.push({ path: file, code: 'RULE_OWNER_CHANGED', reason: '生效规则文件发生变化，请先核对旧接入块。' });
      if (prior && !current) plan.conflicts.push({ path: file, code: 'RULE_BLOCK_REMOVED', reason: '原接入块已被移除；保留当前文件，先确认是否重新接入。' });
      if (current && current.value !== desired && (!prior || hash(current.value) !== prior.sha)) plan.conflicts.push({ path: file, code: 'RULE_BLOCK_MODIFIED', reason: '接入块已被编辑，需合并后再升级。' });
      const merged = current ? text.slice(0, current.start) + desired + text.slice(current.end) : text + (text ? (text.endsWith('\n') ? eol : eol + eol) : '') + desired + eol;
      await plan.put('project', file, merged, rule.sha, '保留原规则，增加或更新ZZQ接入块');
      nextProject[field] = { path: file, sha: hash(desired) };
    }
    await attachRule(ruleFile, 'rule');
    if (agents.includes('claude')) await attachRule('CLAUDE.md', 'claudeRule');
    await plan.put('project', PROJECT_STATE, json(nextProject), (await snapshot(roots.project, PROJECT_STATE)).sha, '记录项目接入版本');
  }
  if (!integrateProject && scope === 'project') await plan.put('project', PROJECT_STATE, json(nextProject), (await snapshot(roots.project, PROJECT_STATE)).sha, '记录项目技能安装版本');
  return { plan, scope, agents };
}
export async function execute(ctx, command) {
  if (command === 'rollback') return rollback(ctx.roots.state, ctx.options.transaction, ctx.roots);
  const prepared = await planInstall(ctx, command);
  const summary = prepared.plan.summary();
  if (ctx.options.dryRun) return { status: summary.conflicts.length ? 'CONFLICT' : 'PLANNED', ...summary, scope: prepared.scope, agents: prepared.agents };
  const result = await apply(prepared.plan, ctx.roots.state);
  return { status: result.changed ? 'INSTALLED' : 'UNCHANGED', ...result, ...summary, scope: prepared.scope, agents: prepared.agents, next: command === 'install' ? '在目标项目运行 npx zzq-dev-kit init' : '在当前项目调用 $openspec-setup-zzq，核对业务事实与已有规则。' };
}
export async function doctor(ctx) {
  const checks = [];
  const add = (name, status, detail) => checks.push({ name, status, detail });
  let p, u;
  try { p = validState(await readJson(ctx.roots.project, PROJECT_STATE), PROJECT_STATE); u = validState(await readJson(ctx.roots.state, USER_STATE), USER_STATE); }
  catch (e) { add('manifest', 'FAIL', e.message); return { status: 'FAIL', checks }; }
  if (!p.kitVersion && !ctx.options.skillsOnly) add('project', 'FAIL', '当前项目尚未接入');
  if (!u.kitVersion && !p.kitVersion) add('skills', 'FAIL', '没有已管理的技能安装');
  if (p.kitVersion && p.scope === 'user') {
    for (const agent of p.agents || []) for (const name of SKILLS) {
      if (!u.files[`${agent}:skills/${name}/SKILL.md`]) add(`${agent}/${name}`, 'FAIL', '本项目所需的用户级技能安装记录缺失');
    }
    if (!u.projects?.[hash(ctx.roots.project)]) add('project-registration', 'FAIL', '用户级共享安装缺少本项目引用登记，请运行init检查修复计划');
  }
  for (const [owner, scope] of [[u, 'user'], [p, p.scope]]) {
    if (!owner.kitVersion || (owner === p && scope === 'user')) continue;
    for (const agent of owner.agents || []) for (const name of SKILLS) {
      const rootId = scope === 'user' ? agent : 'project';
      const prefix = scope === 'user' ? 'skills' : agent === 'codex' ? '.agents/skills' : '.claude/skills';
      if (!owner.files[`${rootId}:${prefix}/${name}/SKILL.md`]) add(`${agent}/${name}`, 'FAIL', '安装记录缺少必要技能');
    }
    if (!owner.agents?.length) add('agents', 'FAIL', '安装记录缺少Agent集合');
  }
  for (const owner of [u, p]) for (const record of Object.values(owner.files)) {
    try {
      if (!ctx.roots[record.rootId]) throw new Error('记录含未知根目录');
      const snap = await snapshot(ctx.roots[record.rootId], record.relative);
      add(record.relative, snap.sha === record.sha ? 'PASS' : record.preserve && snap.sha ? 'INFO' : 'FAIL', snap.sha === record.sha ? '与已记录版本一致' : record.preserve && snap.sha ? '项目自行维护的配置已变化，保持项目选择' : '文件缺失或已修改');
    } catch (e) { add(record.relative, 'FAIL', e.message); }
  }
  for (const rule of [p.rule, p.claudeRule].filter(Boolean)) {
    try { const snap = await snapshot(ctx.roots.project, rule.path); const b = block(utf8(snap.bytes, rule.path)); add(rule.path, b && hash(b.value) === rule.sha ? 'PASS' : 'FAIL', '核对接入块，保留块外规则'); }
    catch (e) { add(rule.path, 'FAIL', e.message); }
  }
  const incomplete = await pending(ctx.roots.state);
  if (incomplete.length) add('transactions', 'FAIL', incomplete);
  if (await stat(path.join(ctx.roots.state, 'install.lock'))) add('install-lock', 'FAIL', '存在安装锁；确认安装进程状态，异常退出后使用recover或rollback恢复。');
  if (!ctx.options.skillsOnly) {
    try {
      const data = JSON.parse(engine(['list','--json'], ctx.roots.project));
      add('openspec', data.root?.path ? 'PASS' : 'FAIL', { root: data.root, changes: data.changes?.length });
      if (data.root?.path) {
        const config = await snapshot(data.root.path, 'openspec/config.yaml');
        const document = parseDocument(config.bytes?.toString('utf8') || '');
        if (document.errors.length) throw new KitError('INVALID_CONFIG', '实际规划根的配置无法解析');
        const schema = document.toJS()?.schema || 'spec-driven';
        engine(['schema', 'validate', schema], data.root.path);
        add('schema', 'PASS', schema);
      }
    }
    catch (e) { add('openspec', 'FAIL', e.details?.length ? e.details : e.message); }
  }
  return { status: checks.some(c => c.status === 'FAIL') ? 'FAIL' : 'PASS', version: pkg.version, checks };
}
