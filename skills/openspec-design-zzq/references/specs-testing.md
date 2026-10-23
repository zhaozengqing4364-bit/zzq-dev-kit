# 规格场景与验收编写

用于设计验收、实施测试或维护明确采用的可执行规格。遵守项目测试边界，优先既有runner、fixture和脚本，不自动安装框架。

普通OpenSpec沿当前Schema的WHEN/THEN与Markdown结构。预期来自业务原文、确认例子或原失败，Given写初始事实，When一个有意义动作，Then外部可观察结果。同一规则的数据变化可用Outline/Examples；保留需求身份和Purpose，避免仅复述实现形状。

选能证明本次结果的最低有效验证层，只补真实缺口。先确认版本、fixture、依赖和fake供应商；修复回到原失败，UI/E2E、真实模型/供应商和负载仍按授权，不通过聚合命令越界。

只有项目/用户明确采用spec-as-source且当前Schema使用兼容的spec.md布局与fenced-Gherkin格式时，才读取[提取契约](acceptance/EXTRACTION.md)、[组合契约](acceptance/COMPOSITION.md)，按已有语言选[JS](acceptance/javascript/SETUP.md)或[Python](acceptance/python/SETUP.md)。范例见[spec](executable-spec-examples/spec.md)和[tasks](executable-spec-examples/tasks.md)。feature由正式规格及适用active delta组合提取，排除archive，不手工维护另一套事实源。同步前后场景效果应一致。自定义产物布局应先适配提取配置或实现并验证，不能直接套用这些标准布局示例。

修改提取/组合器时核对已有两种绑定的契约一致；普通业务测试不触发跨语言移植。采用可执行规格不附带commit/stash、Git分区或main-first；Git政策仅在明确采用时按[约定](git-policy.md)处理。
