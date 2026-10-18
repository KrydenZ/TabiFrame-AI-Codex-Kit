import { useEffect, useState, type FormEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, ImageOff, Plus, Save, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatValidationError, saveProject } from '../db/projects';
import type { ReferenceImage, ShootingSection, Shot, VlogProject } from '../domain/schemas/project';
import { useProject } from '../hooks/useProject';

type ProjectField = 'title' | 'destination' | 'shootDate' | 'season' | 'shootWindow' | 'origin' | 'endLocation' | 'camera' | 'videoResolution' | 'targetVideoMinutes' | 'travelState' | 'travelReflection';
type SectionField = 'time' | 'title' | 'subtitle' | 'tip';
type ShotField = 'title' | 'description' | 'clipCount' | 'recordSeconds' | 'priority';
type ReferenceField = keyof ReferenceImage;

function StepReferenceThumbnail({ image }: { image?: ReferenceImage }) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) return <div className="step-image-empty"><ImageOff aria-hidden="true" /><span>{failed ? '图片暂不可用' : '暂无参考图'}</span></div>;
  return <img src={image.url} alt="" loading="lazy" onError={() => setFailed(true)} />;
}

function uniqueSectionId(project: VlogProject): string {
  const existing = new Set(project.sections.map((section) => section.id));
  const base = `step-${Date.now().toString(36)}`;
  let id = base;
  let suffix = 1;
  while (existing.has(id)) id = `${base}-${suffix++}`;
  return id;
}

function uniqueShotId(project: VlogProject): string {
  const existing = new Set(project.sections.flatMap((section) => section.shots.map((shot) => shot.id)));
  const base = `custom-${Date.now().toString(36)}`;
  let id = base;
  let suffix = 1;
  while (existing.has(id)) id = `${base}-${suffix++}`;
  return id;
}

