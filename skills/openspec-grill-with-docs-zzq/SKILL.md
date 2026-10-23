---
name: openspec-grill-with-docs-zzq
description: 围绕计划或功能进行深入澄清并随讨论记录决定；用于用户想把需求、政策与边界想清楚。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 需求澄清

先读[共同规则](../openspec-design-zzq/references/common.md)，接续关系见[全流程](../openspec-design-zzq/references/lifecycle.md)。

1. 从现有change、需求材料和真实实现开始，已确认决定直接复用。能查明的事实自行调查，不让用户回答源码能解决的问题。
2. 按[澄清方法](../openspec-design-zzq/references/shaping-methods.md)建立决策依赖，先问前置已明确的重要业务/权限/范围选择；每轮1—3个关键问题，给推荐、替代及代价。术语歧义用具体场景检验。
3. 这个入口包含记录决定的任务。优先继续原change；需要新规划且目标已明确时按[规划协议](../openspec-design-zzq/references/planning.md)创建容器并记录当前可确定内容。明确仅口头讨论时尊重该边界。
4. 每次确认后及时更新当前Schema中拥有该决定的产物；稳定词汇归项目既有入口，重要长期取舍才写ADR。推荐未获回答保持待决，不提前填成正式契约或可实施任务。
5. 当前范围已清楚，或剩余待决及影响明确时，交付关键决定、未决项和下一步。仅澄清到此结束；已有完整设计/实施授权则沿design/apply继续，无需重复确认。
