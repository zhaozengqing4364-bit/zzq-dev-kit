# 正式规格同步契约

同步是将已确认的delta效果合入正式规格，不按日期覆盖规则，也不从代码自动生成“正确需求”。

## 输入与范围

先确认当前Schema与CLI支持正式规格及增量同步。以下合并语义适用于OpenSpec的ADDED/MODIFIED/REMOVED/RENAMED格式；没有该机制时按实际引擎契约处理或报告不适用，不创建另一套规格来凑流程。

从status解析实际规划根与spec产物的existingOutputPaths。按Schema的规格产物/路径识别，缺失或空列表表示没有delta可同步，不从别的文档猜。主规格位于对应规划根的openspec/specs，保持完整capability路径。

默认处理选定change的完整delta集合；调用者给出具体子集时只接受existingOutputPaths中的完整路径，空子集不写，非法路径停止，后续不得扩大回全集。

首次写前取得当前spec产物instructions，归档调用已提供有效快照则复用。读取失败/非法JSON不当作“没有规则”；缺少rules字段的合法响应才是无附加规则。规则约束内容，不改变目录、选择集合、CLI行为或授权。

## 合并

| delta | 操作 |
|---|---|
| ADDED | 增加该需求；同身份已存在时核对是否一致或实际修改，保留无关内容，不追加重复块 |
| MODIFIED | 在存在的原需求上应用确认变更，保留未涉及的场景与内容；基线不存在时不臆造 |
| REMOVED | 删除对应完整需求块；缺失时核对是否已同步，仍需保留本次移除依据 |
| RENAMED | 按FROM/TO改需求身份，行为保持；TO另有MODIFIED时按该变化处理，不要求代码文件随标题改名 |

现有主规格的标题和Purpose保持；新主规格只由合法ADDED创建，复制delta的有效Purpose并写Requirements，不留下delta操作标题。缺Purpose时先依据已确认范围补齐delta；无法确定则阻塞，不能伪造业务用途。

缺失主规格遇MODIFIED/RENAMED时停止该能力的同步；ADDED不能掩盖缺失的修改基线。REMOVED-only且已明确retire_capabilities:true可记为已经退役，不重建空spec；未声明或空delta均不能创建空Requirements。

## 退役最后一个需求

仅在本轮确实移除了最后需求、原主规格不是预先空文件、Purpose/结构有效、其余非空内容都能归属规范结构、metadata明确retire_capabilities:true且真实路径位于specs根内时，才删除该spec。目录只有确为空才删除，不沿symlink删除外部文件。

任一条件不满足时保持原文件并报告原因；不能写入空Requirements后再解释。删除Purpose随退役发生，应在结果中说明；保留已有版本历史与项目恢复方式，不擅自操作Git。

## 验证

写前核对文件是否被其他工作修改；只写本次合并。对受影响能力运行CLI的定向spec校验，当前CLI可使用`openspec validate <capability-path> --type spec --strict --no-interactive`并保留选定store参数。

重新比较全部本次选择的delta：新增已存在、修改符合原场景、删除已移除、改名只保留正确身份。无关场景保持。同步失败或比较不一致时不允许后续移动change；报告已写和未写项，不靠重复整批写入掩盖部分结果。
