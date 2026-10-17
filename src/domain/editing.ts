import { getAllShots } from './progress';
import type { VlogProject } from './schemas/project';
import { JIANYING_SERIES_PROMPT, JIANYING_TEMPLATE_LABEL, JIANYING_TEMPLATE_STATUS } from './jianying-template';

export const EDITING_TEMPLATE_STATUS = JIANYING_TEMPLATE_STATUS;
export const EDITING_TEMPLATE_LABEL = JIANYING_TEMPLATE_LABEL;

export function buildEditingDraft(project: VlogProject, completedShotIds: ReadonlySet<string>): string {
  const completed = getAllShots(project).filter((shot) => completedShotIds.has(shot.id));
  const completedText = completed.length
    ? completed.map((shot) => `- ${shot.title}：${shot.description}（计划 ${shot.clipCount} 条，每条建议录制 ${shot.recordSeconds} 秒）`).join('\n')
    : '- 尚无用户勾选的完成组。请先在拍摄页手动记录，再整理剪映文字。';
  const timeline = project.editingTimeline.map(([time, title]) => `- ${time} ${title}`).join('\n');
  const route = project.sections.map((section, index) => `${index + 1}. ${section.title}`).join('\n');
  const reflection = project.travelReflection
    ? `\n用户填写的旅行回顾（可用于理解个人感受，不得扩写成未发生的经历）：\n${project.travelReflection}\n`
    : '';

  return `${JIANYING_SERIES_PROMPT}\n\n## 本期附加信息\n\n本期名称：${project.title}\n\n本期地点：${project.destination}\n\n旅行记录状态：${project.travelState === 'visited' ? '用户标记为“已走过”' : '计划中'}\n\n策划路线（不是系统识别的实际行程）：\n${route || '- 未填写'}\n${reflection}\n策划时间线（请以剪映中实际导入素材的顺序为准）：\n${timeline}\n\n按用户手动勾选记录整理的计划镜头摘要：\n${completedText}\n\n使用要求：只采用本期真实导入且可用的素材。TabiFrame AI 不接触或识别视频；以上路线、时间线、旅行回顾和勾选仅是用户提供的策划与手动记录，不足以证明实际拍摄内容。没有对应素材的环节直接跳过，不得虚构。`;
}
