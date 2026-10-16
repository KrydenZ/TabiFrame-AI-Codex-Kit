import naritaProjectJson from '../../examples/narita.project.json';
import yokohamaLineProjectJson from '../../examples/yokohama-line-2026-10-17.project.json';
import { vlogProjectSchema, type VlogProject } from '../domain/schemas/project';

export const naritaProject = vlogProjectSchema.parse(naritaProjectJson);
export const yokohamaLineProject = vlogProjectSchema.parse(yokohamaLineProjectJson);

export const seedProjects: readonly VlogProject[] = [naritaProject, yokohamaLineProject];
