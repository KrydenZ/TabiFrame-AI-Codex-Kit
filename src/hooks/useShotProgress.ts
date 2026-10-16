import { useCallback, useEffect, useMemo, useState } from 'react';
import { db, progressKey, type ShotProgressRecord } from '../db/database';
import { putRemoteProgress } from '../db/remote';

export type SaveState = 'loading' | 'ready' | 'saving' | 'saved' | 'error';

interface UseShotProgressResult {
  completedShotIds: ReadonlySet<string>;
  saveState: SaveState;
  errorMessage: string | null;
  toggleShot: (shotId: string, completed: boolean) => Promise<void>;
  resetProgress: () => Promise<void>;
  replaceProgress: (shotIds: readonly string[]) => Promise<void>;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '未知存储错误';
}

export function useShotProgress(projectId: string): UseShotProgressResult {
  const [completedShotIds, setCompletedShotIds] = useState<Set<string>>(new Set());
  const [saveState, setSaveState] = useState<SaveState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const toggleShot = useCallback(
    async (shotId: string, completed: boolean) => {
      const previous = new Set(completedShotIds);
      const next = new Set(previous);
      if (completed) next.add(shotId);
      else next.delete(shotId);
      setCompletedShotIds(next);
      setSaveState('saving');

      try {
        await putRemoteProgress(projectId, [...next]);
      } catch (error) {
        setCompletedShotIds(previous);
        setErrorMessage('远程保存失败，刚才的勾选未写入：' + toErrorMessage(error));
        setSaveState('error');
        return;
      }

      try {
        if (completed) {
          const now = new Date().toISOString();
          const record: ShotProgressRecord = {
            key: progressKey(projectId, shotId),
            projectId,
            shotId,
            completedAt: now,
            updatedAt: now,
          };
          await db.shotProgress.put(record);
        } else {
          await db.shotProgress.delete(progressKey(projectId, shotId));
        }
        setErrorMessage(null);
        setSaveState('saved');
      } catch (error) {
        setErrorMessage('远程已保存，但本机缓存更新失败；刷新页面可重新同步：' + toErrorMessage(error));
        setSaveState('error');
      }
    },
    [completedShotIds, projectId],
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
        await db.transaction('rw', db.shotProgress, async () => {
          await db.shotProgress.where('projectId').equals(projectId).delete();
          const now = new Date().toISOString();
          await db.shotProgress.bulkPut(
            [...next].map((shotId) => ({
              key: progressKey(projectId, shotId),
              projectId,
              shotId,
              completedAt: now,
              updatedAt: now,
            })),
          );
        });
        setErrorMessage(null);
        setSaveState('saved');
      } catch (error) {
        setErrorMessage('远程已保存，但本机缓存更新失败；刷新页面可重新同步：' + toErrorMessage(error));
        setSaveState('error');
      }
    },
    [completedShotIds, projectId],
  );

  const resetProgress = useCallback(async () => {
    await replaceProgress([]);
  }, [replaceProgress]);

  return useMemo(
    () => ({ completedShotIds, saveState, errorMessage, toggleShot, resetProgress, replaceProgress }),
    [completedShotIds, errorMessage, replaceProgress, resetProgress, saveState, toggleShot],
  );
}
