import { ShieldCheck } from 'lucide-react';
import type { ShootingSection as ShootingSectionType } from '../../domain/schemas/project';
import { ReferenceGallery } from './ReferenceGallery';
import { ShotRow } from './ShotRow';

interface ShootingSectionProps {
  section: ShootingSectionType;
  completedShotIds: ReadonlySet<string>;
  progressReady: boolean;
  onToggle: (shotId: string, completed: boolean) => void;
}

export function ShootingSection({
  section,
  completedShotIds,
  progressReady,
  onToggle,
}: ShootingSectionProps) {
  return (
    <section className="shooting-section" id={section.id}>
      <header className="section-heading">
        <div className="section-time">{section.time}</div>
        <h2>{section.title}</h2>
        <p>{section.subtitle}</p>
      </header>

      <ReferenceGallery images={section.referenceImages} />

      <div className="shot-list">
        {section.shots.map((shot) => (
          <ShotRow
            key={shot.id}
            shot={shot}
            checked={completedShotIds.has(shot.id)}
            disabled={!progressReady}
            onChange={(completed) => onToggle(shot.id, completed)}
          />
        ))}
      </div>

      <div className="section-tip">
        <ShieldCheck aria-hidden="true" />
        <span>{section.tip}</span>
      </div>
    </section>
  );
}
