import type { Shot } from '../../domain/schemas/project';

interface ShotRowProps {
  shot: Shot;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export function ShotRow({ shot, checked, disabled = false, onChange }: ShotRowProps) {
  return (
    <label className={'shot-row ' + (checked ? 'is-checked' : '')} data-shot-id={shot.id}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={shot.id + ' ' + shot.title}
      />
      <span className="custom-check" aria-hidden="true" />
      <span className="shot-copy">
        <span className="shot-title-line">
          <strong>{shot.id}｜{shot.title}</strong>
          {shot.priority === 'must' && <span className="must-badge">必拍</span>}
        </span>
        <span className="shot-description">{shot.description}</span>
      </span>
      <span className="clip-badge">{shot.clipCount}条 × {shot.recordSeconds}秒</span>
    </label>
  );
}
