# zzq-dev-kit

一条命令，将新项目或老项目接入 **OpenSpec + 10个ZZQ开发技能 + setup接入流程**。保留项目原有规则，冲突先报告，可检查、可升级、可恢复。

需要 **Node.js >=22.14 和 npm**。支持 Codex、Claude Code；命令可用于 macOS、Linux、Windows。OpenSpec 1.14.2及其依赖树通过npm-shrinkwrap随发布包固定，不要求全局安装，也不写入应用的 `package.json`。

## 快速开始

在项目目录运行：

```sh
npx zzq-dev-kit@latest init
```

默认将11个技能安装到用户级Codex目录，并接入当前项目。目标目录还不存在时也可指定：

```sh
npx zzq-dev-kit@latest init ./my-project
```

完成后在 Codex 中输入：

```text
$openspec-setup-zzq 核对这个项目的真实入口、规则和验证方式，完成接入。
```

CLI完成确定性的文件安装与检查；setup Skill读取源码和现有材料，补齐项目上下文。**安装完成不代表业务已经被理解或验收。** 不需要让模型调用、账户认证或外部供应商参与安装。

### Claude或团队项目

```sh
# 同时供Codex和Claude使用
npx zzq-dev-kit@latest init --agents codex,claude

# 技能随项目版本管理，不修改用户级技能
npx zzq-dev-kit@latest init --scope project --agents codex,claude

# 只安装技能，不接入当前项目
npx zzq-dev-kit@latest install --agents codex,claude
```

项目级技能分别位于 `.agents/skills` 和 `.claude/skills`；用户级分别使用 `CODEX_HOME/skills`（默认 `~/.codex/skills`）和 `CLAUDE_CONFIG_DIR/skills`（默认 `~/.claude/skills`）。安装采用实体副本以支持无符号链接权限的环境。不要同时在用户和项目安装不同版本的同名技能；工具不会替你删除已有副本。

已有项目沿用首次选定的scope/agents；变更安装范围或迁移旧技能需先讨论保留方式。已有同名文件与包完全一致时可复用；不同内容、额外文件或链接会触发冲突，整批不写入，不自动删除或覆盖。

## 新项目与老项目分别发生什么

| 情况 | 行为 |
|---|---|
| 没有OpenSpec | 在临时目录用官方CLI生成最小`spec-driven`配置，再纳入安装计划 |
| 已有OpenSpec | 原`config.yaml`、Schema、changes/specs保持，不执行覆盖式init |
| 已有AGENTS.md | 只添加带明确标记的ZZQ指针块，块外原文原样保留 |
| 已有非空AGENTS.override.md | 接到实际生效的override文件，AGENTS.md不变；空override保持空 |
| 旧技能或自定义内容冲突 | 报告具体路径并退出，先由你决定合并、备份迁移或保留 |
| 重复运行 | 同版本无差异时不重复插入、不创建新的恢复事务 |
| 有未完成事务 | 停止新写入，先恢复 |

只读扫描和安装不会执行你的应用脚本，不修改业务源码、依赖清单、凭据、模型配置、MCP、全局AGENTS，也不会提交、推送或部署。新配置默认中文文档；已有项目语言保持。可用 `--language en` 指定新项目语言。

选择Claude时也会在`CLAUDE.md`增加相同接入指针并保留原文。

项目新增资源：`.zzq-dev-kit/guide.md`、`openspec.cjs`、`manifest.json`，以及规则文件中的ZZQ块；新项目还会新增`openspec/config.yaml`。项目manifest只记录工具版本与文件归属，不记录业务任务状态。建议将项目接入文件随仓库维护；用户恢复日志不进入项目。

## 日常入口

