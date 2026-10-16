import { db, progressKey, type ShotProgressRecord } from './database';
import { seedProjects } from '../fixtures/projects';
import { projectBackupSchema, vlogProjectSchema, type ProjectBackup, type VlogProject } from '../domain/schemas/project';
import { createRemoteProject, deleteRemoteProject, fetchRemoteSnapshot, putRemoteProgress, putRemoteProject } from './remote';

const REMOTE_MIGRATION_KEY = 'tabiframe-remote-migration-v1';
const CONTENT_REFRESH_KEY = 'tabiframe-content-refresh-2026-10-17-v2';
const FEATURED_PROJECT_ID = 'minatomirai-line-2026-10-17';
const RETIRED_PROJECT_IDS = new Set(['kamakura-demo', 'yokohama-line-2026-10-17']);

function nowIso(): string {
  return new Date().toISOString();
}

function withTimestamps(project: VlogProject): VlogProject {
  const now = nowIso();
  return { ...project, createdAt: project.createdAt ?? now, updatedAt: project.updatedAt ?? now };
}

export async function ensureSeedProjects(): Promise<void> {
  await db.transaction('rw', db.projects, async () => {
    for (const project of seedProjects) {
      if (!(await db.projects.get(project.projectId))) await db.projects.add(withTimestamps(project));
    }
  });
}

export async function saveProject(input: unknown): Promise<VlogProject> {
  const parsed = vlogProjectSchema.parse(input);
  const existing = await db.projects.get(parsed.projectId);
  const project = { ...parsed, createdAt: existing?.createdAt ?? parsed.createdAt ?? nowIso(), updatedAt: nowIso() };
  const completedShotIds = (await db.shotProgress.where('projectId').equals(project.projectId).toArray()).map((item) => item.shotId);
  const remoteProject = await putRemoteProject(project, completedShotIds);
  await db.projects.put(remoteProject);
  return remoteProject;
}

export async function importGeneratedProject(input: unknown): Promise<ImportBackupResult> {
  const parsed = vlogProjectSchema.parse(input);
  const ids = new Set(await db.projects.toCollection().primaryKeys() as string[]);
  const projectId = restoredId(parsed.projectId, ids);
  const collisionRemapped = projectId !== parsed.projectId;
  const now = nowIso();
  const project = vlogProjectSchema.parse({
    ...parsed,
    projectId,
    title: collisionRemapped ? parsed.title + '（导入副本）' : parsed.title,
    sourceKind: 'imported',
    createdAt: now,
    updatedAt: now,
  });
  const remoteProject = await createRemoteProject(project, []);
  await db.projects.add(remoteProject);
  return { project: remoteProject, collisionRemapped };
}

export function createProjectBackup(project: VlogProject, completedShotIds: readonly string[]): ProjectBackup {
  return projectBackupSchema.parse({
    schemaVersion: 1,
    kind: 'tabiframe-project-backup',
    exportedAt: nowIso(),
    templateRef: 'jianying-rules-draft-v2.1',
    project,
    completedShotIds: [...completedShotIds],
  });
}

function restoredId(originalId: string, existingIds: ReadonlySet<string>): string {
  if (!existingIds.has(originalId)) return originalId;
  const base = originalId + '-restored';
  let index = 1;
  while (existingIds.has(base + '-' + index)) index += 1;
  return base + '-' + index;
}

export interface ImportBackupResult {
  project: VlogProject;
  collisionRemapped: boolean;
}

export async function importProjectBackup(input: unknown): Promise<ImportBackupResult> {
  const backup = projectBackupSchema.parse(input);
  const ids = new Set(await db.projects.toCollection().primaryKeys() as string[]);
  const projectId = restoredId(backup.project.projectId, ids);
  const collisionRemapped = projectId !== backup.project.projectId;
  const now = nowIso();
  const project = vlogProjectSchema.parse({
    ...backup.project,
    projectId,
    title: collisionRemapped ? backup.project.title + '（恢复副本）' : backup.project.title,
    sourceKind: 'imported',
    createdAt: now,
    updatedAt: now,
  });
  const records: ShotProgressRecord[] = backup.completedShotIds.map((shotId) => ({
    key: progressKey(projectId, shotId), projectId, shotId, completedAt: now, updatedAt: now,
  }));

  const remoteProject = await createRemoteProject(project, backup.completedShotIds);
  await db.transaction('rw', db.projects, db.shotProgress, async () => {
    await db.projects.add(remoteProject);
    if (records.length) await db.shotProgress.bulkAdd(records);
  });
  return { project: remoteProject, collisionRemapped };
}

export async function deleteProject(projectId: string): Promise<void> {
  await deleteRemoteProject(projectId);
  await db.transaction('rw', db.projects, db.shotProgress, async () => {
    await db.shotProgress.where('projectId').equals(projectId).delete();
    await db.projects.delete(projectId);
  });
}

