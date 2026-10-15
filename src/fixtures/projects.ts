import kamakuraProjectJson from '../../examples/kamakura-demo.project.json';
import naritaProjectJson from '../../examples/narita.project.json';
import { vlogProjectSchema, type VlogProject } from '../domain/schemas/project';

export const naritaProject = vlogProjectSchema.parse(naritaProjectJson);
export const kamakuraDemoProject = vlogProjectSchema.parse(kamakuraProjectJson);

export const seedProjects: readonly VlogProject[] = [naritaProject, kamakuraDemoProject];
