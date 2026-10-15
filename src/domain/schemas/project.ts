import { z } from 'zod';

const httpsUrlSchema = z
  .url()
  .refine((value) => new URL(value).protocol === 'https:', '只允许 HTTPS 链接');

export const sourceKindSchema = z.enum(['reference', 'demo', 'imported', 'generated']);

export const referenceImageSchema = z
  .object({
    caption: z.string().trim().min(1),
    url: httpsUrlSchema,
    sourceUrl: httpsUrlSchema,
    author: z.string().trim().min(1),
    license: z.string().trim().min(1),
  })
  .strict();

export const factCheckSchema = z
  .object({
    text: z.string().trim().min(1),
    status: z.enum(['verified', 'needs-check']),
    sourceUrl: httpsUrlSchema.optional(),
    checkedAt: z.string().datetime().optional(),
  })
  .strict();

export const shotSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    clipCount: z.number().int().min(1).max(20),
    recordSeconds: z.number().int().min(1).max(180),
    priority: z.enum(['must', 'normal', 'optional']).default('normal'),
    completed: z.boolean().default(false),
    shotSize: z.enum(['wide', 'medium', 'closeup', 'detail']).optional(),
    movement: z.enum(['static', 'walk', 'pan', 'tilt', 'push']).optional(),
  })
  .strict();

export const shootingSectionSchema = z
  .object({
    id: z.string().trim().min(1),
    time: z.string().trim().min(1),
    title: z.string().trim().min(1),
    subtitle: z.string().trim().min(1),
    tip: z.string().trim().min(1),
    shots: z.array(shotSchema).min(1),
    referenceImages: z.array(referenceImageSchema).default([]),
    factChecks: z.array(factCheckSchema).default([]),
  })
  .strict();

export const vlogProjectSchema = z
  .object({
    schemaVersion: z.literal(1),
    promptVersion: z.string().trim().min(1).default('prototype-v2.1'),
    projectId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    destination: z.string().trim().min(1),
    shootDate: z.string().trim().default(''),
    season: z.string().trim().optional(),
    shootWindow: z.string().trim().min(1),
    origin: z.string().trim().optional(),
    endLocation: z.string().trim().optional(),
    camera: z.string().trim().default(''),
    orientation: z.enum(['landscape', 'portrait']).default('landscape'),
    videoResolution: z.string().trim().default(''),
    targetVideoMinutes: z.number().positive().max(60),
    stylePresetId: z.literal('japan-solo-walk').default('japan-solo-walk'),
    sourceKind: sourceKindSchema.default('imported'),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    notes: z.array(z.string().trim().min(1)).default([]),
    editingTimeline: z.array(z.tuple([z.string().trim().min(1), z.string().trim().min(1)])).min(1),
    sections: z.array(shootingSectionSchema).min(1),
    needsVerification: z.array(z.string().trim().min(1)).default([]),
  })
  .strict()
  .superRefine((project, context) => {
    const sectionIds = new Set<string>();
    const shotIds = new Set<string>();

    project.sections.forEach((section, sectionIndex) => {
      if (sectionIds.has(section.id)) {
        context.addIssue({ code: 'custom', message: '分段 ID 必须唯一', path: ['sections', sectionIndex, 'id'] });
      }
      sectionIds.add(section.id);

      section.shots.forEach((shot, shotIndex) => {
        if (shotIds.has(shot.id)) {
          context.addIssue({ code: 'custom', message: '镜头 ID 必须在项目内唯一', path: ['sections', sectionIndex, 'shots', shotIndex, 'id'] });
        }
        shotIds.add(shot.id);
      });
    });
  });

export const projectBackupSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('tabiframe-project-backup'),
    exportedAt: z.string().datetime(),
    templateRef: z.literal('jianying-rules-draft-v2.1'),
    project: vlogProjectSchema,
    completedShotIds: z.array(z.string().trim().min(1)),
  })
  .strict()
  .superRefine((backup, context) => {
    const completed = new Set(backup.completedShotIds);
    if (completed.size !== backup.completedShotIds.length) {
      context.addIssue({ code: 'custom', message: '完成镜头 ID 不得重复', path: ['completedShotIds'] });
    }
    const valid = new Set(backup.project.sections.flatMap((section) => section.shots.map((shot) => shot.id)));
    backup.completedShotIds.forEach((id, index) => {
      if (!valid.has(id)) context.addIssue({ code: 'custom', message: '备份包含未知镜头 ID', path: ['completedShotIds', index] });
    });
  });

export type VlogProject = z.infer<typeof vlogProjectSchema>;
export type ShootingSection = z.infer<typeof shootingSectionSchema>;
export type Shot = z.infer<typeof shotSchema>;
export type ReferenceImage = z.infer<typeof referenceImageSchema>;
export type ProjectBackup = z.infer<typeof projectBackupSchema>;
