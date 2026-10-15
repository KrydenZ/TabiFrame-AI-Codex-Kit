import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { vlogProjectSchema } from '../domain/schemas/project';

export function useProject(projectId: string | undefined) {
  return useLiveQuery(async () => {
    const raw = projectId ? await db.projects.get(projectId) : undefined;
    if (!raw) return undefined;
    const parsed = vlogProjectSchema.safeParse(raw);
    return parsed.success ? parsed.data : undefined;
  }, [projectId], null);
}
