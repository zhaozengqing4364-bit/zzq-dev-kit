---
name: openspec-archive-zzq
description: 按明确请求同步OpenSpec正式规格，或归档选定的单个/多个变更；检查任务、语义冲突、目标碰撞及部分结果。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 规格同步与归档

先读[共同规则](../openspec-design-zzq/references/common.md)，接续关系见[全流程](../openspec-design-zzq/references/lifecycle.md)。

1. 判断本次模式是仅同步规格、归档一个change还是明确的一组change；对象按用户名称或已有确定上下文选择，不默认全仓，也不重复询问已确定名单。
2. 仅同步时读[同步契约](references/spec-sync.md)：读取真实delta与当前instructions，处理ADDED/MODIFIED/REMOVED/RENAMED，保留Purpose与未涉及场景，验证后报告同步/未同步，到此结束，不移动change。
3. 归档时读[归档协议](references/archive.md)：核对实际任务、artifact、验证边界及目标碰撞。标准同步和就绪条件已清楚时直接执行；未完成归档、放弃同步或真实语义冲突按具体差异取得决定。
4. 批量同能力delta按已确认语义和真实依赖处理，非冲突可组合，时间较新不自动覆盖。固定选定同步集合，避免排除的delta在后续全量同步中被写回。
5. 使用官方CLI，合法参数及选定store；逐项同步/归档串行，操作前重核目标，不覆盖已存在归档，不绕过校验。失败先核对规格和目录是否已部分写入，保留现场再恢复。
6. 汇报实际路径、同步范围、成功/失败/跳过及未完成/未验项。任务all_done、审查通过或开发请求本身不等于归档授权，归档也不等于发布。
