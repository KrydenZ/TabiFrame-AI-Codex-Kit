import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, progressKey } from '../db/database';
import { fetchRemoteProject, patchRemoteProgress, putRemoteProgress } from '../db/remote';

export type SaveState = 'loading' | 'ready' | 'saving' | 'saved' | 'error';

interface UseShotProgressResult {
  completedShotIds: ReadonlySet<string>;
  saveState: SaveState;
  errorMessage: string | null;
  toggleShot: (shotId: string, completed: boolean) => Promise<void>;
  resetProgress: () => Promise<void>;
  replaceProgress: (shotIds: readonly string[]) => Promise<void>;
  refreshProgress: () => Promise<void>;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知存储错误';
}

export function useShotProgress(projectId: string): UseShotProgressResult {
  const [completedShotIds, setCompletedShotIds] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const writeLocalProgress = useCallback(async (shotIds: readonly string[]) => {
    const now = new Date().toISOString();
    await db.transaction('rw', db.shotProgress, async () => {
      await db.shotProgress.where('projectId').equals(projectId).delete();
      if (shotIds.length) {
        await db.shotProgress.bulkPut(shotIds.map((shotId) => ({
          key: progressKey(projectId, shotId), projectId, shotId, completedAt: now, updatedAt: now,
        })));
      }
    });
  }, [projectId]);

  const refreshProgress = useCallback(async () => {
    try {
      const remote = await fetchRemoteProject(projectId);
      await db.projects.put(remote.project);
      await writeLocalProgress(remote.completedShotIds);
      setCompletedShotIds(new Set(remote.completedShotIds));
      setErrorMessage(null);
      setSaveState('ready');
    } catch (error) {
      setErrorMessage('无法取得远程最新进度：' + toErrorMessage(error));
      setSaveState('error');
      throw error;
    }
  }, [projectId, writeLocalProgress]);

  useEffect(() => {
    let cancelled = false;

    async function loadProgress() {
      setSaveState('loading');
      try {
        const records = await db.shotProgress.where('projectId').equals(projectId).toArray();
        if (!cancelled) {
          setCompletedShotIds(new Set(records.map((record) => record.shotId)));
          setErrorMessage(null);
          setSaveState('ready');
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage('无法读取拍摄进度缓存：' + toErrorMessage(error));
          setSaveState('error');
        }
      }
    }

    void loadProgress();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') void refreshProgress().catch(() => undefined);
    }
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [refreshProgress]);

  const toggleShot = useCallback(
    async (shotId: string, completed: boolean) => {
      const previous = new Set(completedShotIds);
      const next = new Set(previous);
      if (completed) next.add(shotId);
      else next.delete(shotId);
      setCompletedShotIds(next);
      setSaveState('saving');

      try {
        const remoteShotIds = await patchRemoteProgress(projectId, shotId, completed);
        await writeLocalProgress(remoteShotIds);
        setCompletedShotIds(new Set(remoteShotIds));
      } catch (error) {
        setCompletedShotIds(previous);
        setErrorMessage('远程保存失败，刚才的勾选未写入：' + toErrorMessage(error));
        setSaveState('error');
        return;
      }

      setErrorMessage(null);
      setSaveState('saved');
    },
    [completedShotIds, projectId, writeLocalProgress],
  );

  const replaceProgress = useCallback(
    async (shotIds: readonly string[]) => {
      const previous = new Set(completedShotIds);
      const next = new Set(shotIds);
      setCompletedShotIds(next);
      setSaveState('saving');

      try {
        await putRemoteProgress(projectId, [...next]);
      } catch (error) {
        setCompletedShotIds(previous);
        setErrorMessage('远程进度更新失败，已恢复原状态：' + toErrorMessage(error));
        setSaveState('error');
        throw error;
      }

      try {
        await writeLocalProgress([...next]);
        setErrorMessage(null);
        setSaveState('saved');
      } catch (error) {
        setErrorMessage('远程已保存，但本机缓存更新失败；刷新页面可重新同步：' + toErrorMessage(error));
        setSaveState('error');
      }
    },
    [completedShotIds, projectId, writeLocalProgress],
  );

  const resetProgress = useCallback(async () => {
    await replaceProgress([]);
  }, [replaceProgress]);

  return useMemo(
    () => ({ completedShotIds, saveState, errorMessage, toggleShot, resetProgress, replaceProgress, refreshProgress }),
    [completedShotIds, errorMessage, refreshProgress, replaceProgress, resetProgress, saveState, toggleShot],
  );
}
