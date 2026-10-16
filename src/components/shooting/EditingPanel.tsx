import { Check, Clapperboard, Clipboard, Download, Printer, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { createProjectBackup } from '../../db/projects';
import { buildEditingDraft, EDITING_TEMPLATE_LABEL } from '../../domain/editing';
import type { VlogProject } from '../../domain/schemas/project';
import { copyText, downloadJson } from '../../lib/browser';

interface EditingPanelProps {
  project: VlogProject;
  completedShotIds: ReadonlySet<string>;
  onResetProgress: () => Promise<void>;
}

export function EditingPanel({ project, completedShotIds, onResetProgress }: EditingPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const draft = useMemo(() => buildEditingDraft(project, completedShotIds), [completedShotIds, project]);

  function exportProject() {
    const backup = createProjectBackup(project, [...completedShotIds]);
    downloadJson(`${project.projectId}-tabiframe-backup.json`, backup);
    setMessage('项目、拍摄进度和模板引用已导出。');
  }

  async function resetProgress() {
    if (!window.confirm(`确定清空当前项目全部 ${project.sections.flatMap((section) => section.shots).length} 组勾选状态？`)) return;
    setBusy(true);
    try {
      await onResetProgress();
      setMessage('当前项目的勾选已清空。');
    } catch {
      setMessage('清空失败，请先导出项目备份再重试。');
    } finally {
      setBusy(false);
    }
  }

  async function copyDraft() {
    try {
      await copyText(draft);
      setMessage('剪映规则草案与勾选摘要已复制。');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '复制失败，请手动选择文本。');
    }
  }

  return (
    <section className="editing-note">
      <div className="note-heading"><Clapperboard aria-hidden="true" /><div><span>剪映文字</span><h2>按勾选记录整理</h2></div></div>
      <table className="editing-timeline"><tbody>{project.editingTimeline.map(([time, title]) => <tr key={time}><th scope="row">{time}</th><td>{title}</td></tr>)}</tbody></table>
      <div className="template-status"><Check aria-hidden="true" /><div><strong>{EDITING_TEMPLATE_LABEL}</strong><span>历史最终 Prompt 尚未由用户确认；这里使用固定规则草案，不交给模型自由改写。</span></div></div>
      <textarea className="editing-output" readOnly value={draft} aria-label="剪映规则草案与勾选摘要" />
      <div className="action-buttons">
        <button className="action-button primary" type="button" onClick={() => void copyDraft()}><Clipboard aria-hidden="true" />复制剪映文字</button>
        <button className="action-button" type="button" onClick={() => window.print()}><Printer aria-hidden="true" />打印 / 保存 PDF</button>
        <button className="action-button" type="button" onClick={exportProject}><Download aria-hidden="true" />导出项目备份</button>
        <button className="action-button danger" type="button" disabled={busy} onClick={() => void resetProgress()}><RotateCcw aria-hidden="true" />清空勾选</button>
      </div>
      {message && <p className="action-message" role="status">{message}</p>}
      <p className="storage-warning">项目与勾选会保存到当前 Sites 登录账户；本机数据库只作离线缓存。导出备份不含账号令牌、视频文件或其他隐私凭据；导入时如 ID 冲突会自动创建独立恢复副本。</p>
    </section>
  );
}
