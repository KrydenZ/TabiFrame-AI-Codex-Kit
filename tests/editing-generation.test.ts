import { buildEditingDraft, EDITING_TEMPLATE_LABEL } from '../src/domain/editing';
import { buildGenerationPrompt } from '../src/domain/generation';
import { minatomiraiLineProject } from '../src/fixtures/projects';
import { JIANYING_SERIES_PROMPT, JIANYING_TEMPLATE_STATUS } from '../src/domain/jianying-template';

describe('V2 deterministic text flows', () => {
  it('builds the editing draft only from manually checked plan groups', () => {
    const text = buildEditingDraft(minatomiraiLineProject, new Set(['mm-17']));
    expect(JIANYING_TEMPLATE_STATUS).toBe('confirmed-original');
    expect(text.startsWith(`${JIANYING_SERIES_PROMPT}\n\n## 本期附加信息`)).toBe(true);
    expect(EDITING_TEMPLATE_LABEL).toBe('用户确认模板｜《一个人在日本散步》系列');
    expect(text).toContain('# 《一个人在日本散步》系列｜剪映 AI 通用提示词');
    expect(text).toContain('严禁添加额外电子防抖');
    expect(text).toContain('制作一部7～8分钟');
    expect(text).toContain('山下公园与港口');
    expect(text).not.toContain('第一段脚步：');
    expect(text).toContain('TabiFrame AI 不接触或识别视频');
    expect(text).toContain('策划路线（不是系统识别的实际行程）');
  });

  it('includes trip inputs and the strict import contract in the generation prompt', () => {
    const text = buildGenerationPrompt({
      destination: '箱根', dateOrSeason: '深秋', shootingWindow: '09:00–15:00', origin: '箱根汤本', endLocation: '', targetVideoMinutes: 12, equipment: '',
      contentFocus: '登山电车与自然', avoidContent: '美食与购物',
    });
    expect(text).toContain('箱根');
    expect(text).toContain('needsVerification');
    expect(text).toContain('sourceUrl 与 checkedAt');
    expect(text).toContain('"stylePresetId": "japan-solo-walk"');
    expect(text).toContain('不要 Markdown 代码块、HTML、脚本');
    expect(text).toContain('美食与购物');
    expect(text).toContain('不要自动加入美食');
  });
});
