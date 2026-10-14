import { Download, Printer, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { getAllShots } from '../../domain/progress';
import { progressExportSchema, type VlogProject } from '../../domain/schemas/project';

interface ProgressBackupControlsProps {
  project: VlogProject;
  completedShotIds: ReadonlySet<string>;
  onReplaceProgress: (shotIds: readonly string[]) => Promise<void>;
  onResetProgress: () => Promise<void>;
}

function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function ProgressBackupControls({
  project,
  completedShotIds,
  onReplaceProgress,
  onResetProgress,
}: ProgressBackupControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function exportProgress() {
    downloadJson('narita-shot-progress.json', {
      schemaVersion: 1,
      kind: 'tabiframe-shot-progress',
      projectId: project.projectId,
      exportedAt: new Date().toISOString(),
      completedShotIds: [...completedShotIds].sort(),
    });
    setMessage('进度 JSON 已导出。');
  }

  async function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1_000_000) {
      setMessage('导入失败：文件超过 1 MB。');
      return;
    }

    setBusy(true);
    try {
      const parsed = progressExportSchema.parse(JSON.parse(await file.text()));
      if (parsed.projectId !== project.projectId) {
        throw new Error('这个备份属于其他项目。');
      }
      const validShotIds = new Set(getAllShots(project).map((shot) => shot.id));
      const unknownIds = parsed.completedShotIds.filter((id) => !validShotIds.has(id));
      if (unknownIds.length > 0) {
        throw new Error('包含未知镜头 ID：' + unknownIds.join(', '));
      }
      if (!window.confirm('导入会覆盖当前成田拍摄进度，是否继续？')) return;
      await onReplaceProgress(parsed.completedShotIds);
      setMessage('进度已从 JSON 恢复。');
    } catch (error) {
      setMessage('导入失败：' + (error instanceof Error ? error.message : 'JSON 格式不正确'));
    } finally {
      setBusy(false);
    }
  }

  async function resetProgress() {
    if (!window.confirm('确定清空全部38组勾选状态？此操作会覆盖本机进度。')) return;
    setBusy(true);
    try {
      await onResetProgress();
      setMessage('全部勾选已清空。');
    } catch {
      setMessage('清空失败，请先导出备份并重试。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="action-buttons">
        <button className="action-button primary" type="button" onClick={() => window.print()}>
          <Printer aria-hidden="true" />打印 / 保存为 PDF
        </button>
        <button className="action-button" type="button" onClick={exportProgress}>
          <Download aria-hidden="true" />导出进度 JSON
        </button>
        <button className="action-button" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Upload aria-hidden="true" />导入进度 JSON
        </button>
        <button className="action-button danger" type="button" disabled={busy} onClick={() => void resetProgress()}>
          <RotateCcw aria-hidden="true" />清空勾选
        </button>
      </div>
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="application/json,.json"
        onChange={(event) => void importProgress(event)}
      />
      {message && <p className="action-message" role="status">{message}</p>}
    </>
  );
}
