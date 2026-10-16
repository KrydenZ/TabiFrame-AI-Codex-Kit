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
  it('renders the complete Narita plan and updates shot 10 progress', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findAllByRole('checkbox')).toHaveLength(38);
    expect(screen.getAllByRole('figure')).toHaveLength(5);

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
    renderPage();
    const images = await screen.findAllByRole('img');
    expect(images).toHaveLength(5);
    images.forEach((image) => fireEvent.error(image));

    expect(screen.getAllByText('参考照片未加载')).toHaveLength(5);
    expect(screen.getAllByRole('link', { name: /查看原图与署名/ })).toHaveLength(5);
  });
});