| Skill | 任务 |
|---|---|
| `openspec-setup-zzq` | 安装后理解项目、接入、检查或升级 |
| `openspec-grill-with-docs-zzq` | 澄清并记录需求决定 |
| `openspec-explore-zzq` | 调查研究；不做原型 |
| `openspec-prototype-zzq` | 明确要求后制作隔离原型 |
| `openspec-design-zzq` | 创建、继续或修订OpenSpec设计 |
| `openspec-apply-zzq` | 实施与必要验证 |
| `openspec-review-zzq` | 规格/用户结果和工程质量审查 |
| `openspec-debug-zzq` | 定位问题，按授权修复复验 |
| `openspec-retro-zzq` | 根据证据复盘改进 |
| `openspec-handoff-zzq` | 工作交接与人工步骤指引 |
| `openspec-archive-zzq` | 明确范围的规格同步与归档 |

所有开发技能复用当前项目的规则和同一个change；不强制六阶段、不传播其他项目的业务/测试政策，也不引入第二套任务状态机。单独调查、设计、审查各自到本次终点；已授权完整开发可连续推进。原型和外部副作用仍按明确授权。

## 检查、预览、升级和恢复

```sh
npx zzq-dev-kit@latest init --dry-run
npx zzq-dev-kit@latest doctor
npx zzq-dev-kit@latest upgrade --dry-run
npx zzq-dev-kit@latest upgrade
npx zzq-dev-kit@latest rollback TRANSACTION_ID
```

`doctor`不修文件，检查安装完整性、受管理文件、接入块、实际OpenSpec根和Schema可解析性。项目自行修改config会显示INFO，仍检查它实际是否有效；不会强制还原配置。只检查技能可加`--skills-only`。所有命令可使用`--json`；失败/冲突返回非零退出。

升级仅更新已管理且没有漂移的内容。修改过的技能或接入块保持并报告冲突；块外新增规则保留。没有自动清理旧技能，也没有绕过冲突的`--force`。

每次变更在工具状态目录中保存前后内容与恢复ID，默认`~/.zzq-dev-kit`，可用`ZZQ_DEV_KIT_HOME`或`--state-dir`指定。多文件写入通过日志恢复，不宣称跨磁盘原子提交。失败会在版本仍匹配时尝试回退；进程被杀后的未完成事务可用rollback恢复。**有后续人工编辑时，恢复整批拒绝，先核对合并。** 恢复在原项目、相同home/Agent目录参数下执行；工具不恢复业务数据。另一项目已引用共享用户安装时，旧事务不会删除共享技能；依赖事务需先核对并按相反顺序恢复。

异常退出留下锁时，确认没有安装进程后运行：

```sh
npx zzq-dev-kit@latest recover
```

新锁在完整内容落盘后才原子公开，避免中断留下空锁。外部损坏的锁保持并报告具体路径，需要先讨论备份处理。它拒绝仍在运行的进程锁；如果存在未完成事务，会给出需要rollback的ID。回滚后可能保留空目录，以免删除后续放入的内容。

## 调用固定版本的官方OpenSpec

```sh
node .zzq-dev-kit/openspec.cjs list --json
node .zzq-dev-kit/openspec.cjs status --change CHANGE --json
# 或直接转发
npx zzq-dev-kit@1.0.0 openspec --version
```

项目代理通过npm exec加载接入时的固定版本。首次运行或缓存清除后需要网络；不会改变应用依赖。代理不包含伪造的OpenSpec实现。GitHub/tarball安装可用`ZZQ_DEV_KIT_SOURCE`给代理指定相同版本的包源；它是npm package spec，不是业务目录。

## 发布与兼容

固定版本可重现：`npx zzq-dev-kit@1.0.0 init`。`latest`仅决定这次运行哪个工具包版本，已管理的旧安装须显式upgrade，不会每次开发自动更新。

工程使用Node内置测试，隔离home/state，覆盖保留规则、冲突、重复安装、Schema、symlink、升级、并发与恢复；打包测试通过真实npm tarball执行init、doctor、官方代理和rollback。CI执行Linux/macOS/Windows矩阵。实际验证状态见仓库`docs/release-validation.md`；支持声明不代表所有第三方Schema或业务场景已验收。

```sh
npm ci --ignore-scripts
npm test
npm run check
npm run test:pack
```

MIT，来源与保留许可见[NOTICE.md](NOTICE.md)。
