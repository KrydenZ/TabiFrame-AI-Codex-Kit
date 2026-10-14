import naritaJson from '../examples/narita.project.json';
import { calculateProgress, getAllShots } from '../src/domain/progress';
import { vlogProjectSchema } from '../src/domain/schemas/project';

describe('Narita fixture', () => {
  const project = vlogProjectSchema.parse(naritaJson);
  const shots = getAllShots(project);

  it('keeps all groups, clips, sections and credited reference images', () => {
    expect(project.sections).toHaveLength(5);
    expect(shots).toHaveLength(38);
    expect(shots.reduce((sum, shot) => sum + shot.clipCount, 0)).toBe(67);
    expect(project.sections.flatMap((section) => section.referenceImages)).toHaveLength(5);
    expect(new Set(shots.map((shot) => shot.id)).size).toBe(38);
  });

  it('reports shot 10 as one group and three clips', () => {
    const result = calculateProgress(project, new Set(['10']));
    expect(result).toMatchObject({
      completedGroups: 1,
      totalGroups: 38,
      completedClips: 3,
      totalClips: 67,
    });
  });

  it('reports full completion as 38 groups and 67 clips', () => {
    const result = calculateProgress(project, new Set(shots.map((shot) => shot.id)));
    expect(result.completedGroups).toBe(38);
    expect(result.completedClips).toBe(67);
    expect(result.percentage).toBe(100);
  });

  it('rejects duplicate shot ids', () => {
    const invalid = structuredClone(naritaJson);
    invalid.sections[1].shots[0].id = '01';
    const result = vlogProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
