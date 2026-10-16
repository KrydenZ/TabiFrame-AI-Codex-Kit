import naritaProjectJson from '../../examples/narita.project.json';
import minatomiraiLineProjectJson from '../../examples/minatomirai-line-2026-10-17.project.json';
import { vlogProjectSchema, type VlogProject } from '../domain/schemas/project';

export const naritaProject = vlogProjectSchema.parse(naritaProjectJson);
export const minatomiraiLineProject = vlogProjectSchema.parse(minatomiraiLineProjectJson);

export const seedProjects: readonly VlogProject[] = [naritaProject, minatomiraiLineProject];
