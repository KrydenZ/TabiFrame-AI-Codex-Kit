import { AlertTriangle, CheckCircle2, Database, LoaderCircle } from 'lucide-react';
import type { ShootingTotals } from '../../domain/progress';
import type { SaveState } from '../../hooks/useShotProgress';

interface StickyProgressProps {
  totals: ShootingTotals;
  saveState: SaveState;
  errorMessage: string | null;
}

const saveMessages: Record<SaveState, string> = {
  loading: '正在读取远程进度…',
  ready: '勾选会立即保存到你的远程账户',
  saving: '正在远程保存…',
  saved: '已保存到远程账户',
  error: '远程保存不可用，请检查网络后重试',
};

export function StickyProgress({ totals, saveState, errorMessage }: StickyProgressProps) {
  const SaveIcon = saveState === 'error'
    ? AlertTriangle
    : saveState === 'saving' || saveState === 'loading'
      ? LoaderCircle
      : saveState === 'saved'
        ? CheckCircle2
        : Database;

  return (
    <section className="sticky-progress" aria-label="拍摄计划进度">
      <div className="progress-heading" aria-live="polite">
        <span>拍摄计划进度</span>
        <strong data-testid="progress-count">
          {totals.completedGroups} / {totals.totalGroups}组完成 · {totals.completedClips} / {totals.totalClips}条
        </strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="拍摄完成率"
        aria-valuemin={0}
        aria-valuemax={totals.totalGroups}
        aria-valuenow={totals.completedGroups}
      >
        <span className="progress-fill" style={{ width: totals.percentage + '%' }} />
      </div>
      <div className={'save-notice ' + (saveState === 'error' ? 'is-error' : '')}>
        <SaveIcon className={saveState === 'saving' || saveState === 'loading' ? 'is-spinning' : ''} aria-hidden="true" />
        <span>{errorMessage ?? saveMessages[saveState]}</span>
      </div>
    </section>
  );
}
