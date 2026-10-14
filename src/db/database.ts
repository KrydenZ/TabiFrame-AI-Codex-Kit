import Dexie, { type EntityTable } from 'dexie';

export interface ShotProgressRecord {
  key: string;
  projectId: string;
  shotId: string;
  completedAt: string;
  updatedAt: string;
}

class TabiFrameDatabase extends Dexie {
  shotProgress!: EntityTable<ShotProgressRecord, 'key'>;

  constructor() {
    super('tabiframe-ai');
    this.version(1).stores({
      shotProgress: '&key, projectId, shotId, updatedAt',
    });
  }
}

export const db = new TabiFrameDatabase();

export function progressKey(projectId: string, shotId: string): string {
  return projectId + ':' + shotId;
}
