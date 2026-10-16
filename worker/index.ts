import { vlogProjectSchema, type VlogProject } from '../src/domain/schemas/project';

interface Env {
  DB: D1Database;
}

interface ProjectPayload {
  project: VlogProject;
  completedShotIds: string[];
}

class InputError extends Error {}

const JSON_HEADERS = {
  'cache-control': 'private, no-store',
  'content-type': 'application/json; charset=utf-8',
};

function json(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: JSON_HEADERS });
}

function requireUser(request: Request): string | Response {
  const userId = request.headers.get('oai-authenticated-user-id');
  if (!userId) return json({ error: '需要通过当前私有 Site 登录后才能访问远程项目。' }, 401);
  return userId;
}

function mutationAllowed(request: Request): boolean {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if (origin && origin !== url.origin) return false;
  if (fetchSite === 'cross-site') return false;
  return request.headers.get('content-type')?.toLowerCase().startsWith('application/json') ?? false;
}

async function readPayload(request: Request): Promise<ProjectPayload> {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(length) && length > 2_000_000) throw new InputError('项目数据不能超过 2 MB。');
  const raw = await request.text();
  if (raw.length > 2_000_000) throw new InputError('项目数据不能超过 2 MB。');
  const input = JSON.parse(raw) as { project?: unknown; completedShotIds?: unknown };
  const project = vlogProjectSchema.parse(input.project);
  const completedShotIds = parseCompletedShotIds(project, input.completedShotIds ?? []);
  return { project, completedShotIds };
}

function parseCompletedShotIds(project: VlogProject, input: unknown): string[] {
  if (!Array.isArray(input) || input.some((id) => typeof id !== 'string')) {
    throw new InputError('completedShotIds 必须是字符串数组。');
  }
  const values = input as string[];
  const unique = new Set(values);
  if (unique.size !== values.length) throw new InputError('完成镜头 ID 不得重复。');
  const known = new Set(project.sections.flatMap((section) => section.shots.map((shot) => shot.id)));
  if (values.some((id) => !known.has(id))) throw new InputError('完成进度包含当前项目不存在的镜头。');
  return values;
}

async function readProgressPayload(request: Request, project: VlogProject): Promise<string[]> {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (Number.isFinite(length) && length > 200_000) throw new InputError('进度数据不能超过 200 KB。');
  const input = await request.json() as { completedShotIds?: unknown };
  return parseCompletedShotIds(project, input.completedShotIds ?? []);
}

async function readProject(env: Env, userId: string, projectId: string): Promise<VlogProject | null> {
  const row = await env.DB.prepare(
    'SELECT project_json FROM projects WHERE user_id = ?1 AND project_id = ?2',
  ).bind(userId, projectId).first<{ project_json: string }>();
  return row ? vlogProjectSchema.parse(JSON.parse(row.project_json)) : null;
}

async function replaceProgress(env: Env, userId: string, projectId: string, completedShotIds: string[]): Promise<void> {
  const now = new Date().toISOString();
  const statements = [
    env.DB.prepare('DELETE FROM shot_progress WHERE user_id = ?1 AND project_id = ?2').bind(userId, projectId),
    ...completedShotIds.map((shotId) => env.DB.prepare(
      'INSERT INTO shot_progress (user_id, project_id, shot_id, completed_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)',
    ).bind(userId, projectId, shotId, now)),
  ];
  await env.DB.batch(statements);
}

async function saveProject(env: Env, userId: string, payload: ProjectPayload, createOnly: boolean): Promise<Response> {
  const { project, completedShotIds } = payload;
  if (createOnly) {
    const exists = await env.DB.prepare(
      'SELECT 1 AS found FROM projects WHERE user_id = ?1 AND project_id = ?2',
    ).bind(userId, project.projectId).first();
    if (exists) return json({ error: '项目 ID 已存在。' }, 409);
  }

  const now = new Date().toISOString();
  const createdAt = project.createdAt ?? now;
  const storedProject = vlogProjectSchema.parse({ ...project, createdAt, updatedAt: now });
  const statements = [
    env.DB.prepare(`
      INSERT INTO projects (user_id, project_id, project_json, created_at, updated_at)
      VALUES (?1, ?2, ?3, ?4, ?5)
      ON CONFLICT(user_id, project_id) DO UPDATE SET project_json = excluded.project_json, updated_at = excluded.updated_at
    `).bind(userId, storedProject.projectId, JSON.stringify(storedProject), createdAt, now),
    env.DB.prepare('DELETE FROM shot_progress WHERE user_id = ?1 AND project_id = ?2').bind(userId, storedProject.projectId),
    ...completedShotIds.map((shotId) => env.DB.prepare(
      'INSERT INTO shot_progress (user_id, project_id, shot_id, completed_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?4)',
    ).bind(userId, storedProject.projectId, shotId, now)),
  ];
  await env.DB.batch(statements);
  return json({ project: storedProject, completedShotIds }, createOnly ? 201 : 200);
}

