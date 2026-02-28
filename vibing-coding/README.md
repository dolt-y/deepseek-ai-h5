# Vibing Coding 规范目录

用途
- 用于每次版本迭代的需求开发记录
- 统一沉淀需求、任务、测试与发布信息
- 方便回溯决策与变更

目录结构
- `iterations/` 迭代目录，每个版本一个子目录
- `templates/` 模板目录，创建新迭代时复制
- `scripts/` 辅助脚本
- `backlog.md` 待办池
- `changelog.md` 变更摘要

创建新迭代
- 推荐命名：`YYYY-MM-DD-vX.Y.Z-短标题`
- 使用脚本：`./vibing-coding/scripts/new-iteration.sh "YYYY-MM-DD-vX.Y.Z-短标题"`
- 手动复制：复制 `templates/iteration` 到 `iterations/` 并重命名

填写顺序
- 先写 `01-brief.md`
- 再补 `02-tasks.md`
- 上线前补 `03-release.md`

约定
- 需求不明确时先完善 `01-brief.md`
- 任何关键决策必须落到对应文档
- 接口变更在 `01-brief.md` 里说明
- 风险或回滚写到 `03-release.md`
