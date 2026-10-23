---
name: openspec-explore-zzq
description: 调查现有行为、研究一手资料、分析方案或大任务决策依赖；只调查研究，不创建或运行原型。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 调查研究

先读[共同规则](../openspec-design-zzq/references/common.md)，接续关系见[全流程](../openspec-design-zzq/references/lifecycle.md)。

1. 明确本次要回答的问题，按实际入口、相关规格、源码/配置与现有证据调查；外部事实按需要查第一方材料。区分事实、推断、假设和未知。
2. 用[探索方法](../openspec-design-zzq/references/shaping-methods.md)组织研究与大任务决策地图。回答具体问题，标来源/版本/条件；优先处理依赖已经清楚且影响大的未知。
3. 本入口保持调查与分析边界：可以读源码、已有实验结果和工具文档；不创建或运行原型、修改业务代码，或将只读调查扩张为测试执行。
4. 发现需要小实验时，给出待验证问题、观察标准及建议。只有当前授权已明确包含原型任务时才转[prototype](../openspec-prototype-zzq/SKILL.md)；否则保留建议，不自行启动。
5. 输出有依据的回答、可选路线、推荐和未决影响。用户要求保存结论时回当前项目的调查/设计位置或证据附件；仅讨论就回复，不强制新建change。进一步设计按有效授权交[design](../openspec-design-zzq/SKILL.md)。
