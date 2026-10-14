# Phase 0 成田基准核对

核对日期：2026-10-14。基准文件为 `examples/narita-shooting-plan.html` 与 `examples/narita.project.json`。

## 原页面模块

1. 深绿色 Hero：系列/地点、本期标题、日期、相机、风格与 4 个摘要胶囊。
2. Sticky Progress：完成组数、对应素材条数、进度条和浏览器保存提示。
3. Shooting Basics：固定、慢走、建筑特写、环境声 4 项现场时间规则。
4. Section：时段、地点标题、用途说明、横向参考图、Shot List、场景安全提示。
5. Shot Row：checkbox、稳定编号、标题、完整拍法、素材条数、录制秒数、必拍标记。
6. Editing Timeline：5 段 7:30 剪辑顺序。
7. Actions：打印、进度 JSON 导入/导出、清空确认。
8. Credits：参考图片的作者、许可和 Wikimedia Commons 来源。

## 数据核对

| 时段 | 编号 | 组数 | 素材条数 | 参考图 |
|---|---|---:|---:|---:|
| 10:00–10:45 机场 → 京成成田站 | 01–06 | 6 | 6 | 0 |
| 10:45–11:45 成田山表参道 | 07–15 | 9 | 22 | 2 |
| 11:45–12:30 成田山新胜寺 | 16–24 | 9 | 16 | 2 |
| 12:30–13:20 成田山公园 | 25–32 | 8 | 15 | 1 |
| 13:20–14:30 午饭 → 回程 | 33–38 | 6 | 8 | 0 |
| 合计 | 01–38 | 38 | 67 | 5 |

第 10 组“★ 仲町下坡”的 `clipCount` 为 3，因此单独勾选时必须显示 1/38 组与 3/67 条。

## 参考图来源

5 张图片都来自 Wikimedia Commons，保持 fixture 中的 `caption`、`url`、`sourceUrl`、`author` 与 `license`。图片本身没有复制进仓库。加载失败时必须显示文字占位和来源入口。

## React 实现决策

- 结构化 fixture 是拍摄模板真源；组件中不复制 38 组文字。
- Zod 在模块加载时校验 fixture，并检查 section/shot ID 唯一性与 HTTPS 图片 URL。
- IndexedDB 的 `shotProgress` 表只存进度，键为 `projectId:shotId`；不使用标题作为键。
- 列表行整体可点击，checkbox 具备可见键盘焦点；移动端触控高度至少 44px。
- 360px 时素材秒数标签换到说明下方，参考图保持横向滑动，页面主体禁止横向溢出。
- 图片是联网增强项；所有拍摄文字、进度和署名不依赖图片加载。
- Phase 1 增加经过校验的进度备份导入，作为 IndexedDB 被清除时的人工恢复路径。