export function EditProjectPage() {
  const { projectId } = useParams();
  const project = useProject(projectId);
  const [form, setForm] = useState<VlogProject | null>(null);
  const [tagsText, setTagsText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (project) {
      setForm(structuredClone(project));
      setTagsText(project.tags.join('、'));
    }
  }, [project]);

  if (project === null || (project && !form)) return <main className="state-shell"><p>正在读取项目…</p></main>;
  if (!project || !form) return <main className="state-shell"><h1>找不到这个项目</h1><Link className="primary-link" to="/">返回项目列表</Link></main>;

  function updateProject(key: ProjectField, value: VlogProject[ProjectField]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  function updateSection(sectionId: string, key: SectionField, value: string) {
    setForm((current) => current ? {
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? { ...section, [key]: value } : section),
    } : current);
  }

  function moveSection(index: number, direction: -1 | 1) {
    setForm((current) => {
      if (!current) return current;
      const target = index + direction;
      if (target < 0 || target >= current.sections.length) return current;
      const sections = [...current.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      const editingTimeline = [...current.editingTimeline];
      if (editingTimeline.length === sections.length) [editingTimeline[index], editingTimeline[target]] = [editingTimeline[target], editingTimeline[index]];
      return { ...current, sections, editingTimeline };
    });
  }

  function addSection() {
    setForm((current) => {
      if (!current) return current;
      const id = uniqueSectionId(current);
      const section: ShootingSection = {
        id, time: '时间待整理', title: `第 ${current.sections.length + 1} 段行程`, subtitle: '补充这一段的地点和目的',
        tip: '只记录真实行程；不确定的信息暂时留空。', referenceImages: [], factChecks: [],
        shots: [{ id: `${id}-shot-1`, title: '新镜头', description: '补充真实画面内容或计划拍法', clipCount: 1, recordSeconds: 10, priority: 'normal', completed: false }],
      };
      return { ...current, sections: [...current.sections, section], editingTimeline: [...current.editingTimeline, ['待整理', section.title]] };
    });
  }

  function removeSection(index: number) {
    if (!form) return;
    if (form.sections.length <= 1) return setMessage('项目至少需要保留一个路线步骤。');
    const section = form.sections[index];
    if (!window.confirm(`删除路线步骤“${section.title}”？保存后该步骤下的镜头与对应勾选记录都会删除。`)) return;
    setForm((current) => current ? {
      ...current,
      sections: current.sections.filter((_, itemIndex) => itemIndex !== index),
      editingTimeline: current.editingTimeline.filter((_, itemIndex) => itemIndex !== index),
    } : current);
  }

  function addReference(sectionId: string) {
    setForm((current) => current ? {
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? {
        ...section,
        referenceImages: [{ caption: '', url: '', sourceUrl: '', author: '', license: '' }, ...section.referenceImages],
      } : section),
    } : current);
  }

  function updateReference(sectionId: string, key: ReferenceField, value: string) {
    setForm((current) => current ? {
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? {
        ...section,
        referenceImages: section.referenceImages.map((image, index) => index === 0 ? { ...image, [key]: value } : image),
      } : section),
    } : current);
  }

  function removeReference(sectionId: string) {
    setForm((current) => current ? {
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? { ...section, referenceImages: section.referenceImages.slice(1) } : section),
    } : current);
  }

  function updateShot(sectionId: string, shotId: string, key: ShotField, value: Shot[ShotField]) {
    setForm((current) => current ? {
      ...current,
      sections: current.sections.map((section) => section.id === sectionId ? {
        ...section,
        shots: section.shots.map((shot) => shot.id === shotId ? { ...shot, [key]: value } : shot),
      } : section),
    } : current);
  }

  function moveShot(sectionId: string, index: number, direction: -1 | 1) {
    setForm((current) => current ? {
      ...current,
      sections: current.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const target = index + direction;
        if (target < 0 || target >= section.shots.length) return section;
        const shots = [...section.shots];
        [shots[index], shots[target]] = [shots[target], shots[index]];
        return { ...section, shots };
      }),
    } : current);
  }

  function addShot(sectionId: string) {
    setForm((current) => {
      if (!current) return current;
      const shot: Shot = {
        id: uniqueShotId(current), title: '新镜头', description: '补充具体站位、主体和拍法', clipCount: 1,
        recordSeconds: 10, priority: 'normal', completed: false,
      };
      return {
        ...current,
        sections: current.sections.map((section) => section.id === sectionId ? { ...section, shots: [...section.shots, shot] } : section),
      };
    });
  }

  function removeShot(section: ShootingSection, shotId: string) {
    if (section.shots.length <= 1) return setMessage('每个路线步骤至少需要保留一个镜头。');
    const shot = section.shots.find((item) => item.id === shotId);
    if (!window.confirm(`删除计划镜头“${shot?.title ?? shotId}”？保存后对应的勾选记录也会失效。`)) return;
    setForm((current) => current ? {
      ...current,
      sections: current.sections.map((item) => item.id === section.id ? { ...item, shots: item.shots.filter((entry) => entry.id !== shotId) } : item),
    } : current);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const tags = [...new Set(tagsText.split(/[、,，]/).map((tag) => tag.trim()).filter(Boolean))];
      const saved = await saveProject({ ...form, tags });
      navigate(`/projects/${saved.projectId}/shooting`, { state: { importMessage: '项目资料、旅行记录和路线编排已保存到远程账户。' } });
    } catch (error) {
      setMessage('保存失败：' + formatValidationError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="form-shell wide-form-shell">
      <Link className="back-link" to={`/projects/${project.projectId}/shooting`}><ArrowLeft aria-hidden="true" />返回{project.travelState === 'visited' ? '旅行记录' : '拍摄计划'}</Link>
      <header className="form-header">
        <span className="brand-kicker">EDIT JOURNEY</span>
        <h1>修改与编排</h1>
        <p>整理旅行资料、标记是否已经走过，并调整路线步骤和镜头顺序。镜头 ID 保持稳定，已有勾选不会因移动顺序而丢失。</p>
      </header>
      <form onSubmit={(event) => void submit(event)}>
        <section className="trip-form">
          <div className="form-section-heading full-field"><span>旅行档案</span><h2>基本资料与旅行回顾</h2><p>“已走过”是项目级记录，不改变镜头 Checkbox 的含义。</p></div>
          <label className="full-field"><span>项目名称 *</span><input required value={form.title} onChange={(event) => updateProject('title', event.target.value)} /></label>
          <label><span>目的地 *</span><input required value={form.destination} onChange={(event) => updateProject('destination', event.target.value)} /></label>
          <label><span>旅行状态</span><select value={form.travelState} onChange={(event) => updateProject('travelState', event.target.value as VlogProject['travelState'])}><option value="planned">计划中</option><option value="visited">已走过</option></select></label>
          <label><span>拍摄／旅行日期</span><input value={form.shootDate} onChange={(event) => updateProject('shootDate', event.target.value)} placeholder="例如：2026-11-03" /></label>
          <label><span>季节</span><input value={form.season ?? ''} onChange={(event) => updateProject('season', event.target.value)} /></label>
          <label><span>拍摄时段 *</span><input required value={form.shootWindow} onChange={(event) => updateProject('shootWindow', event.target.value)} /></label>
          <label><span>目标成片分钟 *</span><input required min="1" max="60" step="0.5" type="number" value={form.targetVideoMinutes} onChange={(event) => updateProject('targetVideoMinutes', Number(event.target.value))} /></label>
          <label><span>出发位置</span><input value={form.origin ?? ''} onChange={(event) => updateProject('origin', event.target.value)} /></label>
          <label><span>结束位置</span><input value={form.endLocation ?? ''} onChange={(event) => updateProject('endLocation', event.target.value)} /></label>
          <label><span>设备</span><input value={form.camera} onChange={(event) => updateProject('camera', event.target.value)} /></label>
          <label><span>视频规格</span><input value={form.videoResolution} onChange={(event) => updateProject('videoResolution', event.target.value)} /></label>
          <label className="full-field"><span>标签</span><input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="例如：北海道、冬天、电车、海边（用顿号或逗号分隔）" /></label>
          <label className="full-field"><span>旅行回顾</span><textarea maxLength={2000} value={form.travelReflection} onChange={(event) => updateProject('travelReflection', event.target.value)} placeholder="旅行结束后写几句：实际走了哪里、最喜欢哪一段、剪辑时想保留什么感觉。这里只是项目回顾，不是现场逐镜头备注。" /><small className="field-hint">{form.travelReflection.length} / 2000 字</small></label>
        </section>

        <section className="route-editor">
          <div className="form-section-heading"><span>路线编排</span><h2>步骤与镜头</h2><p>可以改名称、时间、说明、条数、秒数和顺序；参考照片随步骤一起移动。</p></div>
          {form.sections.map((section, sectionIndex) => (
            <article className="route-step-editor" key={section.id}>
              <header className="route-step-header">
                <div className="step-number">{String(sectionIndex + 1).padStart(2, '0')}</div>
                <StepReferenceThumbnail key={section.referenceImages[0]?.url ?? 'empty'} image={section.referenceImages[0]} />
                <div><strong>{section.title}</strong><span>{section.shots.length} 组镜头 · {section.referenceImages.length} 张参考图</span></div>
                <div className="move-buttons"><button type="button" aria-label={`上移${section.title}`} disabled={sectionIndex === 0} onClick={() => moveSection(sectionIndex, -1)}><ArrowUp aria-hidden="true" /></button><button type="button" aria-label={`下移${section.title}`} disabled={sectionIndex === form.sections.length - 1} onClick={() => moveSection(sectionIndex, 1)}><ArrowDown aria-hidden="true" /></button><button className="danger-icon" type="button" aria-label={`删除步骤${section.title}`} disabled={form.sections.length <= 1} onClick={() => removeSection(sectionIndex)}><Trash2 aria-hidden="true" /></button></div>
              </header>
              <div className="route-fields">
                <label><span>现场时间段</span><input required value={section.time} onChange={(event) => updateSection(section.id, 'time', event.target.value)} /></label>
                <label><span>步骤名称</span><input required value={section.title} onChange={(event) => updateSection(section.id, 'title', event.target.value)} /></label>
                <label className="full-field"><span>步骤说明</span><input required value={section.subtitle} onChange={(event) => updateSection(section.id, 'subtitle', event.target.value)} /></label>
                <label className="full-field"><span>现场提示</span><textarea required value={section.tip} onChange={(event) => updateSection(section.id, 'tip', event.target.value)} /></label>
              </div>
              <details className="photo-editor-details">
                <summary>参考照片与署名（不是上传真实拍摄素材）</summary>
                {section.referenceImages.length === 0 ? (
                  <div className="photo-empty-editor"><p>当前步骤没有参考照片。可以填写一个可靠的 HTTPS 图片链接和来源；不确定时宁可留空。</p><button className="action-button" type="button" onClick={() => addReference(section.id)}><Plus aria-hidden="true" />添加参考照片链接</button></div>
                ) : (
                  <div className="photo-fields">
                    <label><span>照片说明</span><input required value={section.referenceImages[0].caption} onChange={(event) => updateReference(section.id, 'caption', event.target.value)} /></label>
                    <label><span>图片 HTTPS 地址</span><input required type="url" value={section.referenceImages[0].url} onChange={(event) => updateReference(section.id, 'url', event.target.value)} /></label>
                    <label><span>来源页面 HTTPS 地址</span><input required type="url" value={section.referenceImages[0].sourceUrl} onChange={(event) => updateReference(section.id, 'sourceUrl', event.target.value)} /></label>
                    <label><span>作者</span><input required value={section.referenceImages[0].author} onChange={(event) => updateReference(section.id, 'author', event.target.value)} /></label>
                    <label><span>许可证</span><input required value={section.referenceImages[0].license} onChange={(event) => updateReference(section.id, 'license', event.target.value)} /></label>
                    {section.referenceImages.length > 1 && <p>此步骤另有 {section.referenceImages.length - 1} 张参考图，会原样保留；完整编辑可通过项目 JSON 备份完成。</p>}
                    <button className="action-button danger" type="button" onClick={() => removeReference(section.id)}>移除第一张参考图</button>
                  </div>
                )}
              </details>
              <details className="shot-editor-details">
                <summary>编辑本步骤的 {section.shots.length} 组镜头</summary>
                <div className="shot-editor-list">
                  {section.shots.map((shot, shotIndex) => (
                    <div className="shot-editor-card" key={shot.id}>
                      <div className="shot-editor-heading"><code>{shot.id}</code><div className="move-buttons"><button type="button" aria-label={`上移${shot.title}`} disabled={shotIndex === 0} onClick={() => moveShot(section.id, shotIndex, -1)}><ArrowUp aria-hidden="true" /></button><button type="button" aria-label={`下移${shot.title}`} disabled={shotIndex === section.shots.length - 1} onClick={() => moveShot(section.id, shotIndex, 1)}><ArrowDown aria-hidden="true" /></button><button className="danger-icon" type="button" aria-label={`删除${shot.title}`} disabled={section.shots.length <= 1} onClick={() => removeShot(section, shot.id)}><Trash2 aria-hidden="true" /></button></div></div>
                      <label><span>镜头名称</span><input required value={shot.title} onChange={(event) => updateShot(section.id, shot.id, 'title', event.target.value)} /></label>
                      <label className="full-field"><span>具体拍法</span><textarea required value={shot.description} onChange={(event) => updateShot(section.id, shot.id, 'description', event.target.value)} /></label>
                      <label><span>计划条数</span><input min="1" max="20" type="number" value={shot.clipCount} onChange={(event) => updateShot(section.id, shot.id, 'clipCount', Number(event.target.value))} /></label>
                      <label><span>每条秒数</span><input min="1" max="180" type="number" value={shot.recordSeconds} onChange={(event) => updateShot(section.id, shot.id, 'recordSeconds', Number(event.target.value))} /></label>
                      <label><span>优先级</span><select value={shot.priority} onChange={(event) => updateShot(section.id, shot.id, 'priority', event.target.value as Shot['priority'])}><option value="must">必拍</option><option value="normal">普通</option><option value="optional">可选</option></select></label>
                    </div>
                  ))}
                </div>
                <button className="action-button add-shot-button" type="button" onClick={() => addShot(section.id)}><Plus aria-hidden="true" />新增镜头</button>
              </details>
            </article>
          ))}
          <button className="action-button add-section-button" type="button" onClick={addSection}><Plus aria-hidden="true" />新增路线步骤</button>
        </section>

        <div className="editor-save-bar"><Link className="action-button" to={`/projects/${project.projectId}/shooting`}>取消</Link><button className="primary-link" disabled={busy} type="submit"><Save aria-hidden="true" />{busy ? '正在远程保存…' : '保存全部修改'}</button></div>
      </form>
      {message && <p className="inline-message is-error" role="alert">{message}</p>}
    </main>
  );
}
