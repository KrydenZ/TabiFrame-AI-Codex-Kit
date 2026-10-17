import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { beforeEach, vi } from 'vitest';

const remoteProgress = new Map<string, Set<string>>();

beforeEach(() => {
  remoteProgress.clear();
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) as Record<string, unknown> : {};
    if (method === 'GET') return new Response(JSON.stringify({ projects: [], progress: [], unreadableCount: 0 }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (method === 'DELETE') return new Response(JSON.stringify({ deleted: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    if ('project' in body) return new Response(JSON.stringify({ project: body.project }), { status: 200, headers: { 'content-type': 'application/json' } });
    const path = String(input);
    const projectId = decodeURIComponent(path.split('/api/projects/')[1]?.split('/')[0] ?? 'test-project');
    if (method === 'PATCH') {
      const ids = remoteProgress.get(projectId) ?? new Set<string>();
      if (body.completed) ids.add(String(body.shotId)); else ids.delete(String(body.shotId));
      remoteProgress.set(projectId, ids);
      return new Response(JSON.stringify({ completedShotIds: [...ids] }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const values = Array.isArray(body.completedShotIds) ? body.completedShotIds.map(String) : [];
    remoteProgress.set(projectId, new Set(values));
    return new Response(JSON.stringify({ completedShotIds: values }), { status: 200, headers: { 'content-type': 'application/json' } });
  }));
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});
