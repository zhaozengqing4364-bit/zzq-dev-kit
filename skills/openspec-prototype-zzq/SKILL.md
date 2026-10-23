---
name: openspec-prototype-zzq
description: 在用户明确要求原型或小实验时，用隔离代码验证具体设计问题；记录结论，不自动进入生产实现。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 一次性原型

先读[共同规则](../openspec-design-zzq/references/common.md)，接续关系见[全流程](../openspec-design-zzq/references/lifecycle.md)。

1. 核对明确的原型任务授权及要回答的问题。普通“调查/研究/分析”不构成授权；用户已明确要求原型时直接准备，不重复询问。
2. 从当前change读取相关决定和未知，先定义一个可观察问题、比较条件及停止标准。逻辑/状态问题做最小模型，交互问题只制作回答取舍所需的界面；不固定生成多套UI。
3. 使用自有隔离目录、合成数据和最少依赖，避免进入生产依赖图、业务配置或正式任务实现。提供足以观察动作与结果的状态；涉及UI、数据库、外部调用的执行仍按项目授权，不以原型绕开限制。
4. 按已授权的最低有效方式观察结果，保留问题、条件、版本、证据、结论及限制。未实际运行标NOT_RUN，构建或截图不代替用户结果。实验不能替用户决定权限、保留期限等业务政策。
5. 将结论放回同一change中实际存在的调查、设计或验收位置，原始材料作引用附件；尚无change时保留自有实验说明，后续设计引用，不为实验强建整套规划；仅原型任务不勾正式实现tasks。先保存可复核证据，再清理本次自有且无用的原型，保留用户要求的材料。
6. 到问题已回答或明确不可验证边界结束。若已授权正式实施，先由[design](../openspec-design-zzq/SKILL.md)落实契约再由[apply](../openspec-apply-zzq/SKILL.md)实现；原型不自动晋升生产代码。
