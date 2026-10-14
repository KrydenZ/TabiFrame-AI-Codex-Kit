import { Navigate, useParams } from 'react-router-dom';
import { EditingTimeline } from '../components/shooting/EditingTimeline';
import { ShootingBasics } from '../components/shooting/ShootingBasics';
import { ShootingHero } from '../components/shooting/ShootingHero';
import { ShootingSection } from '../components/shooting/ShootingSection';
import { StickyProgress } from '../components/shooting/StickyProgress';
import { calculateProgress, getAllShots } from '../domain/progress';
import { naritaProject } from '../fixtures/naritaProject';
import { useShotProgress } from '../hooks/useShotProgress';

export function ShootingPage() {
  const { projectId } = useParams();
  const progress = useShotProgress(naritaProject.projectId);
  const totals = calculateProgress(naritaProject, progress.completedShotIds);

  if (projectId !== naritaProject.projectId) return <Navigate to="/" replace />;

  return (
    <main className="page-shell">
      <ShootingHero
        project={naritaProject}
        totalGroups={totals.totalGroups}
        totalClips={totals.totalClips}
      />
      <StickyProgress totals={totals} saveState={progress.saveState} errorMessage={progress.errorMessage} />
      <ShootingBasics />

      {naritaProject.sections.map((section) => (
        <ShootingSection
          key={section.id}
          section={section}
          completedShotIds={progress.completedShotIds}
          progressReady={progress.saveState !== 'loading' && progress.saveState !== 'saving'}
          onToggle={(shotId, completed) => void progress.toggleShot(shotId, completed)}
        />
      ))}

      <EditingTimeline
        project={naritaProject}
        completedShotIds={progress.completedShotIds}
        onReplaceProgress={progress.replaceProgress}
        onResetProgress={progress.resetProgress}
      />

      <footer className="page-footer">
        <strong>参考照片署名（只用于认机位，拍自己的素材）：</strong>
        <ol>
          {naritaProject.sections.flatMap((section) => section.referenceImages).map((image) => (
            <li key={image.sourceUrl}>
              {image.caption}：{image.author} · {image.license} ·{' '}
              <a href={image.sourceUrl} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a>
            </li>
          ))}
        </ol>
        <p>TabiFrame AI Phase 1：React 页面由结构化成田 fixture 渲染，完整保留 {getAllShots(naritaProject).length} 组 / {totals.totalClips} 条清单。</p>
      </footer>
    </main>
  );
}
