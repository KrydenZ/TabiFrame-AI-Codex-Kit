import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const minatomiraiLinePlan = JSON.parse(
  readFileSync(new URL('../../examples/minatomirai-line-2026-10-17.project.json', import.meta.url), 'utf8'),
);
const naritaReference = JSON.parse(
  readFileSync(new URL('../../examples/narita.project.json', import.meta.url), 'utf8'),
);

test.beforeEach(async ({ page }) => {
  await page.route('https://commons.wikimedia.org/**', (route) => route.abort());
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
  await page.goto('/signin-with-chatgpt?return_to=/');
  await expect(page.getByRole('heading', { name: '旅行 Vlog 策划账本' })).toBeVisible();
  await page.evaluate(async (canonicalProjects) => {
    const response = await fetch('/api/projects');
    const snapshot = await response.json() as { projects: Array<{ projectId: string }> };
    for (const project of snapshot.projects) {
      if (!['narita-2026-10-10', 'minatomirai-line-2026-10-17'].includes(project.projectId)) {
        await fetch(`/api/projects/${encodeURIComponent(project.projectId)}`, {
          method: 'DELETE', headers: { 'content-type': 'application/json' }, body: '{}',
        });
      }
    }
    for (const project of canonicalProjects) {
      await fetch(`/api/projects/${encodeURIComponent(project.projectId)}`, {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ project, completedShotIds: [] }),
      });
    }
  }, [naritaReference, minatomiraiLinePlan]);
  await page.evaluate(() => localStorage.setItem('tabiframe-remote-migration-v1', 'done'));
  await page.reload();
});

test('project search, edit and delete operate on remote projects', async ({ page }, testInfo) => {
  await page.getByPlaceholder('查询项目、地点、标签、步骤或镜头').fill('成田山');
  await expect(page.locator('.project-card')).toHaveCount(1);
  await page.getByRole('link', { name: '修改' }).click();
  await page.getByLabel('项目名称 *').fill('成田远程验收项目');
  await page.getByLabel('旅行状态').selectOption('visited');
  await page.getByLabel('标签').fill('千叶、寺庙散步');
  await page.getByLabel('旅行回顾').fill('最喜欢公园水边这一段，剪辑时多留环境声。');
  await page.getByRole('button', { name: '下移机场 → 京成成田站' }).click();
  await expect(page.locator('.route-step-editor').first()).toContainText('成田山表参道');
  if (testInfo.project.name === 'mobile-chrome-360') {
    await page.screenshot({ path: testInfo.outputPath('v2-mobile-route-editor.png'), fullPage: true });
  }
  await page.getByRole('button', { name: '保存全部修改' }).click();
  await expect(page.getByRole('status')).toContainText('旅行记录和路线编排已保存到远程账户');
  await page.getByRole('link', { name: '所有项目' }).click();
  await expect(page.getByRole('heading', { name: '旅行记录' })).toBeVisible();
  await expect(page.locator('.project-card h3', { hasText: '成田远程验收项目' })).toBeVisible();
  await expect(page.getByText('已走过').first()).toBeVisible();
  await page.reload();
  await expect(page.locator('.project-card h3', { hasText: '成田远程验收项目' })).toBeVisible();

  await page.getByPlaceholder('查询项目、地点、标签、步骤或镜头').fill('寺庙散步');
  await expect(page.locator('.project-card')).toHaveCount(1);

  await page.getByRole('link', { name: '修改' }).first().click();
  await page.getByLabel('项目名称 *').fill('一个人在日本散步 / 成田篇');
  await page.getByRole('button', { name: '保存全部修改' }).click();
  await expect(page.getByRole('status')).toContainText('旅行记录和路线编排已保存到远程账户');
  await page.getByRole('link', { name: '所有项目' }).click();

  await page.evaluate(async (project) => {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ project, completedShotIds: [] }),
    });
  }, { ...minatomiraiLinePlan, projectId: 'crud-delete-e2e', title: '删除验收临时项目', sourceKind: 'imported' });
  await page.reload();
  const temporaryCard = page.locator('.project-card').filter({ hasText: '删除验收临时项目' });
  await expect(temporaryCard).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await temporaryCard.getByRole('button', { name: '删除' }).click();
  await expect(temporaryCard).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('删除验收临时项目')).toHaveCount(0);
});