async function listProjects(env: Env, userId: string): Promise<Response> {
  const [projectResult, progressResult] = await Promise.all([
    env.DB.prepare('SELECT project_json FROM projects WHERE user_id = ?1 ORDER BY updated_at DESC').bind(userId).all<{ project_json: string }>(),
    env.DB.prepare('SELECT project_id, shot_id, completed_at, updated_at FROM shot_progress WHERE user_id = ?1').bind(userId).all<{
      project_id: string; shot_id: string; completed_at: string; updated_at: string;
    }>(),
  ]);
  let unreadableCount = 0;
  const projects = projectResult.results.flatMap((row) => {
    try {
      const parsed = vlogProjectSchema.safeParse(JSON.parse(row.project_json));
      if (parsed.success) return [parsed.data];
      unreadableCount += 1;
      return [];
    } catch {
      unreadableCount += 1;
      return [];
    }
  });
  const progress = progressResult.results.map((row) => ({
    projectId: row.project_id,
    shotId: row.shot_id,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  }));
  return json({ projects, progress, unreadableCount });
}

async function routeApi(request: Request, env: Env): Promise<Response> {
  const user = requireUser(request);
  if (user instanceof Response) return user;
  const segments = new URL(request.url).pathname.split('/').filter(Boolean);

  if (segments.length === 2 && segments[0] === 'api' && segments[1] === 'projects') {
    if (request.method === 'GET') return listProjects(env, user);
    if (request.method === 'POST') {
      if (!mutationAllowed(request)) return json({ error: '拒绝跨站或非 JSON 写入。' }, 403);
      return saveProject(env, user, await readPayload(request), true);
    }
  }

  if (segments.length >= 3 && segments[0] === 'api' && segments[1] === 'projects') {
    const projectId = decodeURIComponent(segments[2]);
    if (segments.length === 3) {
      if (request.method === 'GET') {
        const project = await readProject(env, user, projectId);
        if (!project) return json({ error: '项目不存在。' }, 404);
        const rows = await env.DB.prepare(
          'SELECT shot_id FROM shot_progress WHERE user_id = ?1 AND project_id = ?2 ORDER BY shot_id',
        ).bind(user, projectId).all<{ shot_id: string }>();
        return json({ project, completedShotIds: rows.results.map((row) => row.shot_id) });
      }
      if (request.method === 'PUT') {
        if (!mutationAllowed(request)) return json({ error: '拒绝跨站或非 JSON 写入。' }, 403);
        const payload = await readPayload(request);
        if (payload.project.projectId !== projectId) return json({ error: '路径与项目 ID 不一致。' }, 400);
        return saveProject(env, user, payload, false);
      }
      if (request.method === 'DELETE') {
        if (!mutationAllowed(request)) return json({ error: '拒绝跨站或非 JSON 写入。' }, 403);
        await env.DB.batch([
          env.DB.prepare('DELETE FROM shot_progress WHERE user_id = ?1 AND project_id = ?2').bind(user, projectId),
          env.DB.prepare('DELETE FROM projects WHERE user_id = ?1 AND project_id = ?2').bind(user, projectId),
        ]);
        return json({ deleted: true });
      }
    }

    if (segments.length === 4 && segments[3] === 'progress' && request.method === 'PUT') {
      if (!mutationAllowed(request)) return json({ error: '拒绝跨站或非 JSON 写入。' }, 403);
      const project = await readProject(env, user, projectId);
      if (!project) return json({ error: '项目不存在。' }, 404);
      const completedShotIds = await readProgressPayload(request, project);
      await replaceProgress(env, user, projectId, completedShotIds);
      return json({ completedShotIds });
    }
  }

  return json({ error: 'API 路由不存在。' }, 404);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      if (!url.pathname.startsWith('/api/')) return new Response(null, { status: 404 });
      return await routeApi(request, env);
    } catch (error) {
      const message = error instanceof Error ? error.message : '远程数据库请求失败。';
      const isInputError = error instanceof InputError || error instanceof SyntaxError || (typeof error === 'object' && error !== null && 'issues' in error);
      return json({ error: message }, isInputError ? 400 : 500);
    }
  },
} satisfies ExportedHandler<Env>;
