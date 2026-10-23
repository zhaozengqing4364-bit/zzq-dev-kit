---
name: openspec-retro-zzq
description: 围绕已完成或暂停的工作及真实返工做复盘，定位规则、导航、文档或工具的改进点；按授权修正相关材料。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 复盘改进

先读[共同规则](../openspec-design-zzq/references/common.md)，按[工程反馈](../openspec-design-zzq/references/engineering-feedback.md#复盘只处理有证据的重复成本)和[Agent文档写作](../openspec-design-zzq/references/continuity-and-communication.md#写给agent的材料)工作。

1. 读取当前change的目标、实际决定、原失败、最终diff和验证，区分结果问题与过程原因；不从一次失误直接推出全局硬规则。
2. 查导航、事实可见性、已有检查未接通、重复/过时指令和工具反馈，优先修好既有机制；新增检查需捕获真实问题且成本合适。
3. 文档治理先聚焦本次范围，区分当前、部分、过时、冲突、历史及未知；用户要求全量重建才扩展。规格与实现冲突不能机械以代码覆盖约定，知识只保留一个权威位置。
4. 输出少量有依据的改进、收益/代价与验证；仅复盘请求到建议为止。已授权的直接相关可逆修正落到既有工具、技能或文档并检查引用；其余进入后续明确任务，不另建永久教训账本。
5. 不自动写全局记忆、安装hook、创建外部issue或全仓重构。历史决定按项目约定保留，先验证新指针再退旧入口。
6. 当前有价值的发现处理完就结束；没有新教训无需长报告。继续开发按[全流程](../openspec-design-zzq/references/lifecycle.md)复用原任务。
