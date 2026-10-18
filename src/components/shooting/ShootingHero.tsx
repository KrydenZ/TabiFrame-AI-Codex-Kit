import { Camera, Clock3, Film, MapPin } from 'lucide-react';
import type { VlogProject } from '../../domain/schemas/project';

interface ShootingHeroProps {
  project: VlogProject;
  totalGroups: number;
  totalClips: number;
}

function formatShootDate(value: string): string {
  if (!value) return '日期待定';
  const date = new Date(value + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

export function ShootingHero({ project, totalGroups, totalClips }: ShootingHeroProps) {
  const isVisited = project.travelState === 'visited';
  return (
    <header className="shooting-hero">
      <div className="hero-eyebrow">{isVisited ? '旅行记录' : '拍摄计划'}</div>
      <h1>{project.title}</h1>
      <p className="hero-summary">{formatShootDate(project.shootDate)}｜{project.destination}{project.camera ? `｜${project.camera}` : ''}</p>
      <p className="hero-style">《一个人在日本散步》· 舒缓自然 · 无旁白 · 目标约 {project.targetVideoMinutes} 分钟</p>

      <div className="hero-pills" aria-label={isVisited ? '旅行记录摘要' : '拍摄摘要'}>
        <span className="hero-pill"><Clock3 aria-hidden="true" />{isVisited ? '行程' : '拍摄'} {project.shootWindow}</span>
        <span className="hero-pill"><Camera aria-hidden="true" />{totalGroups}组镜头清单</span>
        <span className="hero-pill"><Film aria-hidden="true" />{totalClips}条计划素材</span>
        <span className="hero-pill"><MapPin aria-hidden="true" />{isVisited ? '手动整理' : '无需拍满'}</span>
      </div>
    </header>
  );
}
