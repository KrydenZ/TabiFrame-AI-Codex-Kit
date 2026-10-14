import { Camera, Clock3, Film, MapPin } from 'lucide-react';
import type { VlogProject } from '../../domain/schemas/project';

interface ShootingHeroProps {
  project: VlogProject;
  totalGroups: number;
  totalClips: number;
}

function formatShootDate(value: string): string {
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
  return (
    <header className="shooting-hero">
      <div className="hero-eyebrow">{project.title}</div>
      <h1>就按照这份清单拍</h1>
      <p className="hero-summary">
        {formatShootDate(project.shootDate)}｜{project.camera}｜送机后成田半日 Vlog
      </p>
      <p className="hero-style">无旁白 · 环境声为主 · 最终成片7～8分钟</p>

      <div className="hero-pills" aria-label="拍摄摘要">
        <span className="hero-pill"><Clock3 aria-hidden="true" />拍摄 {project.shootWindow}</span>
        <span className="hero-pill"><Camera aria-hidden="true" />{totalGroups}组镜头</span>
        <span className="hero-pill"><Film aria-hidden="true" />约{totalClips}条素材</span>
        <span className="hero-pill"><MapPin aria-hidden="true" />无需拍满</span>
      </div>
    </header>
  );
}
