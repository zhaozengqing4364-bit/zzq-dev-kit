# 同一个OpenSpec变更的全流程

跨入口接续或需要判断下一步时读取。十个技能是十种可单独发起的任务，OpenSpec仍是唯一规划和任务状态来源；不存在额外技能状态机。

## 选择与接续

先按共同规则读取当前项目选择，再解析同一root/store、change、Schema、代码根与有效授权；接手已有change先复用实际产物和证据。只有目标确实独立才新建change。讨论尚无明确变更时可先给结论；明确需要保存规划时才创建容器，不强迫所有小修建change。

| 用户任务 | 入口 | 结果归属及本次终点 |
|---|---|---|
| 澄清想法并记录决定 | [grill-with-docs](../../openspec-grill-with-docs-zzq/SKILL.md) | 当前调研/需求位置中的问题；已确认决定回其所属规划产物；当前关键决定足够或明确待决时结束 |
| 调查、研究、理清大任务 | [explore](../../openspec-explore-zzq/SKILL.md) | 事实、来源、决策地图及未知；只调查，不创建或运行原型 |
| 用小实验回答设计问题 | [prototype](../../openspec-prototype-zzq/SKILL.md) | 明确原型授权后才运行；隔离证据，结论回当前调查、设计或验证依据位置 |
| 新建、继续或修订规划 | [design](../SKILL.md) | 依实际Schema补所需产物与验证安排；到本次设计目标 |
| 实施或继续开发 | [apply](../../openspec-apply-zzq/SKILL.md) | 按任务完成行为与必要验证，更新实际tasks行与证据 |
| 审查方案、代码或用户结果 | [review](../../openspec-review-zzq/SKILL.md) | 规格/用户结果及工程质量两轴；报告已证、缺陷与未验 |
| 分类反馈、排查Bug | [debug](../../openspec-debug-zzq/SKILL.md) | 原始失败、原因及建议；已授权修复时沿apply完成闭环 |
| 总结返工并改进工作环境 | [retro](../../openspec-retro-zzq/SKILL.md) | 当前证据中的原因/建议；授权修正归既有规则或工具 |
| 换会话、换Agent或人工接续 | [handoff](../../openspec-handoff-zzq/SKILL.md) | 现有change接续位置和证据指针；不新建平行任务表 |
| 同步规格或归档选定变更 | [archive](../../openspec-archive-zzq/SKILL.md) | 按明确模式同步/归档，分别报告部分结果；不隐含发布 |

## 连续开发与单步调用

只调用澄清、调查、原型、设计或审查时，完成其目标就交付，不从下一个技能的存在推断实施授权。用户明确要求全流程开发时，可复用已确认决定完成必要设计→apply→相称review；普通错误自主处理，不在每个阶段重复确认。原型、受限测试、发布、正式同步和归档仍核对各自授权，不能从“完整开发”暗中扩张。

产物图、skipped、glob和路径以当前项目CLI为准。技能不与文档一一绑定：grill/explore/prototype提供输入，design按Schema保存正式规划。标准spec-driven可能只有proposal/specs/design/tasks，调查和验收可并入这些产物；自定义Schema沿其实际依赖，不安装或切换另一项目的Schema。

## 返回修订与恢复

- 调查、原型或实施发现新事实：更新其拥有产物；行为/范围改变回design，重要政策回grill-with-docs，只阻塞依赖待决项。明确的低风险实现细节自行处理。
- review发现缺陷：只读请求交报告；既有授权包含修复则回debug/apply，修复后复验原场景。规格本身需要改变时先核对用户决定，不能改断言掩盖失败。
- handoff恢复：核对当前文件、版本与目标环境，再从实际未完成任务继续；摘要不替代事实。
- archive发生冲突或部分写入：保留未完成记录，按同步/归档协议核对现场，不通过目录移动或重复全量写入绕过。

一次有效交接只需目标/边界、change定位、已确认决定指针、实际进度与证据、未决事项和下一步；不要求每次写新的handoff文件。
