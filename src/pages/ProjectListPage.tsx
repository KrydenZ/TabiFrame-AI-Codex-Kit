import { useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, Cloud, FolderOpen, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { deleteProject, formatValidationError, importProjectBackup } from '../db/projects';
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
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
  const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN');
  const visibleProjects = normalizedQuery
    ? projects.filter(({ project }) => [project.title, project.destination, project.shootDate, project.season]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase('zh-CN').includes(normalizedQuery)))
    : projects;

  async function removeProject(projectId: string, title: string) {
    if (!window.confirm(`确定删除“${title}”？项目、镜头进度和远程数据都会删除。建议先导出备份。`)) return;
    setDeletingId(projectId);
    setMessage(null);
    try {
      await deleteProject(projectId);
      setMessage(`已删除“${title}”。`);
    } catch (error) {
      setMessage('删除失败：' + formatValidationError(error));
    } finally {
      setDeletingId(null);
    }
  }

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
          <span className="brand-kicker">TABIFRAME AI · 个人版 1.1</span>
          <h1>旅行 Vlog 策划账本</h1>
          <p>规划路线、现场勾选计划组，再整理成可复制给剪映的文字。App 不拍摄、上传或识别视频。</p>
        </div>
        <Link className="primary-link" to="/projects/new"><Plus aria-hidden="true" />新建旅行计划</Link>
      </header>

      <section className="storage-banner">
        <Cloud aria-hidden="true" />
        <div><strong>已启用账户远程保存</strong><span>项目与拍摄进度绑定当前 Sites 登录账户，可在其他设备登录后继续；本机数据库仅作缓存。</span></div>
      </section>

      <div className="page-toolbar">
        <div><span className="eyebrow">MY PROJECTS</span><h2>旅行项目</h2></div>
        <div className="toolbar-actions"><button className="action-button" type="button" onClick={() => inputRef.current?.click()}><Upload aria-hidden="true" />导入备份</button></div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importBackup(event)} />
      </div>
      <label className="project-search">
        <Search aria-hidden="true" />
        <span className="visually-hidden">查询旅行项目</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="按项目名、目的地、日期查询" />
      </label>
      {message && <p className="inline-message" role="status">{message}</p>}
      {!!projectState?.unreadableCount && (
        <div className="data-warning" role="alert">
          <strong>发现 {projectState.unreadableCount} 条不可读取的旧项目记录</strong>
          <span>它们已被安全隔离，不会导致页面白屏。请先逐个导出仍可打开的项目，再从浏览器站点设置清除本站数据并重新导入备份。</span>
        </div>
      )}

      <section className="project-grid" aria-label="旅行项目列表">
        {visibleProjects.length === 0 && <div className="empty-state"><h3>{projects.length ? '没有匹配的项目' : '还没有可读取的项目'}</h3><p>{projects.length ? '换一个项目名、目的地或日期试试。' : '可以新建计划，或从 JSON 备份恢复。损坏的数据不会被渲染或执行。'}</p></div>}
        {visibleProjects.map(({ project, totals }) => (
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
            <div className="project-card-actions">
              <Link className="action-button" to={`/projects/${project.projectId}/edit`}><Pencil aria-hidden="true" />修改</Link>
              <button className="action-button danger" type="button" disabled={deletingId === project.projectId} onClick={() => void removeProject(project.projectId, project.title)}><Trash2 aria-hidden="true" />{deletingId === project.projectId ? '删除中…' : '删除'}</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
