import { db, progressKey, type ShotProgressRecord } from './database';
import { seedProjects } from '../fixtures/projects';
import { projectBackupSchema, vlogProjectSchema, type ProjectBackup, type VlogProject } from '../domain/schemas/project';

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
  await db.projects.put(project);
  return project;
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
  await db.projects.add(project);
  return { project, collisionRemapped };
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

  await db.transaction('rw', db.projects, db.shotProgress, async () => {
    await db.projects.add(project);
    if (records.length) await db.shotProgress.bulkAdd(records);
  });
  return { project, collisionRemapped };
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
