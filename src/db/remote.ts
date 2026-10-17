import type { ShotProgressRecord } from './database';
import { vlogProjectSchema, type VlogProject } from '../domain/schemas/project';

export interface RemoteSnapshot {
  projects: VlogProject[];
  progress: ShotProgressRecord[];
  unreadableCount: number;
}

export interface RemoteProjectSnapshot {
  project: VlogProject;
  completedShotIds: string[];
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers: init?.body ? { 'content-type': 'application/json', ...init.headers } : init?.headers,
  });
  const value = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(value.error ?? `远程服务返回 ${response.status}`);
  return value;
}

export async function fetchRemoteSnapshot(): Promise<RemoteSnapshot> {
  const value = await requestJson<{
    projects: unknown[];
    progress: Array<Omit<ShotProgressRecord, 'key'>>;
    unreadableCount?: number;
  }>('/api/projects');
  const projects = value.projects.map((project) => vlogProjectSchema.parse(project));
  const validIds = new Set(projects.map((project) => project.projectId));
  const progress = value.progress
    .filter((record) => validIds.has(record.projectId))
    .map((record) => ({ ...record, key: `${record.projectId}:${record.shotId}` }));
  return { projects, progress, unreadableCount: value.unreadableCount ?? 0 };
}

export async function createRemoteProject(project: VlogProject, completedShotIds: readonly string[]): Promise<VlogProject> {
  const value = await requestJson<{ project: unknown }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ project, completedShotIds }),
  });
  return vlogProjectSchema.parse(value.project);
}

export async function putRemoteProject(project: VlogProject, completedShotIds: readonly string[]): Promise<VlogProject> {
  const value = await requestJson<{ project: unknown }>(`/api/projects/${encodeURIComponent(project.projectId)}`, {
    method: 'PUT',
    body: JSON.stringify({ project, completedShotIds, expectedUpdatedAt: project.updatedAt }),
  });
  return vlogProjectSchema.parse(value.project);
}

export async function fetchRemoteProject(projectId: string): Promise<RemoteProjectSnapshot> {
  const value = await requestJson<{ project: unknown; completedShotIds: unknown }>(`/api/projects/${encodeURIComponent(projectId)}`);
  const project = vlogProjectSchema.parse(value.project);
  const knownIds = new Set(project.sections.flatMap((section) => section.shots.map((shot) => shot.id)));
  const completedShotIds = Array.isArray(value.completedShotIds)
    ? value.completedShotIds.filter((id): id is string => typeof id === 'string' && knownIds.has(id))
    : [];
  return { project, completedShotIds };
}

export async function patchRemoteProgress(projectId: string, shotId: string, completed: boolean): Promise<string[]> {
  const value = await requestJson<{ completedShotIds: unknown }>(`/api/projects/${encodeURIComponent(projectId)}/progress`, {
    method: 'PATCH',
    body: JSON.stringify({ shotId, completed }),
  });
  return Array.isArray(value.completedShotIds)
    ? value.completedShotIds.filter((id): id is string => typeof id === 'string')
    : [];
}

export async function putRemoteProgress(projectId: string, completedShotIds: readonly string[]): Promise<void> {
  await requestJson(`/api/projects/${encodeURIComponent(projectId)}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ completedShotIds }),
  });
}

export async function deleteRemoteProject(projectId: string): Promise<void> {
  await requestJson(`/api/projects/${encodeURIComponent(projectId)}`, {
    method: 'DELETE',
    body: '{}',
  });
}
