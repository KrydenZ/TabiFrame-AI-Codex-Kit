import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowLeft, Clipboard, FileJson, Plus, Upload } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AiAccessNotice } from '../components/AiAccessNotice';
import { formatValidationError, importGeneratedProject } from '../db/projects';
import { buildGenerationPrompt, type TripInput } from '../domain/generation';
import { copyText } from '../lib/browser';

const initialInput: TripInput = {
  destination: '', dateOrSeason: '', shootingWindow: '约 4 小时', origin: '', endLocation: '', targetVideoMinutes: 8, equipment: '',
  contentFocus: '城市散步、建筑、沿途变化、环境声',
  avoidContent: '美食、购物、陌生人特写、需要预约的室内场所',
};

export function NewProjectPage() {
  const [trip, setTrip] = useState(initialInput);
  const [prompt, setPrompt] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  function generatePrompt(event: FormEvent) {
    event.preventDefault();
    setPrompt(buildGenerationPrompt(trip));
    setMessage('完整提示词已生成。复制给 ChatGPT/Codex，取得纯 JSON 后粘贴回来。');
  }

  async function createBlankRecord() {
    if (!trip.destination.trim() || !trip.dateOrSeason.trim() || !trip.shootingWindow.trim()) {
      setMessage('请先填写目的地、日期或季节，以及可用拍摄时间。');
      return;
    }
    const now = new Date().toISOString();
    const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(trip.dateOrSeason.trim());
    try {
      const result = await importGeneratedProject({
        schemaVersion: 1,
        promptVersion: 'manual-record-v1',
        projectId: `trip-${Date.now().toString(36)}`,
        title: `${trip.destination.trim()}旅行记录`,
        destination: trip.destination.trim(),
        shootDate: isIsoDate ? trip.dateOrSeason.trim() : '',
        season: isIsoDate ? undefined : trip.dateOrSeason.trim(),
        shootWindow: trip.shootingWindow.trim(),
        origin: trip.origin.trim() || undefined,
        endLocation: trip.endLocation.trim() || undefined,
        camera: trip.equipment.trim(),
        orientation: 'landscape',
        videoResolution: '',
        targetVideoMinutes: trip.targetVideoMinutes,
        stylePresetId: 'japan-solo-walk',
        sourceKind: 'imported',
        travelState: 'planned',
        travelReflection: '',
        tags: [],
        createdAt: now,
        updatedAt: now,
        notes: ['手动创建的旅行记录；请在“修改与编排”中整理实际路线与计划镜头。'],
        editingTimeline: [['00:00–待整理', '本期内容待编排']],
        sections: [{
          id: 'step-1', time: '时间待整理', title: '第一段行程', subtitle: '补充这一段去了哪里、想保留什么画面',
          tip: '只记录真实行程；不确定的信息暂时留空。', referenceImages: [], factChecks: [],
          shots: [{ id: 'shot-1', title: '第一组镜头', description: '补充真实画面内容或计划拍法', clipCount: 1, recordSeconds: 10, priority: 'normal', completed: false }],
        }],
        needsVerification: [],
      });
      navigate(`/projects/${result.project.projectId}/edit`);
    } catch (error) {
      setMessage('创建失败：' + formatValidationError(error));
    }
  }

  async function importJson(raw: string) {
    try {
      const result = await importGeneratedProject(JSON.parse(raw));
      const importMessage = result.collisionRemapped ? '项目 ID 已存在，已用新 ID 导入。' : '计划校验通过并已保存。';
      setMessage(importMessage);
      navigate(`/projects/${result.project.projectId}/shooting`, { state: { importMessage } });
    } catch (error) {
      setMessage('无法导入：' + formatValidationError(error));
    }
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2_000_000) return setMessage('文件不能超过 2 MB。');
    const raw = await file.text();
    setJsonText(raw);
    await importJson(raw);
  }

  return (
    <main className="form-shell">
      <Link className="back-link" to="/"><ArrowLeft aria-hidden="true" />返回项目列表</Link>
      <header className="form-header">
        <span className="brand-kicker">NEW TRIP</span>
        <h1>新建旅行计划</h1>
        <p>填写条件，复制提示词，再把返回的 JSON 粘贴回来。</p>
      </header>

      <AiAccessNotice />

      <form className="trip-form" onSubmit={generatePrompt}>
        <div className="form-section-heading full-field"><span>步骤 1</span><h2>填写这次旅行</h2><p>不用写 JSON。这里的内容会自动放进完整提示词。</p></div>
        <label><span>目的地 *</span><input required value={trip.destination} onChange={(e) => setTrip({ ...trip, destination: e.target.value })} placeholder="例如：箱根汤本与芦之湖" /></label>
        <label><span>日期或季节 *</span><input required value={trip.dateOrSeason} onChange={(e) => setTrip({ ...trip, dateOrSeason: e.target.value })} placeholder="例如：2026-11-03 或深秋" /></label>
        <label><span>可用拍摄时间 *</span><input required value={trip.shootingWindow} onChange={(e) => setTrip({ ...trip, shootingWindow: e.target.value })} /></label>
        <label><span>出发位置</span><input value={trip.origin} onChange={(e) => setTrip({ ...trip, origin: e.target.value })} placeholder="不知道可以留空" /></label>
        <label><span>结束位置</span><input value={trip.endLocation} onChange={(e) => setTrip({ ...trip, endLocation: e.target.value })} placeholder="不知道可以留空" /></label>
        <label><span>目标成片分钟 *</span><input required min="1" max="60" type="number" value={trip.targetVideoMinutes} onChange={(e) => setTrip({ ...trip, targetVideoMinutes: Number(e.target.value) })} /></label>
        <label className="full-field"><span>设备说明（可选）</span><input value={trip.equipment} onChange={(e) => setTrip({ ...trip, equipment: e.target.value })} placeholder="例如：手机横屏；不填也可以" /></label>
        <label className="full-field"><span>重点想拍什么</span><input value={trip.contentFocus} onChange={(e) => setTrip({ ...trip, contentFocus: e.target.value })} placeholder="例如：海边、建筑、列车、环境声" /></label>
        <label className="full-field"><span>不要出现什么</span><input value={trip.avoidContent} onChange={(e) => setTrip({ ...trip, avoidContent: e.target.value })} placeholder="例如：美食、购物、陌生人特写" /></label>
        <div className="new-project-actions full-field">
          <button className="primary-link" type="submit"><FileJson aria-hidden="true" />生成完整计划提示词</button>
          <button className="action-button" type="button" onClick={() => void createBlankRecord()}><Plus aria-hidden="true" />快速创建空白旅行记录</button>
        </div>
      </form>

      {prompt && (
        <section className="transfer-panel">
          <div className="panel-heading"><div><span>步骤 2</span><h2>复制提示词给 ChatGPT / Codex</h2></div><button className="action-button primary" type="button" onClick={() => void copyText(prompt).then(() => setMessage('提示词已复制。')).catch((error) => setMessage(error.message))}><Clipboard aria-hidden="true" />复制提示词</button></div>
          <p>下面整段就是实际提示词。外部 AI 应只返回一个 JSON 对象。</p>
          <textarea readOnly value={prompt} aria-label="结构化计划生成指令" />
        </section>
      )}

      <section className="transfer-panel">
        <div className="panel-heading"><div><span>步骤 3</span><h2>把返回的 JSON 粘贴回来</h2></div><button className="action-button" type="button" onClick={() => fileRef.current?.click()}><Upload aria-hidden="true" />选择 JSON 文件</button></div>
        <p><strong>Schema JSON</strong> 就是字段固定、App 能读懂的 JSON。你不用手写；这里只负责严格校验，错误内容不会覆盖已有项目。</p>
        <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder="把外部生成的 JSON 粘贴到这里" aria-label="计划 JSON" />
        <button className="primary-link" type="button" disabled={!jsonText.trim()} onClick={() => void importJson(jsonText)}>校验并保存项目</button>
        <input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => void readFile(event)} />
      </section>
      {message && <p className="inline-message" role="status">{message}</p>}
    </main>
  );
}
