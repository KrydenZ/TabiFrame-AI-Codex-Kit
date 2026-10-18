import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach } from 'vitest';
import { db } from '../src/db/database';
import { ensureSeedProjects } from '../src/db/projects';
import { ShootingPage } from '../src/pages/ShootingPage';

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/projects/narita-2026-10-10/shooting']}>
      <Routes>
        <Route path="/projects/:projectId/shooting" element={<ShootingPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await db.shotProgress.clear();
  await db.projects.clear();
  await ensureSeedProjects();
});

afterEach(() => {
  cleanup();
});

describe('ShootingPage progress', () => {
  it('presents a visited project as a record without pre-trip reminders', async () => {
    await db.projects.update('narita-2026-10-10', { travelState: 'visited' });
    renderPage();

    expect(await screen.findByText('手动整理进度')).toBeVisible();
    expect(screen.getByRole('link', { name: '整理记录' })).toBeVisible();
    expect(screen.getByRole('navigation', { name: '旅行步骤导航' })).toBeVisible();
    expect(screen.getByText(/不代表实际轨迹或定位记录/)).toBeVisible();
    expect(screen.queryByText('出发前需要自行核实')).not.toBeInTheDocument();
  });

  it('renders the complete Narita plan and updates shot 10 progress', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findAllByRole('checkbox')).toHaveLength(38);
    expect(screen.getAllByRole('figure')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: '成田机场 → 成田山散步路线' })).toBeVisible();
    expect(screen.getByRole('img', { name: /共 5 个主要地点/ })).toBeVisible();

    const shot10 = await screen.findByRole('checkbox', { name: '10 ★ 仲町下坡' });
    await waitFor(() => expect(shot10).toBeEnabled());
    await user.click(shot10);

    expect(screen.getByTestId('progress-count')).toHaveTextContent('1 / 38组完成 · 3 / 67条');
    await screen.findByText('已保存到远程账户');
  });

  it('restores the saved checkbox after remounting', async () => {
    const user = userEvent.setup();
    const first = renderPage();
    const shot10 = await screen.findByRole('checkbox', { name: '10 ★ 仲町下坡' });
    await waitFor(() => expect(shot10).toBeEnabled());
    await user.click(shot10);
    await screen.findByText('已保存到远程账户');
    first.unmount();

    renderPage();
    const restored = await screen.findByRole('checkbox', { name: '10 ★ 仲町下坡' });
    await waitFor(() => expect(restored).toBeChecked());
    expect(screen.getByTestId('progress-count')).toHaveTextContent('1 / 38组完成 · 3 / 67条');
  });

  it('does not reset when the user cancels the confirmation', async () => {
    const user = userEvent.setup();
    renderPage();
    const shot10 = await screen.findByRole('checkbox', { name: '10 ★ 仲町下坡' });
    await waitFor(() => expect(shot10).toBeEnabled());
    await user.click(shot10);
    await screen.findByText('已保存到远程账户');

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    await user.click(screen.getByRole('button', { name: '清空勾选' }));

    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(shot10).toBeChecked();
    confirmSpy.mockRestore();
  });

  it('clears persisted progress after confirmation', async () => {
    const user = userEvent.setup();
    renderPage();
    const shot10 = await screen.findByRole('checkbox', { name: '10 ★ 仲町下坡' });
    await waitFor(() => expect(shot10).toBeEnabled());
    await user.click(shot10);
    await screen.findByText('已保存到远程账户');

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: '清空勾选' }));

    await waitFor(() => expect(shot10).not.toBeChecked());
    expect(screen.getByTestId('progress-count')).toHaveTextContent('0 / 38组完成 · 0 / 67条');
    expect(await db.shotProgress.count()).toBe(0);
    confirmSpy.mockRestore();
  });

  it('keeps source attribution when all remote images fail', async () => {
    const { container } = renderPage();
    await screen.findAllByRole('figure');
    const images = [...container.querySelectorAll<HTMLImageElement>('.reference-card img')];
    expect(images).toHaveLength(5);
    images.forEach((image) => fireEvent.error(image));

    expect(screen.getAllByText('参考照片未加载')).toHaveLength(5);
    expect(screen.getAllByRole('link', { name: /查看原图与署名/ })).toHaveLength(5);
  });

  it('clears shot search and filter together', async () => {
    const user = userEvent.setup();
    renderPage();

    const search = await screen.findByRole('searchbox', { name: '查询镜头' });
    await user.type(search, '不存在的镜头');
    expect(screen.getByText('没有匹配的镜头')).toBeVisible();

    await user.click(screen.getByRole('button', { name: '显示全部镜头' }));
    expect(search).toHaveValue('');
    expect(screen.getAllByRole('checkbox')).toHaveLength(38);
    expect(screen.getByRole('button', { name: '全部' })).toHaveAttribute('aria-pressed', 'true');
  });
});
