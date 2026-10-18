import { useState } from 'react';
import { AlertTriangle, ArrowLeft, MapPinned, Pencil, Search, X } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { EditingPanel } from '../components/shooting/EditingPanel';
import { ShootingBasics } from '../components/shooting/ShootingBasics';
import { ShootingHero } from '../components/shooting/ShootingHero';
import { ShootingSection } from '../components/shooting/ShootingSection';
import { StickyProgress } from '../components/shooting/StickyProgress';
import { RouteMap } from '../components/shooting/RouteMap';
import { calculateProgress } from '../domain/progress';
import { useProject } from '../hooks/useProject';
import { useShotProgress } from '../hooks/useShotProgress';
import { scrollToSection } from '../lib/scrollToSection';

export function ShootingPage() {
  const { projectId } = useParams();
  const location = useLocation();
  const project = useProject(projectId);
  const progress = useShotProgress(projectId ?? 'missing-project');
  const [shotQuery, setShotQuery] = useState('');
  const [shotFilter, setShotFilter] = useState<'all' | 'pending' | 'completed' | 'must'>('all');
  const importMessage = typeof location.state === 'object'
    && location.state !== null
    && 'importMessage' in location.state
    && typeof location.state.importMessage === 'string'
    ? location.state.importMessage
    : null;

  if (project === null) return <main className="state-shell"><p>正在读取项目…</p></main>;
  if (!project) {
    return <main className="state-shell"><AlertTriangle aria-hidden="true" /><h1>找不到这个项目</h1><p>项目可能尚未导入，或浏览器站点数据已经被清除。</p><Link className="primary-link" to="/">返回项目列表</Link></main>;
  }

  const totals = calculateProgress(project, progress.completedShotIds);
  const isVisited = project.travelState === 'visited';
  const references = project.sections.flatMap((section) => section.referenceImages);
  const normalizedShotQuery = shotQuery.trim().toLocaleLowerCase('zh-CN');
  const visibleSections = project.sections.map((section) => ({
    ...section,
    shots: section.shots.filter((shot) => {
      if (shotFilter === 'pending' && progress.completedShotIds.has(shot.id)) return false;
      if (shotFilter === 'completed' && !progress.completedShotIds.has(shot.id)) return false;
      if (shotFilter === 'must' && shot.priority !== 'must') return false;
      return !normalizedShotQuery || `${shot.title} ${shot.description} ${section.title}`.toLocaleLowerCase('zh-CN').includes(normalizedShotQuery);
    }),
  })).filter((section) => section.shots.length > 0);
  const visibleShotCount = visibleSections.reduce((count, section) => count + section.shots.length, 0);
  const hasActiveShotFilter = Boolean(shotQuery.trim()) || shotFilter !== 'all';

  function resetShotTools() {
    setShotQuery('');
    setShotFilter('all');
  }

  return (
    <main className="page-shell">
      <nav className="shooting-nav"><Link className="back-link" to="/"><ArrowLeft aria-hidden="true" />所有项目</Link><Link className="back-link" to={`/projects/${project.projectId}/edit`}><Pencil aria-hidden="true" />{isVisited ? '整理记录' : '修改计划'}</Link></nav>
      {importMessage && <p className="inline-message" role="status">{importMessage}</p>}
      <ShootingHero project={project} totalGroups={totals.totalGroups} totalClips={totals.totalClips} />
      <StickyProgress totals={totals} saveState={progress.saveState} errorMessage={progress.errorMessage} isVisited={isVisited} />
      <p className="count-explainer">“完成素材条数”只累计你手动勾选的计划组所包含的计划条数，不代表 App 检测、上传或核验了视频文件。</p>
      <ShootingBasics />

      {(project.travelState === 'visited' || project.travelReflection || project.tags.length > 0) && (
        <section className="journey-memory">
          <div><span>{project.travelState === 'visited' ? '已走过' : '计划中'}</span><strong>旅行记录</strong></div>
          {project.tags.length > 0 && <div className="tag-list">{project.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}
          {project.travelReflection && <p>{project.travelReflection}</p>}
        </section>
      )}

      {!isVisited && project.needsVerification.length > 0 && (
        <section className="verification-card">
          <AlertTriangle aria-hidden="true" />
          <div><strong>出发前需要自行核实</strong><p>{project.needsVerification.join('、')}</p></div>
        </section>
      )}

      {project.routeMap && <RouteMap routeMap={project.routeMap} isVisited={isVisited} />}

      <nav className="route-index" aria-label={isVisited ? '旅行步骤导航' : '路线步骤导航'}>
        <div className="route-index-title"><MapPinned aria-hidden="true" /><div><strong>{isVisited ? '旅行步骤' : '路线步骤'}</strong><span>{isVisited ? '按真实经历整理参考图与镜头' : '按步骤查看参考图与镜头'}</span></div></div>
        <div className="route-index-scroll">{project.sections.map((section, index) => <button key={section.id} type="button" onClick={() => scrollToSection(section.id)}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</button>)}</div>
      </nav>

      <section className="shot-tools" aria-label={isVisited ? '查询和筛选旅行记录镜头' : '查询和筛选计划镜头'}>
        <div className="shot-search"><Search aria-hidden="true" /><input aria-label="查询镜头" type="search" value={shotQuery} onChange={(event) => setShotQuery(event.target.value)} placeholder="查询镜头名称、拍法或步骤" />{shotQuery && <button className="clear-search" type="button" aria-label="清空镜头查询" onClick={() => setShotQuery('')}><X aria-hidden="true" /></button>}</div>
        <div className="shot-filter-row">
          {([['all', '全部'], ['pending', '未勾选'], ['completed', '已勾选'], ['must', '只看必拍']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={shotFilter === value} className={shotFilter === value ? 'is-active' : ''} onClick={() => setShotFilter(value)}>{label}</button>)}
        </div>
        <div className="shot-result-summary"><span>当前显示 {visibleShotCount} / {totals.totalGroups} 组</span>{hasActiveShotFilter && <button className="text-button" type="button" onClick={resetShotTools}>清除筛选</button>}</div>
      </section>

      {visibleSections.map((section) => (
        <ShootingSection
          key={section.id}
          section={section}
          stepNumber={project.sections.findIndex((item) => item.id === section.id) + 1}
          completedShotIds={progress.completedShotIds}
          progressReady={progress.saveState !== 'loading' && progress.saveState !== 'saving'}
          onToggle={(shotId, completed) => void progress.toggleShot(shotId, completed)}
        />
      ))}
      {visibleSections.length === 0 && <div className="empty-state"><h3>没有匹配的镜头</h3><p>换一个关键词，或清除筛选继续查看。</p><button className="action-button" type="button" onClick={resetShotTools}>显示全部镜头</button></div>}

      <EditingPanel project={project} completedShotIds={progress.completedShotIds} onResetProgress={progress.resetProgress} />

      <footer className="page-footer">
        {references.length > 0 && <><strong>参考图片署名（只用于策划认机位，不是拍摄素材）：</strong><ol>{references.map((image) => <li key={image.sourceUrl}>{image.caption}：{image.author} · {image.license} · <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">来源页面</a></li>)}</ol></>}
        <p>TabiFrame AI 只保存旅行策划数据和用户手动勾选记录，不接触相机、相册或真实视频。</p>
      </footer>
    </main>
  );
}
