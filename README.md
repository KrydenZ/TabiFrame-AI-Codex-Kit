# TabiFrame AI

**Your AI Travel Vlog Assistant — Plan. Shoot. Edit.**

TabiFrame AI 是面向旅行 Vlog 创作者的手机优先拍摄助手。当前仓库只完成总计划中的 Phase 0 与 Phase 1：以成田篇为基准，把 38 组镜头、67 条素材和 5 张参考图做成可在现场勾选的 React 页面。

## 当前范围

- React + TypeScript + Vite + Tailwind CSS + React Router。
- Zod 校验结构化成田 fixture。
- Dexie / IndexedDB 独立保存 `{projectId, shotId}` 进度。
- 双进度：完成镜头组数与完成素材条数。
- 进度 JSON 导入、导出、清空确认与打印。
- 5 张 Wikimedia Commons 参考图、作者、许可和来源链接；图片失败时保留文字降级。
- 360–430px 手机 Chrome 优先，兼容桌面与键盘操作。

暂未开发多项目创建、Profile 编辑、AI 登录、AWS、云同步或任何付费 API。这些属于后续 Phase。

## 本地运行

需要 Node.js 20.19+ 或 22.12+，推荐使用 pnpm 10+。

```bash
pnpm install
pnpm dev
```

浏览器打开 `http://127.0.0.1:5173/`，应用会进入：

```text
/projects/narita-2026-10-10/shooting
```

也可以使用 npm：

```bash
npm install
npm run dev
```

## 构建与测试

```bash
pnpm build
pnpm test
pnpm test:e2e
```

对应 npm 命令为 `npm run build`、`npm test` 和 `npm run test:e2e`。Playwright 第一次运行可能需要安装 Chromium：`pnpm exec playwright install chromium`。

测试重点：

- fixture 为 5 个时段、38 组、67 条、5 张参考图；
- 勾选第 10 组后为 1/38 组、3/67 条；
- 全选后为 38/38 组、67/67 条；
- 刷新后 IndexedDB 进度仍在；
- 360px 视口不产生页面横向溢出。

## 数据与备份

拍摄模板来自 `examples/narita.project.json`，运行时先通过 Zod 校验。勾选状态不写回模板，而是保存到浏览器 IndexedDB 的 `shotProgress` 表。修改镜头文字或排序不会改变稳定 `shotId` 对应的进度。

浏览器数据仍可能因清除站点数据、无痕模式或设备故障而丢失。现场拍摄前后建议点击“导出进度 JSON”；“导入进度 JSON”会校验 schema、项目 ID 和镜头 ID 后再覆盖本机状态。

参考图片是外部 Wikimedia Commons URL，并未打包到仓库。断网时拍摄说明、秒数、提示、进度和署名仍可用，图片区域会显示联网提示。

## 静态部署

`pnpm build` 输出 `dist/`。可部署到任意支持单页应用回退的静态托管；深层路由需要回退到 `index.html`。发布前应先确认 Git commit 与构建产物来自同一版本。

## 资料与决策记录

- `TABIFRAME_AI_CODEX_MASTER_PLAN.md`：产品总计划与阶段验收。
- `CODEX_START.md` / `AGENTS.md`：Codex 工作约束。
- `docs/PHASE_0_RESEARCH.md`：原 HTML DOM、数据与交互核对。
- `examples/narita-shooting-plan.html`：独立可运行基准页面。
- `examples/narita.project.json`：成田项目单一数据基准。
- `prompts/`：后续阶段使用的固定 Prompt；Phase 0/1 尚未接入 UI。
