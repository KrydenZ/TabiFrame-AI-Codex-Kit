import { Clapperboard } from 'lucide-react';
import type { VlogProject } from '../../domain/schemas/project';
import { ProgressBackupControls } from './ProgressBackupControls';

interface EditingTimelineProps {
  project: VlogProject;
  completedShotIds: ReadonlySet<string>;
  onReplaceProgress: (shotIds: readonly string[]) => Promise<void>;
  onResetProgress: () => Promise<void>;
}

export function EditingTimeline(props: EditingTimelineProps) {
  const { project } = props;
  return (
    <section className="editing-note">
      <div className="note-heading">
        <Clapperboard aria-hidden="true" />
        <div><span>剪辑参考</span><h2>回家剪成7分30秒</h2></div>
      </div>
      <table className="editing-timeline">
        <tbody>
          {project.editingTimeline.map(([time, title]) => (
            <tr key={time}><th scope="row">{time}</th><td>{title}</td></tr>
          ))}
        </tbody>
      </table>
      <p className="editing-disclaimer">这是当时的成田现场拍摄基准；最新通用剪映模板可选择「轻柔钢琴约80%」或「环境声优先」，两者互不覆盖。</p>
      <ProgressBackupControls {...props} />
      <p className="storage-warning">照片只用于识别机位，来自 Wikimedia Commons；联网才能显示，图片下可打开原图。离线时所有拍摄文字仍可用。浏览器数据可能因清理而丢失，建议定期导出进度 JSON。</p>
    </section>
  );
}
