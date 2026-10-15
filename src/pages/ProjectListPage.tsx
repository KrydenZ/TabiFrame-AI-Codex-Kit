import { useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Database, FolderOpen, Plus, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { formatValidationError, importProjectBackup } from '../db/projects';
import { calculateProgress } from '../domain/progress';
import { vlogProjectSchema } from '../domain/schemas/project';

const sourceLabels = {
  reference: '成田基准',
  demo: '演示计划',
  imported: '导入计划',
  generated: '站内生成',
} as const;

export function ProjectListPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const projectState = useLiveQuery(async () => {
    const allRows = await db.projects.toArray();
    const rows = allRows.flatMap((row) => {
      const parsed = vlogProjectSchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    });
    const progress = await db.shotProgress.toArray();
    const projects = rows
      .map((project) => {
        const ids = new Set(progress.filter((item) => item.projectId === project.projectId).map((item) => item.shotId));
        return { project, totals: calculateProgress(project, ids) };
      })
      .sort((a, b) => (b.project.updatedAt ?? '').localeCompare(a.project.updatedAt ?? ''));
    return { projects, unreadableCount: allRows.length - rows.length };
  }, []);
  const projects = projectState?.projects ?? [];

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2_000_000) return setMessage('导入失败：备份文件不能超过 2 MB。');
    try {
      const result = await importProjectBackup(JSON.parse(await file.text()));
      const importMessage = result.collisionRemapped ? '项目 ID 已存在，已作为独立恢复副本导入。' : '项目备份已恢复。';
      setMessage(importMessage);
      navigate(`/projects/${result.project.projectId}/shooting`, { state: { importMessage } });
    } catch (error) {
      setMessage('导入失败：' + formatValidationError(error));
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <span className="brand-kicker">TABIFRAME AI · 个人版 1.0</span>
          <h1>旅行 Vlog 策划账本</h1>
          <p>规划路线、现场勾选计划组，再整理成可复制给剪映的文字。App 不拍摄、上传或识别视频。</p>
        </div>
        <Link className="primary-link" to="/projects/new"><Plus aria-hidden="true" />新建旅行计划</Link>
      </header>

      <section className="storage-banner">
        <Database aria-hidden="true" />
        <div><strong>数据保存在当前浏览器</strong><span>清除站点数据可能丢失；请定期导出项目 JSON。当前不提供跨设备同步。</span></div>
      </section>

      <div className="page-toolbar">
        <div><span className="eyebrow">MY PROJECTS</span><h2>旅行项目</h2></div>
        <button className="action-button" type="button" onClick={() => inputRef.current?.click()}><Upload aria-hidden="true" />导入项目备份</button>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importBackup(event)} />
      </div>
      {message && <p className="inline-message" role="status">{message}</p>}
      {!!projectState?.unreadableCount && (
        <div className="data-warning" role="alert">
          <strong>发现 {projectState.unreadableCount} 条不可读取的旧项目记录</strong>
          <span>它们已被安全隔离，不会导致页面白屏。请先逐个导出仍可打开的项目，再从浏览器站点设置清除本站数据并重新导入备份。</span>
        </div>
      )}

      <section className="project-grid" aria-label="旅行项目列表">
        {projects.length === 0 && <div className="empty-state"><h3>还没有可读取的项目</h3><p>可以新建计划，或从 JSON 备份恢复。损坏的数据不会被渲染或执行。</p></div>}
        {projects.map(({ project, totals }) => (
          <article className="project-card" key={project.projectId}>
            <div className="project-card-top">
              <span className={`source-chip source-${project.sourceKind}`}>{sourceLabels[project.sourceKind]}</span>
              <span>{project.shootDate || project.season || '日期待定'}</span>
            </div>
            <div>
              <h3>{project.title}</h3>
              <p>{project.destination}</p>
            </div>
            <div className="project-progress" aria-label={`${totals.completedGroups}组已完成`}>
              <span style={{ width: `${totals.percentage}%` }} />
            </div>
            <div className="project-card-footer">
              <span>{totals.completedGroups}/{totals.totalGroups} 组 · {totals.completedClips}/{totals.totalClips} 条计划素材</span>
              <Link to={`/projects/${project.projectId}/shooting`} aria-label={`打开${project.title}`}><FolderOpen aria-hidden="true" />打开<ArrowRight aria-hidden="true" /></Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
