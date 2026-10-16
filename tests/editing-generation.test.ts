import { buildEditingDraft, EDITING_TEMPLATE_LABEL } from '../src/domain/editing';
import { buildGenerationPrompt } from '../src/domain/generation';
import { minatomiraiLineProject } from '../src/fixtures/projects';

describe('V2 deterministic text flows', () => {
  it('builds the editing draft only from manually checked plan groups', () => {
    const text = buildEditingDraft(minatomiraiLineProject, new Set(['mm-17']));
    expect(text).toContain(EDITING_TEMPLATE_LABEL);
    expect(text).toContain('山下公园与港口');
    expect(text).not.toContain('第一段脚步：');
    expect(text).toContain('不代表 App 已检测视频文件');
    expect(text).toContain('返程画面安静收束');
    expect(text).not.toContain('环境声优先');
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
