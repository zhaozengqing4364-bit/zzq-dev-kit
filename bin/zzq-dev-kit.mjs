#!/usr/bin/env node
import { context, doctor, execute, pkg } from '../src/kit.mjs';
import { KitError } from '../src/files.mjs';
import { forward } from '../src/engine.mjs';
import { pending, withLock } from '../src/transaction.mjs';

const help = `zzq-dev-kit ${pkg.version} — OpenSpec 与 ZZQ 技能接入

用法：npx zzq-dev-kit [init] [项目目录] [选项]
  init              安装完整技能，并接入当前或指定项目
  install           只安装技能，不修改项目规则或OpenSpec
  doctor            只读检查已安装内容和项目接入
  upgrade           更新已管理且未修改的文件，保留原规则
  rollback <ID>     恢复一次事务；后续改动会阻止恢复
  recover           清除已退出进程留下的锁；有未完成事务时给出恢复ID
  openspec <参数>   转发到随包固定版本的官方OpenSpec引擎

选项：
  --project <路径>       目标项目（默认当前目录）
  --agents codex,claude  目标Agent（默认codex）
  --scope user|project  技能安装范围（默认user，已接入项目沿用原范围）
  --dry-run             只显示计划，不写目标文件
  --json                机器可读结果
  --skills-only         doctor仅检查技能
  --language zh|en      新OpenSpec文档语言（默认zh，已有配置保持）
  --home <路径>         指定用户目录，用于独立环境
  --state-dir <路径>    本机版本与恢复记录目录
  --codex-home <路径>   指定Codex配置根（否则遵循CODEX_HOME）
  --claude-home <路径>  指定Claude配置根（否则遵循CLAUDE_CONFIG_DIR）
  --version / --help

冲突不会强制覆盖；请先比较文件并决定迁移方式。接入后调用 $openspec-setup-zzq。`;
const argv = process.argv.slice(2);
const machine = argv.includes('--json');
function output(value) {
  if (machine) { console.log(JSON.stringify(value, null, 2)); return; }
  console.log(`zzq-dev-kit: ${value.status || '完成'}`);
  if (value.error) console.error(value.error);
  for (const c of value.changes || []) console.log(`  ${c.action}: ${c.path}`);
  for (const c of value.conflicts || value.details || []) console.log(`  ${JSON.stringify(c)}`);
  for (const c of value.notes || []) console.log(`  ${c}`);
  for (const c of value.checks || []) if (c.status !== 'PASS') console.log(`  ${c.status}: ${c.name}: ${JSON.stringify(c.detail)}`);
  if (value.checks) console.log(`  检查 ${value.checks.length} 项`);
  if (value.transaction) console.log(`  恢复ID：${value.transaction}`);
  if (value.next) console.log(`\n${value.next}`);
}
try {
  if (argv[0] === 'openspec') process.exitCode = await forward(argv.slice(1), process.cwd());
  else if (argv.includes('--help') || argv.includes('-h')) console.log(help);
  else if (argv.includes('--version') || argv.includes('-v')) console.log(pkg.version);
  else {
    let command = 'init';
    if (argv[0] && !argv[0].startsWith('-')) command = argv.shift();
    if (!['init','install','doctor','upgrade','rollback','recover'].includes(command)) throw new KitError('INVALID_ARGUMENT', `未知命令：${command}。使用--help查看用法。`);
    const options = {};
    const values = { '--project': 'project', '--agents': 'agents', '--scope': 'scope', '--home': 'home', '--state-dir': 'stateDir', '--codex-home': 'codexHome', '--claude-home': 'claudeHome', '--language': 'language' };
    const bools = { '--dry-run': 'dryRun', '--json': 'json', '--skills-only': 'skillsOnly' };
    for (let i = 0; i < argv.length; i++) {
      const flag = argv[i];
      if (bools[flag]) options[bools[flag]] = true;
      else if (values[flag]) {
        if (!argv[i+1] || argv[i+1].startsWith('--')) throw new KitError('INVALID_ARGUMENT', `${flag}缺少值`);
        const value = argv[++i]; options[values[flag]] = flag === '--agents' ? value.split(',') : value;
      } else if (!flag.startsWith('-') && command === 'rollback' && !options.transaction) options.transaction = flag;
      else if (!flag.startsWith('-') && ['init','doctor','upgrade'].includes(command) && !options.project) options.project = flag;
      else throw new KitError('INVALID_ARGUMENT', `不支持的参数：${flag}`);
    }
    if (options.language && !['zh','en'].includes(options.language)) throw new KitError('INVALID_ARGUMENT', 'language应为zh或en');
    if (options.dryRun && ['rollback','recover','doctor'].includes(command)) throw new KitError('INVALID_ARGUMENT', `${command}不接受--dry-run`);
    if (command === 'rollback' && !options.transaction) throw new KitError('INVALID_ARGUMENT', 'rollback需要事务ID');
    const ctx = await context(options);
    let result;
    if (command === 'doctor') result = await doctor(ctx);
    else if (command === 'recover') result = await withLock(ctx.roots.state, async () => {
      const active = await pending(ctx.roots.state);
      if (active.length) throw new KitError('RECOVERY_REQUIRED', '请使用rollback恢复列出的事务', active);
      return { status: 'RECOVERED', next: '已确认没有未完成事务，可以重新运行init或upgrade。' };
    }, true);
    else result = await execute(ctx, command);
    output(result);
    if (['FAIL','CONFLICT'].includes(result.status)) process.exitCode = 1;
  }
} catch (e) {
  output({ status: 'FAIL', code: e.code || 'UNEXPECTED_ERROR', error: e.message, details: e.details || [] });
  process.exitCode = 1;
}
