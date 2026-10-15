import Dexie, { type EntityTable } from 'dexie';
import type { VlogProject } from '../domain/schemas/project';

export interface ShotProgressRecord {
  key: string;
  projectId: string;
  shotId: string;
  completedAt: string;
  updatedAt: string;
}

class TabiFrameDatabase extends Dexie {
  projects!: EntityTable<VlogProject, 'projectId'>;
  shotProgress!: EntityTable<ShotProgressRecord, 'key'>;

  constructor() {
    super('tabiframe-ai');
    this.version(1).stores({ shotProgress: '&key, projectId, shotId, updatedAt' });
    this.version(2).stores({
      projects: '&projectId, destination, sourceKind, updatedAt',
      shotProgress: '&key, projectId, shotId, updatedAt',
    });
  }
}

export const db = new TabiFrameDatabase();

export function progressKey(projectId: string, shotId: string): string {
  return projectId + ':' + shotId;
}
