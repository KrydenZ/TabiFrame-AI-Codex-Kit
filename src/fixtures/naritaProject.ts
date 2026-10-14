import naritaProjectJson from '../../examples/narita.project.json';
import { vlogProjectSchema } from '../domain/schemas/project';

export const naritaProject = vlogProjectSchema.parse(naritaProjectJson);