test('multi-project shooting progress persists without mobile overflow', async ({ page }, testInfo) => {
  await expect(page.getByRole('heading', { name: '旅行 Vlog 策划账本' })).toBeVisible();
  await expect(page.locator('.project-card')).toHaveCount(2);
  if (testInfo.project.name === 'mobile-chrome-360') {
    await page.screenshot({ path: testInfo.outputPath('v2-mobile-project-list.png'), fullPage: true });
  }

  await page.getByRole('link', { name: '打开一个人在日本散步 / 成田篇' }).click();
  await expect(page.getByRole('heading', { name: '一个人在日本散步 / 成田篇' })).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(38);
  await expect(page.locator('figure.reference-card')).toHaveCount(5);
  await expect(page.locator('.shooting-section')).toHaveCount(5);
  await expect(page.locator('.shooting-section figure.reference-card')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: '成田机场 → 成田山散步路线' })).toBeVisible();
  await expect(page.locator('.route-map-stops li')).toHaveCount(5);
  await expect(page.locator('.route-map-marker-button')).toHaveCount(5);
  const firstMapMarker = await page.locator('.route-map-marker-button').first().boundingBox();
  expect(firstMapMarker?.width).toBeLessThanOrEqual(18);
  expect(firstMapMarker?.height).toBeLessThanOrEqual(18);

  await page.getByPlaceholder('查询镜头名称、拍法或步骤').fill('三重塔');
  await expect(page.getByRole('checkbox')).toHaveCount(2);
  await page.getByPlaceholder('查询镜头名称、拍法或步骤').clear();

  await page.getByRole('checkbox', { name: '10 ★ 仲町下坡' }).check();
  await expect(page.getByTestId('progress-count')).toContainText('1 / 38组完成 · 3 / 67条');
  await expect(page.getByText('已保存到远程账户')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('checkbox', { name: '10 ★ 仲町下坡' })).toBeChecked();

  await page.getByRole('link', { name: '所有项目' }).click();
  await page.getByRole('link', { name: '打开明天沿着港未来线溜达' }).click();
  await expect(page.getByTestId('progress-count')).toContainText('0 / 22组完成 · 0 / 36条');

  await page.getByRole('link', { name: '所有项目' }).click();
  await page.getByRole('link', { name: '打开一个人在日本散步 / 成田篇' }).click();
  await expect(page.getByRole('checkbox', { name: '10 ★ 仲町下坡' })).toBeChecked();

  const dimensions = await page.evaluate(() => ({ viewportWidth: window.innerWidth, pageWidth: document.documentElement.scrollWidth }));
  expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewportWidth);

  if (testInfo.project.name === 'mobile-chrome-360') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath('v2-mobile-project.png'), fullPage: true });
  }
});

test('new project flow exposes honest external generation and JSON import', async ({ page }, testInfo) => {
  await page.getByRole('link', { name: '新建旅行计划' }).click();
  await expect(page.getByText('Schema JSON 怎么生成？')).toBeVisible();
  await expect(page.getByLabel('目标成片分钟 *')).toHaveValue('8');
  await expect(page.getByLabel('不要出现什么')).toHaveValue('美食、购物、陌生人特写、需要预约的室内场所');
  await page.getByLabel('目的地 *').fill('箱根');
  await page.getByLabel('日期或季节 *').fill('深秋');
  await page.getByRole('button', { name: '生成完整计划提示词' }).click();
  await expect(page.getByLabel('结构化计划生成指令')).toContainText('箱根');
  await expect(page.getByLabel('结构化计划生成指令')).toContainText('不要自动加入美食');
  if (testInfo.project.name === 'mobile-chrome-360') {
    await page.screenshot({ path: testInfo.outputPath('v2-mobile-schema-flow.png'), fullPage: true });
  }
  await page.getByLabel('计划 JSON').fill('{"invalid":true}');
  await page.getByRole('button', { name: '校验并保存项目' }).click();
  await expect(page.getByRole('status')).toContainText('无法导入');
  await page.getByRole('link', { name: '返回项目列表' }).click();
  await expect(page.locator('.project-card')).toHaveCount(2);
});

