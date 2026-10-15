import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach } from 'vitest';
import { db } from '../src/db/database';
import { ensureSeedProjects } from '../src/db/projects';
import { ProjectListPage } from '../src/pages/ProjectListPage';

beforeEach(async () => {
  await db.shotProgress.clear();
  await db.projects.clear();
  await ensureSeedProjects();
});

afterEach(() => cleanup());

describe('ProjectListPage data recovery', () => {
  it('isolates an unreadable record and keeps valid projects usable', async () => {
    await db.table('projects').add({ projectId: 'broken-project', title: '损坏记录' });

    render(<MemoryRouter><ProjectListPage /></MemoryRouter>);

    expect(await screen.findByText('发现 1 条不可读取的旧项目记录')).toBeVisible();
    expect(screen.getAllByRole('link', { name: /打开/ })).toHaveLength(2);
    expect(screen.getByText(/清除本站数据并重新导入备份/)).toBeVisible();
  });
});
