---
name: openspec-debug-zzq
description: 分类原始反馈，复现并诊断Bug或性能回退；只诊断时交原因与建议，已授权修复时完成定向修复和复验。
metadata:
  author: zzq
  version: 2.1.0
  suite: openspec-zzq
license: MIT
---

# OpenSpec ZZQ · 问题诊断

先读[共同规则](../openspec-design-zzq/references/common.md)和[工程反馈方法](../openspec-design-zzq/references/engineering-feedback.md)，接续关系见[全流程](../openspec-design-zzq/references/lifecycle.md)。

1. 核对原始报告、版本与影响，区分缺陷、新需求、环境/fixture问题、重复、已实现但入口不可达及过时反馈。用业务概念和真实调用确认，不能只凭同名函数判完成。
2. 复用当前change/issue及已有失败证据。明确局部小修不强制新建change；跨模块行为变化或长期接续按design承接正式规划。
3. 选择最低有效接缝复现真实症状；先核对测试执行授权。只读诊断或条件受限时依据源码/日志提出假设，运行复现保留NOT_RUN，不偷跑原型或测试。
4. 假设要有可证伪预测，检查可信替代解释；一次改变能区分原因的变量。重复失败无新信息时先定位环境、runner、夹具与产物污染，避免无限重跑。
5. 仅诊断到原因、证据、建议和复验条件结束。用户已授权修复时，经[apply](../openspec-apply-zzq/SKILL.md)或局部轻量路径做最小修复并复验原失败；行为政策变化先回design/澄清。
6. 将真实结果归当前验证记录或本次交付，未知与修复未复验分开；外部issue写入需明确授权。
