---
name: openspec-apply-zzq
description: 按已有OpenSpec任务实施或继续开发，补必要规划、处理普通错误并验证完整用户结果；按实际证据更新进度。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 实施开发

先读[共同规则](../openspec-design-zzq/references/common.md)，接续关系见[全流程](../openspec-design-zzq/references/lifecycle.md)。

1. 选定真实change，读取status及instructions apply，使用contextFiles/tasks/progress/sourcePath/line。blocked时不直接实现；若授权包含规划且事实充分，由[design](../openspec-design-zzq/SKILL.md)补齐后刷新，实际ready才实施。
2. 按一片完整用户结果实现入口、生产者/消费者、状态反馈、失败恢复和必要文档；共享状态及构建产物明确单写者。测试按[验收编写](../openspec-design-zzq/references/specs-testing.md)及项目授权执行。
3. 普通错误自行分类定位代码、契约、fixture、环境或产物污染并复验。难Bug交[debug](../openspec-debug-zzq/SKILL.md)保留原失败；重大规则/范围变化回design，关键业务待决不擅自决定。
4. 只有任务行为及所需验证完成才勾选，写前核对实际sourcePath/line仍对应原任务，漂移则刷新。未运行的必要项保持未完成。需要Git政策时仅在明确采用后读取[约定](../openspec-design-zzq/references/git-policy.md)。
5. 刷新apply进度。all_done只代表已登记任务结束；按风险用[review](../openspec-review-zzq/SKILL.md)或相称自查核对完整diff和实际验收，发现已授权范围内的问题继续修复。
6. 报告实现、验证和待验范围；有接续需要用[handoff](../openspec-handoff-zzq/SKILL.md)，有重复成本按需用retro。同步、归档、提交与发布依各自授权，不由任务勾完推断。
