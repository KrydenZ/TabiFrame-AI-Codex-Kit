import { getAllShots } from './progress';
import type { VlogProject } from './schemas/project';

export const EDITING_TEMPLATE_STATUS = 'rules-draft' as const;
export const EDITING_TEMPLATE_LABEL = '规则整理草案｜非历史原文';

export function buildEditingDraft(project: VlogProject, completedShotIds: ReadonlySet<string>): string {
  const completed = getAllShots(project).filter((shot) => completedShotIds.has(shot.id));
  const completedText = completed.length
    ? completed.map((shot) => `- ${shot.title}：${shot.description}（计划 ${shot.clipCount} 条，每条建议录制 ${shot.recordSeconds} 秒）`).join('\n')
    : '- 尚无用户勾选的完成组。请先在拍摄页手动记录，再整理剪映文字。';
  const timeline = project.editingTimeline.map(([time, title]) => `- ${time} ${title}`).join('\n');

  return `${EDITING_TEMPLATE_LABEL}\n\n请根据我自行核对并导入剪映的真实视频，剪辑《${project.title}》旅行记录 Vlog。目标成片约 ${project.targetVideoMinutes} 分钟，第一人称观察视角，按真实发生的时间顺序排列。\n\n固定剪辑规则：\n- 舒缓慢节奏，普通镜头通常约 8–12 秒，不快剪、不卡点、不过度运镜或使用花哨转场。\n- 主要场景使用底部居中的简短口语字幕；字幕只描述确实发生和拍到的内容。\n- 使用已获得相应许可的轻柔钢琴或安静轻音乐，约覆盖 80% 时长；重要环境声处降低或暂停 BGM。\n- 无真人旁白、无 AI 配音；没有真实素材的地点、食物或返程画面直接略过，不得虚构。\n\n策划时间线（仅作整理参考，不代表实际行走记录）：\n${timeline}\n\n按用户手动勾选记录整理的计划镜头摘要：\n${completedText}\n\n注意：勾选只表示用户手动记录该计划组为完成，不代表 App 已检测视频文件、数量、完整性或质量。请以剪映中实际导入且可用的视频为准。`;
}
