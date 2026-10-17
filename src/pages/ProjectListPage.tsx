import { useRef, useState, type ChangeEvent } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ArrowRight, CalendarDays, Cloud, FolderOpen, MapPin, Pencil, Plus, RefreshCw, Search, Trash2, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../db/database';
import { deleteProject, formatValidationError, importProjectBackup, syncRemoteProjects } from '../db/projects';
import { calculateProgress } from '../domain/progress';
import { vlogProjectSchema } from '../domain/schemas/project';
import type { ReferenceImage } from '../domain/schemas/project';

const sourceLabels = {
  reference: '历史参考',
  demo: '示例计划',
  imported: '导入计划',
  generated: '旅行计划',
} as const;

type StateFilter = 'all' | 'planned' | 'visited';
type ProgressFilter = 'all' | 'unfinished' | 'complete';
type SortMode = 'updated' | 'trip-date' | 'title' | 'progress';

function displayDate(value?: string) {
  if (!value) return '暂无记录';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function ProjectCover({ image }: { image?: ReferenceImage }) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) return <div className="project-cover project-cover-empty"><MapPin aria-hidden="true" /><span>参考图片未加载</span></div>;
  return <img className="project-cover" src={image.url} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

export function ProjectListPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<StateFilter>('all');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const projectState = useLiveQuery(async () => {
    const allRows = await db.projects.toArray();
    const rows = allRows.flatMap((row) => {
      const parsed = vlogProjectSchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    });
    const progress = await db.shotProgress.toArray();
    return {
      projects: rows.map((project) => {
        const ids = new Set(progress.filter((item) => item.projectId === project.projectId).map((item) => item.shotId));
        return { project, totals: calculateProgress(project, ids) };
      }),
      unreadableCount: allRows.length - rows.length,
    };
  }, []);
  const projects = projectState?.projects ?? [];
  const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN');
  const visibleProjects = projects
    .filter(({ project, totals }) => {
      if (stateFilter !== 'all' && project.travelState !== stateFilter) return false;
      if (progressFilter === 'complete' && totals.completedGroups !== totals.totalGroups) return false;
      if (progressFilter === 'unfinished' && totals.completedGroups === totals.totalGroups) return false;
      if (!normalizedQuery) return true;
      const searchable = [
        project.title, project.destination, project.shootDate, project.season, project.travelReflection,
        ...project.tags,
        ...project.sections.flatMap((section) => [section.title, section.subtitle, ...section.shots.map((shot) => shot.title)]),
      ].filter(Boolean).join(' ').toLocaleLowerCase('zh-CN');
      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => {
      if (sortMode === 'title') return a.project.title.localeCompare(b.project.title, 'zh-CN');
      if (sortMode === 'trip-date') return (b.project.shootDate || b.project.season || '').localeCompare(a.project.shootDate || a.project.season || '');
      if (sortMode === 'progress') return b.totals.percentage - a.totals.percentage || a.project.title.localeCompare(b.project.title, 'zh-CN');
      return (b.project.updatedAt ?? '').localeCompare(a.project.updatedAt ?? '');
    });
  const visitedCount = projects.filter(({ project }) => project.travelState === 'visited').length;

  async function refreshNow() {
    setSyncing(true);
    setMessage(null);
    try {
      const result = await syncRemoteProjects();
      setMessage(result.unreadableCount
        ? `同步完成，但远程有 ${result.unreadableCount} 条无法读取的旧记录。`
        : `同步完成：${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (error) {
      setMessage('同步失败：' + formatValidationError(error));
    } finally {
      setSyncing(false);
    }
  }

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
          <span className="brand-kicker">TABIFRAME AI</span>
          <h1>旅行 Vlog 策划账本</h1>
          <p>{projects.length} 次旅行 · {visitedCount} 次已走过</p>
        </div>
        <Link className="primary-link" to="/projects/new"><Plus aria-hidden="true" />新建旅行计划</Link>
      </header>

      <section className="storage-banner">
        <Cloud aria-hidden="true" />
        <div><strong>同一 ChatGPT 账户，手机与电脑自动同步</strong><span>私有 Site 登录身份用于隔离你的远程记录；D1 是主数据，本机数据库只是快速缓存。切换设备后可点“立即同步”。</span></div>
        <button className="sync-button" type="button" disabled={syncing} onClick={() => void refreshNow()}><RefreshCw className={syncing ? 'is-spinning' : ''} aria-hidden="true" />{syncing ? '同步中' : '立即同步'}</button>
      </section>

      <div className="page-toolbar">
        <div><span className="eyebrow">MY JOURNEYS</span><h2>旅行记录</h2></div>
        <div className="toolbar-actions"><button className="action-button" type="button" onClick={() => inputRef.current?.click()}><Upload aria-hidden="true" />导入备份</button></div>
        <input ref={inputRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void importBackup(event)} />
      </div>

      <section className="project-controls" aria-label="查询、筛选和排序旅行项目">
        <label className="project-search">
          <Search aria-hidden="true" />
          <span className="visually-hidden">查询旅行项目</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="查询项目、地点、标签、步骤或镜头" />
        </label>
        <div className="filter-row">
          <label><span>旅行状态</span><select value={stateFilter} onChange={(event) => setStateFilter(event.target.value as StateFilter)}><option value="all">全部</option><option value="planned">计划中</option><option value="visited">已走过</option></select></label>
          <label><span>拍摄进度</span><select value={progressFilter} onChange={(event) => setProgressFilter(event.target.value as ProgressFilter)}><option value="all">全部</option><option value="unfinished">未完成</option><option value="complete">已完成</option></select></label>
          <label><span>排列方式</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}><option value="updated">最近修改</option><option value="trip-date">旅行日期</option><option value="title">项目名称</option><option value="progress">完成度</option></select></label>
        </div>
      </section>

      {message && <p className="inline-message" role="status">{message}</p>}
      {!!projectState?.unreadableCount && (
        <div className="data-warning" role="alert">
          <strong>发现 {projectState.unreadableCount} 条不可读取的旧项目记录</strong>
          <span>它们已被安全隔离，不会导致页面白屏。请先导出仍可打开的项目，再从浏览器站点设置清除本站数据并重新导入备份。</span>
        </div>
      )}

      <p className="result-count">显示 {visibleProjects.length} / {projects.length} 个项目</p>
      <section className="project-grid" aria-label="旅行项目列表">
        {visibleProjects.length === 0 && <div className="empty-state"><h3>{projects.length ? '没有匹配的项目' : '还没有可读取的项目'}</h3><p>{projects.length ? '换一个关键词或清除筛选条件试试。' : '可以新建计划，或从 JSON 备份恢复。损坏的数据不会被渲染或执行。'}</p></div>}
        {visibleProjects.map(({ project, totals }) => {
          const cover = project.sections.flatMap((section) => section.referenceImages)[0];
          return (
            <article className="project-card" key={project.projectId}>
              <ProjectCover image={cover} />
              <div className="project-card-body">
                <div className="project-card-top">
                  <div className="chip-row"><span className={`travel-chip travel-${project.travelState}`}>{project.travelState === 'visited' ? '已走过' : '计划中'}</span><span className={`source-chip source-${project.sourceKind}`}>{sourceLabels[project.sourceKind]}</span></div>
                  <span className="card-date"><CalendarDays aria-hidden="true" />{project.shootDate || project.season || '日期待定'}</span>
                </div>
                <div><h3>{project.title}</h3><p>{project.destination}</p></div>
                {project.tags.length > 0 && <div className="tag-list">{project.tags.slice(0, 4).map((tag) => <span key={tag}>#{tag}</span>)}</div>}
                {project.travelReflection && <p className="memory-preview">{project.travelReflection}</p>}
                <div className="project-progress" aria-label={`${totals.completedGroups}组已完成`}><span style={{ width: `${totals.percentage}%` }} /></div>
                <div className="project-card-footer">
                  <span>{totals.completedGroups}/{totals.totalGroups} 组 · {totals.completedClips}/{totals.totalClips} 条计划素材</span>
                  <Link className="open-project-button" to={`/projects/${project.projectId}/shooting`} aria-label={`打开${project.title}`}><FolderOpen aria-hidden="true" />打开<ArrowRight aria-hidden="true" /></Link>
                </div>
                <div className="project-card-actions">
                  <Link className="action-button" to={`/projects/${project.projectId}/edit`}><Pencil aria-hidden="true" />修改与编排</Link>
                  <button className="action-button danger" type="button" disabled={deletingId === project.projectId} onClick={() => void removeProject(project.projectId, project.title)}><Trash2 aria-hidden="true" />{deletingId === project.projectId ? '删除中…' : '删除'}</button>
                </div>
                <small className="updated-at">最近修改：{displayDate(project.updatedAt)}</small>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
