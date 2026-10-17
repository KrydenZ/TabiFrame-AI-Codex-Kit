# V2 资产审计

核对日期：2026-10-17。

## 已存在并继续使用

- `examples/narita-shooting-plan.html`：由历史成田内容重建的独立 HTML 参考，不宣称是历史文件的逐字节原件。
- `examples/narita.project.json`：当前成田篇结构化数据。
- 成田数据实际包含 5 个时段、38 组镜头、67 条计划素材与 5 张 Wikimedia Commons 参考图。
- 第 10 组“★ 仲町下坡”包含 3 条计划素材；单独勾选应显示 1/38 组、3/67 条。
- 5 张图片继续保留 caption、远程 URL、来源 URL、作者和许可证文字；现按 5 个步骤各放置 1 张。图片没有复制进仓库。

## V2 新增

- `examples/minatomirai-line-2026-10-17.project.json`：面向 2026-10-17 的港未来线沿线计划，用于验证不同目的地、多项目隔离和通用渲染；5 个步骤各补充 1 张带来源、作者和许可证的 Wikimedia Commons 参考图；天气、运行和现场限制明确留作出发前核对。
- 两份内置计划包含经 OpenStreetMap Nominatim 核对的主要地点坐标。页面只在用户查看地图时请求当前视口所需的标准瓦片，持续显示“© OpenStreetMap contributors”署名；路线仅为策划示意，不提供导航保证。
- `TABIFRAME_AI_PHASE_PLAN_PROTOTYPE_V2.md`：唯一最终开发基准。

## 已清理或降级

- 旧 M1 Master Plan、启动说明、默认高级 Profile 和旧三阶段 Prompt 文件已删除，避免与 V2 的一次性交付和单一固定风格冲突。
- 用户于 2026-10-17 提供并确认《一个人在日本散步》系列剪映 AI 通用提示词。固定正文保存在代码资源中，状态为 `confirmed-original`；App 只追加本期项目和手动勾选摘要。
- `references/` 占位说明已删除；如果以后取得历史原件，应新增明确来源记录，而不是覆盖现有重建说明。
