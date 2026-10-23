---
name: openspec-review-zzq
description: 审查方案、代码改动或用户流程，对照OpenSpec规格与工程约定核对结果和证据；默认只读，区分缺陷与未验。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 规格与质量审查

先读[共同规则](../openspec-design-zzq/references/common.md)与[核验细则](references/verification.md)，接续关系见[全流程](../openspec-design-zzq/references/lifecycle.md)。

1. 固定对象、基线、版本和证据层级。当前任务包含自有staged/unstaged/untracked；先从原始需求、用户决定与规格建立预期，再读实现，不以开发者总结当结论。
2. 分别核对规格/用户结果与工程质量两轴：遗漏/越界、状态/权限/不变量、失败恢复、资源成本与维护负担。按实际Schema处理缺失、skipped、删除和改名，不将空tasks当全部完成。
3. 用户流程检查角色、真实入口、主操作、反馈、输入保留、返回上下文和本次异常；直接共享组件/接口消费者也要覆盖。不能用页面文件清单或截图代表完整验收。
4. 每项发现给触发、证据、影响、最小修正及复验条件，保留已修、误报纠正与未验。UI/设备验收采用当前项目允许的工具、脚本与授权范围，不沿用其他项目禁令；未执行且需要人工完成的部分，交前置数据、操作与预期。
5. 默认只读，不改业务/测试/规格。请求包含保存报告时写当前change的验证位置；已授权修复则返回debug/apply后定向复验，仅审查则到报告为止。相同上下文自查不能标独立审计。
6. 本次证据足以判断就结束，不固定审查轮数或Agent人数；需归档由[archive](../openspec-archive-zzq/SKILL.md)按明确授权承接。