export async function syncRemoteProjects(): Promise<{ migratedCount: number; unreadableCount: number }> {
  const localProjects = (await db.projects.toArray()).flatMap((row) => {
    const parsed = vlogProjectSchema.safeParse(row);
    return parsed.success && !RETIRED_PROJECT_IDS.has(parsed.data.projectId) ? [parsed.data] : [];
  });
  const localProgress = (await db.shotProgress.toArray())
    .filter((record) => !RETIRED_PROJECT_IDS.has(record.projectId));
  let remote = await fetchRemoteSnapshot();
  let migratedCount = 0;

  const retiredRemoteIds = remote.projects
    .map((project) => project.projectId)
    .filter((projectId) => RETIRED_PROJECT_IDS.has(projectId));
  for (const projectId of retiredRemoteIds) await deleteRemoteProject(projectId);
  if (retiredRemoteIds.length) remote = await fetchRemoteSnapshot();

  const contentRefreshPending = window.localStorage.getItem(CONTENT_REFRESH_KEY) !== 'done';
  if (contentRefreshPending) {
    const naritaSeed = seedProjects.find((project) => project.projectId === 'narita-2026-10-10');
    const remoteNarita = remote.projects.find((project) => project.projectId === 'narita-2026-10-10');
    const naritaNeedsRefresh = remoteNarita?.sections
      .flatMap((section) => section.shots)
      .some((shot) => shot.title === '食物' || shot.title === '茶杯 / 休息');
    if (naritaSeed && remoteNarita && naritaNeedsRefresh) {
      const completedShotIds = remote.progress
        .filter((record) => record.projectId === remoteNarita.projectId)
        .map((record) => record.shotId);
      await putRemoteProject({
        ...naritaSeed,
        createdAt: remoteNarita.createdAt,
        updatedAt: remoteNarita.updatedAt,
      }, completedShotIds);
      remote = await fetchRemoteSnapshot();
    }

    const featuredProject = seedProjects.find((project) => project.projectId === FEATURED_PROJECT_ID);
    if (featuredProject && !remote.projects.some((project) => project.projectId === FEATURED_PROJECT_ID)) {
      await putRemoteProject(withTimestamps(featuredProject), []);
      migratedCount += 1;
      remote = await fetchRemoteSnapshot();
    }
    window.localStorage.setItem(CONTENT_REFRESH_KEY, 'done');
  }

  const migrationPending = window.localStorage.getItem(REMOTE_MIGRATION_KEY) !== 'done';

  if (migrationPending) {
    const remoteById = new Map(remote.projects.map((project) => [project.projectId, project]));
    const remoteProgressByProject = new Map<string, Set<string>>();
    for (const record of remote.progress) {
      const ids = remoteProgressByProject.get(record.projectId) ?? new Set<string>();
      ids.add(record.shotId);
      remoteProgressByProject.set(record.projectId, ids);
    }
    const candidates = localProjects.length ? localProjects : remote.projects.length ? [] : seedProjects.map(withTimestamps);
    for (const project of candidates) {
      const localIds = localProgress.filter((item) => item.projectId === project.projectId).map((item) => item.shotId);
      const remoteProject = remoteById.get(project.projectId);
      if (!remoteProject) {
        await putRemoteProject(project, localIds);
        migratedCount += 1;
        continue;
      }
      const merged = new Set([...(remoteProgressByProject.get(project.projectId) ?? []), ...localIds]);
      if (merged.size !== (remoteProgressByProject.get(project.projectId)?.size ?? 0)) {
        await putRemoteProgress(project.projectId, [...merged]);
      }
    }
    window.localStorage.setItem(REMOTE_MIGRATION_KEY, 'done');
    remote = await fetchRemoteSnapshot();
  }

  await db.transaction('rw', db.projects, db.shotProgress, async () => {
    await db.projects.clear();
    await db.shotProgress.clear();
    if (remote.projects.length) await db.projects.bulkPut(remote.projects);
    if (remote.progress.length) await db.shotProgress.bulkPut(remote.progress);
  });
  return { migratedCount, unreadableCount: remote.unreadableCount };
}

export function formatValidationError(error: unknown): string {
  if (error && typeof error === 'object' && 'issues' in error) {
    const issues = (error as { issues?: Array<{ path?: PropertyKey[]; message?: string }> }).issues ?? [];
    return issues.slice(0, 4).map((issue) => {
      const path = issue.path?.length ? issue.path.join('.') + '：' : '';
      return path + (issue.message ?? '字段无效');
    }).join('；');
  }
  return error instanceof Error ? error.message : 'JSON 格式不正确';
}
