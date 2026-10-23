---
name: openspec-design-zzq
description: 创建、继续或修订OpenSpec规划，将明确方向形成业务、交互、工程、验收与任务切片；单独调用止于设计。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 方案设计

先读[共同规则](references/common.md)与[规划协议](references/planning.md)，按[全流程](references/lifecycle.md)接续同一change。

1. 判断是新建、继续、补齐还是修订；读取实际Schema/依赖和已有产物。用户只要空容器或下一份产物时按其范围；完整方案则补齐applyRequires的传递依赖，不让用户选择new/ff/continue等技术命令。
2. 从已确认目标和当前事实出发，按[设计方法](references/design-methods.md)只补相关需求、领域、范围、UX/UI、技术与验收缺口。已有决定不重问，新重大政策交[grill-with-docs](../openspec-grill-with-docs-zzq/SKILL.md)。
3. 技术未知先用[explore](../openspec-explore-zzq/SKILL.md)调查；只有明确原型授权才转[prototype](../openspec-prototype-zzq/SKILL.md)。高影响未知只阻塞依赖切片，普通可逆细节留给实施。
4. 沿CLI返回的实际产物ID、路径和依赖完成本次所需规划；没有独立调研/验收产物时，将相关内容归入现有合适产物；修订后同步直接受影响内容，并标明旧实现/证据哪些失效。
5. 按业务例子对齐设计和验收，切片包含真实用户结果、直接消费者、反馈/恢复及最低有效验证。必要的场景/测试工具细节见[验收编写](references/specs-testing.md)。
6. 内容足以交接且定向校验通过后报告规划范围、待决/未验和下一步。单独设计到此停止；已授权完整实施继续[apply](../openspec-apply-zzq/SKILL.md)。用户要学习流程时用小例子解释当前阶段，不额外建立onboard流程。
