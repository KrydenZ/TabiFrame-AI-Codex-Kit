# AGENTS.md — TabiFrame AI Codex 工作协议

## 单一真源
- 代码与项目规格的真源是 GitHub 仓库；Sites 仅作为体验/预览/部署渠道。
- 严格阅读 `TABIFRAME_AI_CODEX_MASTER_PLAN.md`；在每个开发阶段结束时更新工作进度，报告文件改动、测试结果、Git 状态。
- 遵守分阶段实现要求，未经确认不得提前实现后期 OAuth、付费 API、云存储或 Android 原生 App。

## UX 基准
- 参考 `examples/narita-shooting-plan.html` 的深绿＋米白风格、分段/图集/Shot List/进度条。
- 不减少成田 fixture 的 38组/67条数据；镜头提示、秒数、场景注释和 5 张参考图片及署名必须保留。
- Android Chrome 360px 宽度优先；交互应支持拇指操作和键盘使用。

## 技术约束
- React + TypeScript + Vite；Tailwind；React Router；Dexie；Zod。
- 模板数据与用户进度分离，采用稳定 projectId + shotId。
- AI 数据必须校验，不信任外部文本、图片 URL 或许可信息；不要把 HTML/JS 从 AI 输出直接执行。
- 持久化错误必须清楚提示；提供导入/导出备份。
- 首发手动生成/导入 JSON 无需任何 AI API Key。

## Prompt 约束
- Developer Core 固定且版本化；个人 Profile 可配置；Trip Input 为每次项目参数。
- 三段式：Trip Planner → Shot Director → Jianying Editor。
- 用户默认 gentle-piano-vlog-v2（钢琴约80%、主要场景口语字幕）；备选 ambient-walk-classic-v1（环境声主导）。不要混合。
- 无旁白、慢节奏、使用真实镜头；剪映导出的文字不等于视频成品。

## 每阶段完成报告格式
1. 本阶段完成了什么。
2. 修改的主要文件。
3. 执行过的命令和真实结果。
4. Git 分支/commit/PR，或无法提交的原因。
5. 未完成/需确认问题。
6. 下阶段建议，但不要自动跳到下一阶段。
