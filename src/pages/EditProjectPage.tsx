import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatValidationError, saveProject } from '../db/projects';
import type { VlogProject } from '../domain/schemas/project';
import { useProject } from '../hooks/useProject';

type EditableProject = Pick<VlogProject, 'title' | 'destination' | 'shootDate' | 'season' | 'shootWindow' | 'origin' | 'endLocation' | 'camera' | 'videoResolution' | 'targetVideoMinutes'>;

function editableFields(project: VlogProject): EditableProject {
  return {
    title: project.title,
    destination: project.destination,
    shootDate: project.shootDate,
    season: project.season ?? '',
    shootWindow: project.shootWindow,
    origin: project.origin ?? '',
    endLocation: project.endLocation ?? '',
    camera: project.camera,
    videoResolution: project.videoResolution,
    targetVideoMinutes: project.targetVideoMinutes,
  };
}

export function EditProjectPage() {
  const { projectId } = useParams();
  const project = useProject(projectId);
  const [form, setForm] = useState<EditableProject | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (project) setForm(editableFields(project));
  }, [project]);

  if (project === null || (project && !form)) return <main className="state-shell"><p>正在读取项目…</p></main>;
  if (!project || !form) return <main className="state-shell"><h1>找不到这个项目</h1><Link className="primary-link" to="/">返回项目列表</Link></main>;

  function update<K extends keyof EditableProject>(key: K, value: EditableProject[K]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const saved = await saveProject({ ...project, ...form });
      navigate(`/projects/${saved.projectId}/shooting`, { state: { importMessage: '项目资料已保存到远程账户。' } });
    } catch (error) {
      setMessage('保存失败：' + formatValidationError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="form-shell">
      <Link className="back-link" to={`/projects/${project.projectId}/shooting`}><ArrowLeft aria-hidden="true" />返回拍摄计划</Link>
      <header className="form-header">
        <span className="brand-kicker">EDIT PROJECT</span>
        <h1>修改项目资料</h1>
        <p>只修改项目资料，不改变镜头清单、参考图、拍摄说明和已经勾选的进度。</p>
      </header>
      <form className="trip-form" onSubmit={(event) => void submit(event)}>
        <label className="full-field"><span>项目名称 *</span><input required value={form.title} onChange={(event) => update('title', event.target.value)} /></label>
        <label><span>目的地 *</span><input required value={form.destination} onChange={(event) => update('destination', event.target.value)} /></label>
        <label><span>拍摄日期</span><input value={form.shootDate} onChange={(event) => update('shootDate', event.target.value)} placeholder="例如：2026-11-03" /></label>
        <label><span>季节</span><input value={form.season} onChange={(event) => update('season', event.target.value)} /></label>
        <label><span>拍摄时段 *</span><input required value={form.shootWindow} onChange={(event) => update('shootWindow', event.target.value)} /></label>
        <label><span>出发位置</span><input value={form.origin} onChange={(event) => update('origin', event.target.value)} /></label>
        <label><span>结束位置</span><input value={form.endLocation} onChange={(event) => update('endLocation', event.target.value)} /></label>
        <label><span>设备</span><input value={form.camera} onChange={(event) => update('camera', event.target.value)} /></label>
        <label><span>视频规格</span><input value={form.videoResolution} onChange={(event) => update('videoResolution', event.target.value)} /></label>
        <label><span>目标成片分钟 *</span><input required min="1" max="60" step="0.5" type="number" value={form.targetVideoMinutes} onChange={(event) => update('targetVideoMinutes', Number(event.target.value))} /></label>
        <button className="primary-link full-field" disabled={busy} type="submit"><Save aria-hidden="true" />{busy ? '正在远程保存…' : '保存项目资料'}</button>
      </form>
      {message && <p className="inline-message is-error" role="alert">{message}</p>}
    </main>
  );
}
