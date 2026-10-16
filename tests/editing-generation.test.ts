import { buildEditingDraft, EDITING_TEMPLATE_LABEL } from '../src/domain/editing';
import { buildGenerationPrompt } from '../src/domain/generation';
import { yokohamaLineProject } from '../src/fixtures/projects';

describe('V2 deterministic text flows', () => {
  it('builds the editing draft only from manually checked plan groups', () => {
    const text = buildEditingDraft(yokohamaLineProject, new Set(['yk-19']));
    expect(text).toContain(EDITING_TEMPLATE_LABEL);
    expect(text).toContain('体育场外景');
    expect(text).not.toContain('开始走路：');
    expect(text).toContain('不代表 App 已检测视频文件');
    expect(text).toContain('返程画面安静收束');
    expect(text).not.toContain('环境声优先');
  });

  it('includes trip inputs and the strict import contract in the generation prompt', () => {
    const text = buildGenerationPrompt({
      destination: '箱根', dateOrSeason: '深秋', shootingWindow: '09:00–15:00', origin: '箱根汤本', endLocation: '', targetVideoMinutes: 7, equipment: '',
    });
    expect(text).toContain('箱根');
    expect(text).toContain('needsVerification');
    expect(text).toContain('sourceUrl 与 checkedAt');
    expect(text).toContain('"stylePresetId": "japan-solo-walk"');
    expect(text).toContain('不要 Markdown、HTML、脚本');
  });
});
