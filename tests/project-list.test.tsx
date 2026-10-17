import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach } from 'vitest';
import { db } from '../src/db/database';
import { ensureSeedProjects } from '../src/db/projects';
import { minatomiraiLineProject, naritaProject } from '../src/fixtures/projects';
import { projectCoverLabel, selectProjectCover } from '../src/domain/projectCover';
import { ProjectListPage } from '../src/pages/ProjectListPage';

beforeEach(async () => {
  await db.shotProgress.clear();
  await db.projects.clear();
  await ensureSeedProjects();
});

afterEach(() => cleanup());

describe('ProjectListPage data recovery', () => {
  it('uses a recognizable landmark instead of the first transport reference as the cover', () => {
    expect(projectCoverLabel(selectProjectCover(naritaProject)!)).toBe('新胜寺总门');
    expect(projectCoverLabel(selectProjectCover(minatomiraiLineProject)!)).toBe('港未来临海天际线');
  });

  it('isolates an unreadable record and keeps valid projects usable', async () => {
    await db.table('projects').add({ projectId: 'broken-project', title: '损坏记录' });

    render(<MemoryRouter><ProjectListPage /></MemoryRouter>);

    expect(await screen.findByText('发现 1 条不可读取的旧项目记录')).toBeVisible();
    expect(screen.getAllByRole('link', { name: /打开/ })).toHaveLength(2);
    expect(screen.getByText(/清除本站数据并重新导入备份/)).toBeVisible();
  });

  it('clears a project search without changing stored records', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ProjectListPage /></MemoryRouter>);

    const search = await screen.findByRole('searchbox', { name: '查询旅行项目' });
    await user.type(search, '完全不存在的地点');
    expect(screen.getByText('没有匹配的项目')).toBeVisible();

    await user.click(screen.getByRole('button', { name: '清空查询' }));
    expect(search).toHaveValue('');
    expect(screen.getAllByRole('link', { name: /打开/ })).toHaveLength(2);
    expect(await db.projects.count()).toBe(2);
  });
});
