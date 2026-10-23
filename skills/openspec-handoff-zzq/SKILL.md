---
name: openspec-handoff-zzq
description: 将长会话或暂停工作整理为可继续的OpenSpec接续材料，明确原始证据、待办和边界；必要时给人工作业向导。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 工作交接

先读[共同规则](../openspec-design-zzq/references/common.md)和[接续与沟通](../openspec-design-zzq/references/continuity-and-communication.md)，接续关系见[全流程](../openspec-design-zzq/references/lifecycle.md)。

1. 从当前文件和CLI确认change/root/Schema、代码目录与版本、有效任务边界；读取实际tasks和证据，区分已完成、失败、未验、待决定。
2. 在当前change既有接续位置记录接手者需要的差异：目标、决定指针、实际进度、原失败、允许/禁止操作、下一步及验收。已有规格/设计/任务用链接，不复制成第二份状态。
3. 用户明确需要可转交文件时生成引用为主的handoff；没有change的局部任务可用自有附件，不为交接创建假规划。凭据、个人资料和其他敏感业务数据不复制。
4. 确有人本人才能完成的步骤，先做可自动完成的准备，提供准确入口、操作、预期及返回的非敏感信息；多步易错时按需生成可恢复向导并做静态检查，不擅自执行外部副作用。
5. 用户没听懂时用当前业务语言解释现在结果、还差什么和需要决定什么。接续材料核对可达且足以继续即结束；恢复时再核对现场，不盲信旧摘要，也不自动给其他会话发送消息。
