import type { Shot, VlogProject } from './schemas/project';

export interface ShootingTotals {
  completedGroups: number;
  totalGroups: number;
  completedClips: number;
  totalClips: number;
  percentage: number;
}

export function getAllShots(project: VlogProject): Shot[] {
  return project.sections.flatMap((section) => section.shots);
}

export function calculateProgress(
  project: VlogProject,
  completedShotIds: ReadonlySet<string>,
): ShootingTotals {
  const shots = getAllShots(project);
  const completedShots = shots.filter((shot) => completedShotIds.has(shot.id));
  const totalClips = shots.reduce((sum, shot) => sum + shot.clipCount, 0);
  const completedClips = completedShots.reduce((sum, shot) => sum + shot.clipCount, 0);

  return {
    completedGroups: completedShots.length,
    totalGroups: shots.length,
    completedClips,
    totalClips,
    percentage: shots.length === 0 ? 0 : (completedShots.length / shots.length) * 100,
  };
}
