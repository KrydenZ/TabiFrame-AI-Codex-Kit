import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EditingPanel } from '../components/shooting/EditingPanel';
import { ShootingBasics } from '../components/shooting/ShootingBasics';
import { ShootingHero } from '../components/shooting/ShootingHero';
import { ShootingSection } from '../components/shooting/ShootingSection';
import { StickyProgress } from '../components/shooting/StickyProgress';
import { calculateProgress } from '../domain/progress';
import { useProject } from '../hooks/useProject';
import { useShotProgress } from '../hooks/useShotProgress';

export function ShootingPage() {
  const { projectId } = useParams();
  const project = useProject(projectId);
  const progress = useShotProgress(projectId ?? 'missing-project');

  if (project === null) return <main className="state-shell"><p>正在读取本机项目…</p></main>;
  if (!project) {
    return <main className="state-shell"><AlertTriangle aria-hidden="true" /><h1>找不到这个项目</h1><p>项目可能尚未导入，或浏览器站点数据已经被清除。</p><Link className="primary-link" to="/">返回项目列表</Link></main>;
  }

  const totals = calculateProgress(project, progress.completedShotIds);
  const references = project.sections.flatMap((section) => section.referenceImages);

  return (
    <main className="page-shell">
      <nav className="shooting-nav"><Link className="back-link" to="/"><ArrowLeft aria-hidden="true" />所有项目</Link><span>{project.sourceKind === 'reference' ? '成田基准计划' : project.sourceKind === 'demo' ? '演示计划' : '我的导入计划'}</span></nav>
      <ShootingHero project={project} totalGroups={totals.totalGroups} totalClips={totals.totalClips} />
      <StickyProgress totals={totals} saveState={progress.saveState} errorMessage={progress.errorMessage} />
      <p className="count-explainer">“完成素材条数”只累计你手动勾选的计划组所包含的计划条数，不代表 App 检测、上传或核验了视频文件。</p>
      <ShootingBasics />

      {project.needsVerification.length > 0 && (
        <section className="verification-card">
          <AlertTriangle aria-hidden="true" />
          <div><strong>出发前需要自行核实</strong><p>{project.needsVerification.join('、')}</p></div>
        </section>
      )}

      {project.sections.map((section) => (
        <ShootingSection
          key={section.id}
          section={section}
          completedShotIds={progress.completedShotIds}
          progressReady={progress.saveState !== 'loading' && progress.saveState !== 'saving'}
          onToggle={(shotId, completed) => void progress.toggleShot(shotId, completed)}
        />
      ))}

      <EditingPanel project={project} completedShotIds={progress.completedShotIds} onResetProgress={progress.resetProgress} />

      <footer className="page-footer">
        {references.length > 0 && <><strong>参考图片署名（只用于策划认机位，不是拍摄素材）：</strong><ol>{references.map((image) => <li key={image.sourceUrl}>{image.caption}：{image.author} · {image.license} · <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">来源页面</a></li>)}</ol></>}
        <p>TabiFrame AI 只保存旅行策划数据和用户手动勾选记录，不接触相机、相册或真实视频。</p>
      </footer>
    </main>
  );
}
