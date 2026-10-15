# TabiFrame AI 1.0

TabiFrame AI 是一个手机优先的旅行 Vlog 策划账本。它帮助个人用户管理多期旅行项目、查看成田风格拍摄清单、手动勾选计划完成记录，并整理可复制给剪映的文字。

> App 不调用相机或相册，不上传、识别、保存或剪辑视频。勾选只代表用户手动记录某个计划组完成，不代表系统核验了真实素材。

当前唯一开发基准是 [`TABIFRAME_AI_PHASE_PLAN_PROTOTYPE_V2.md`](./TABIFRAME_AI_PHASE_PLAN_PROTOTYPE_V2.md)。旧 M1 计划已从仓库删除。

Phase 0–6 已全部执行；其中 Phase 6 按规格完成了资格核对和安全降级，但因为远程网站授权资格与真实线上推理尚未具备，没有伪造为“站内 AI 已接通”。逐阶段记录见 [`docs/PHASE_COMPLETION.md`](./docs/PHASE_COMPLETION.md)。

## 当前能力

- 多项目首页；内置成田基准和镰仓演示计划。
- 成田 38 组、67 条计划素材、5 张参考图及署名完整保留。
- 项目间进度隔离，Checkbox 刷新后通过 Dexie/IndexedDB 恢复。
- 同时统计完成组数和对应计划素材条数。
- 最小旅行条件表单，生成可复制的结构化计划指令。
- 外部 ChatGPT/Codex 生成 JSON 后严格校验并导入，不需要 API Key。
- 完整项目 JSON 备份与恢复；ID 冲突时自动创建独立恢复副本。
- 固定剪辑规则草案和基于当前勾选记录的镜头摘要，可复制给剪映。
- 打印/保存 PDF、远程图片失败降级、360px 手机布局。
- 无效旧记录安全隔离并给出备份/恢复建议；带 `verified` 的导入事实必须同时提供可靠 HTTPS 来源和核实时间。

## 本地运行

需要 Node.js 20.19+ 或 22.12+，推荐 pnpm 10+。

```bash
pnpm install
pnpm dev
```

浏览器打开 `http://127.0.0.1:5173/`。应用使用 Hash Router，项目地址形如：

```text
http://127.0.0.1:5173/#/projects/narita-2026-10-10/shooting
```

## 使用流程

1. 在项目首页打开成田或镰仓示例，或点击“新建旅行计划”。
2. 填写目的地、日期/季节、拍摄时间和目标成片时长。
3. 复制结构化生成指令，在自己的 ChatGPT/Codex 中生成纯 JSON。
4. 把 JSON 粘贴或作为文件导入；通过 Zod 校验后保存为新项目。
5. 在拍摄页手动勾选计划组；进度保存在当前浏览器。
6. 查看并复制剪映规则草案与勾选摘要。
7. 定期“导出项目备份”；在项目首页可以恢复 JSON。

## 数据与真实性

- 项目和进度只保存在当前浏览器；清除站点数据可能丢失，目前不承诺跨设备同步。
- 生成或导入内容不会以 HTML 执行，图片链接只接受 HTTPS。
- 不确定的交通、开放时间、拍摄许可和现场状况必须显示为待核实。
- 外部参考图需要联网；失败时拍摄文字、Checkbox 和署名仍可用。
- 剪映文字状态是 `rules-draft`（规则整理草案），历史最终 Prompt 尚未由用户确认。

## 检查

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

测试覆盖成田 38/67/5、3 条素材组计数、多项目隔离、备份冲突恢复、无效导入保护、剪映摘要和 360px 移动视口。

## 目录

- `src/pages/`：项目首页、新建/导入和拍摄页。
- `src/db/`：Dexie 数据库、种子项目和备份恢复。
- `src/domain/`：Zod schema、进度、生成指令和剪映文字装配。
- `src/components/shooting/`：复用的成田式拍摄组件。
- `examples/`：成田基准 HTML/JSON 与镰仓演示 JSON。
- `docs/`：实际资产审计和 AI 接入决策。

## 站内 AI 状态

当前未接通。OpenAI 官方网站接入仍是选定合作伙伴的有限试用；当前 Site 没有获批的 OAuth client，也没有完成真实线上模型调用。因此不显示假登录按钮，不使用 AWS 或浏览器令牌存储，也不自动使用开发者付费 API。详见 [`docs/AI_ACCESS_DECISION.md`](./docs/AI_ACCESS_DECISION.md)。

## 尚未承诺的候选能力

PWA 完全离线、外链图片离线、独立 HTML 导出和跨设备同步属于 V2 明确允许后置的候选项，目前未实现。现阶段请使用项目 JSON 备份与打印/PDF。
