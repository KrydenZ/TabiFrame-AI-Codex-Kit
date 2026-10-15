import { beforeEach } from 'vitest';
import { db } from '../src/db/database';
import { createProjectBackup, ensureSeedProjects, importProjectBackup } from '../src/db/projects';
import { naritaProject } from '../src/fixtures/projects';

beforeEach(async () => {
  await db.shotProgress.clear();
  await db.projects.clear();
  await ensureSeedProjects();
});

describe('project backup restore', () => {
  it('creates an isolated restored project when the id already exists', async () => {
    const backup = createProjectBackup(naritaProject, ['10']);
    const result = await importProjectBackup(backup);

    expect(result.collisionRemapped).toBe(true);
    expect(result.project.projectId).toBe('narita-2026-10-10-restored-1');
    expect(await db.projects.count()).toBe(3);
    expect(await db.shotProgress.where('projectId').equals(result.project.projectId).toArray())
      .toMatchObject([{ shotId: '10' }]);
  });

  it('rejects unknown progress ids without writing a partial project', async () => {
    const backup = { ...createProjectBackup(naritaProject, []), completedShotIds: ['missing-shot'] };
    await expect(importProjectBackup(backup)).rejects.toThrow();
    expect(await db.projects.count()).toBe(2);
  });
});
