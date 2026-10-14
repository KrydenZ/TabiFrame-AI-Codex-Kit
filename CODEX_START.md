# TabiFrame AI — 回家交给 Codex 的第一条消息

## 使用方式

1. 在 GitHub 新建代码仓库 `tabiframe-ai`（建议先设为 Private）。
2. 把这个文件夹里的文件及目录上传到仓库根目录。
3. 在 Codex 连接或克隆这个 GitHub 仓库，确保有写入、commit/PR 权限。
4. 把下面一段完整复制给 Codex。
5. 第一轮只做 Phase 0 和 Phase 1，完成后先在浏览器实际检查，再继续其他 Phase。

## 第一条给 Codex 的 Prompt（完整可复制）

```text
你现在是我的全栈工程师，负责开发 TabiFrame AI（Your AI Travel Vlog Assistant）。

请完整阅读仓库根目录的 TABIFRAME_AI_CODEX_MASTER_PLAN.md、AGENTS.md、CODEX_START.md，及 examples/ 和 prompts/ 下的资料。

产品要求：一个主 Site 管理多期旅行 Vlog（不是每个地点部署一个 Site），手机 Chrome 优先；每期先规划路线，再生成像成田篇一样详细的拍摄 HTML，现场勾选镜头，最后导出剪映 AI 提示词。

特别重要：examples/narita-shooting-plan.html 是当前可运行的参考网页；examples/narita.project.json 是完整 38 组镜头/67 条素材的结构化数据；请逐条对照，禁止把拍摄表简化成普通待办清单。参考图有 5 张，保留图片来源及版权署名，远程图加载失败时显示降级提示。

技术栈：React + TypeScript + Vite + Tailwind CSS + React Router + Dexie/IndexedDB + Zod。第一版完全允许离线/手动导入 JSON 工作流，不依赖 OpenAI API Key、不提前接入 AWS、Cognito 或付费功能。固定核心 Prompt 不开放普通用户修改，用户只能设置个人 Profile 与每次行程。

请首先只实施 Phase 0 和 Phase 1：
(1) 初始化工程、组件目录、Schema、数据层与测试环境；
(2) 从 narita.project.json 渲染成田 Shooting 页面，保持原网页视觉与每条镜头说明；
(3) 完成勾选即保存、组/素材双进度、图片说明、手机端布局与离线文字回退；
(4) 运行 npm run build、npm test，并核对38/67、5张图片以及勾选第10组应显示1组/3条；
(5) 汇报修改文件、测试结果、未解决项，创建可追踪的 Git commit 或 PR。

不要一次性实现所有 Phase；不要创建只有 Site 没有 GitHub 源代码的项目；不要把“普通用户的 Codex 套餐自动提供第三方网站 API”当作现成可行功能。
```

## 后续阶段怎么继续

- Phase 2：用总计划附录 C3 的 Prompt。
- Phase 3：附录 C4。
- Phase 4：附录 C5。
- Phase 5：附录 C6。
- Phase 6（仅调研）：附录 C7。

## 检查是否真的写进 GitHub

在 Codex 任务完成后确认：GitHub 仓库里出现 `src/`、`package.json`、测试以及对应 commit/PR。只有 Sites 页面外观发生变化并不代表源代码已经回写 GitHub。
