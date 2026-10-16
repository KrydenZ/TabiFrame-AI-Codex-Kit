import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) as Record<string, unknown> : {};
    if (method === 'GET') return new Response(JSON.stringify({ projects: [], progress: [], unreadableCount: 0 }), { status: 200, headers: { 'content-type': 'application/json' } });
    if (method === 'DELETE') return new Response(JSON.stringify({ deleted: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    if ('project' in body) return new Response(JSON.stringify({ project: body.project }), { status: 200, headers: { 'content-type': 'application/json' } });
    return new Response(JSON.stringify({ completedShotIds: body.completedShotIds ?? [] }), { status: 200, headers: { 'content-type': 'application/json' } });
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