test('past trips can be created and organized without AI or JSON', async ({ page }) => {
  await page.getByRole('link', { name: '新建旅行计划' }).click();
  await page.getByLabel('目的地 *').fill('北海道');
  await page.getByLabel('日期或季节 *').fill('2025-02-12');
  await page.getByRole('button', { name: '快速创建空白旅行记录' }).click();

  await expect(page.getByRole('heading', { name: '修改与编排' })).toBeVisible();
  await page.getByLabel('旅行状态').selectOption('visited');
  await page.getByLabel('标签').fill('北海道、冬天、电车');
  await page.getByLabel('旅行回顾').fill('已经拍完，接下来按实际行程整理剪辑。');
  await page.getByRole('button', { name: '新增路线步骤' }).click();
  await expect(page.locator('.route-step-editor')).toHaveCount(2);
  await page.locator('.route-step-editor').nth(1).getByLabel('步骤名称').fill('第二段雪景散步');
  await page.getByRole('button', { name: '保存全部修改' }).click();

  await expect(page.getByRole('heading', { name: '北海道旅行记录' })).toBeVisible();
  await expect(page.locator('.journey-memory p')).toHaveText('已经拍完，接下来按实际行程整理剪辑。');
  await expect(page.locator('.route-index-scroll a')).toHaveCount(2);
});

test('valid plan import, editing summary, export and collision-safe restore form one complete flow', async ({ page }, testInfo) => {
  const importedPlan = {
    ...minatomiraiLinePlan,
    projectId: 'minatomirai-e2e-import',
    title: '港未来线导入验收篇',
    sourceKind: 'imported',
  };

  await page.getByRole('link', { name: '新建旅行计划' }).click();
  await page.getByLabel('计划 JSON').fill(JSON.stringify(importedPlan));
  await page.getByRole('button', { name: '校验并保存项目' }).click();

  await expect(page.getByRole('status')).toContainText('计划校验通过并已保存');
  await expect(page.getByRole('heading', { name: importedPlan.title })).toBeVisible();
  await page.getByRole('checkbox', { name: 'mm-02 第一段脚步' }).check();
  await page.getByRole('checkbox', { name: 'mm-17 山下公园与港口' }).check();
  await expect(page.getByTestId('progress-count')).toContainText('2 / 22组完成 · 4 / 36条');

  const editingText = page.getByLabel('剪映系列提示词与本期信息');
  await expect(editingText).toContainText('第一段脚步');
  await expect(editingText).toContainText('山下公园与港口');
  await page.getByRole('checkbox', { name: 'mm-17 山下公园与港口' }).uncheck();
  await expect(editingText).not.toContainText('山下公园与港口：');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出项目备份' }).click();
  const download = await downloadPromise;
  const backupPath = testInfo.outputPath('tabiframe-project-backup.json');
  await download.saveAs(backupPath);

  await page.getByRole('link', { name: '所有项目' }).click();
  await page.locator('input[type="file"]').setInputFiles(backupPath);

  await expect(page.getByRole('status')).toContainText('项目 ID 已存在，已作为独立恢复副本导入');
  await expect(page.getByRole('heading', { name: `${importedPlan.title}（恢复副本）` })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'mm-02 第一段脚步' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'mm-17 山下公园与港口' })).not.toBeChecked();
});
