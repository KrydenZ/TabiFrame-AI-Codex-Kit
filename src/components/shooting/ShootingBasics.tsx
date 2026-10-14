import { Aperture, AudioLines, Footprints, Landmark } from 'lucide-react';

const basics = [
  { icon: Aperture, label: '固定机位12–15秒', text: '站稳，不要摇镜头，让路人、烟、树叶自己动。' },
  { icon: Footprints, label: '慢慢步行8–12秒', text: '胸口高度，避免走太快。' },
  { icon: Landmark, label: '建筑和招牌特写10秒', text: '屋檐、暖帘、木窗。' },
  { icon: AudioLines, label: '环境声30秒', text: '在老街、寺院、公园各录，拍摄期间不要说话。' },
];

export function ShootingBasics() {
  return (
    <section className="shooting-basics">
      <h2>先记住这4个时间</h2>
      <div className="basics-grid">
        {basics.map(({ icon: Icon, label, text }) => (
          <div className="basic-item" key={label}>
            <Icon aria-hidden="true" />
            <span><strong>{label}</strong>{text}</span>
          </div>
        ))}
      </div>
      <p className="basics-note">按录制键前后各留1–2秒，后期通常保留每条5–8秒。看到喜欢的场景拍「远景 → 中景 → 特写」。</p>
    </section>
  );
}
