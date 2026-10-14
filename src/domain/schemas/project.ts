import { z } from 'zod';

const httpsUrlSchema = z
  .url()
  .refine((value) => new URL(value).protocol === 'https:', '只允许 HTTPS 链接');

export const referenceImageSchema = z
  .object({
    caption: z.string().trim().min(1),
    url: httpsUrlSchema,
    sourceUrl: httpsUrlSchema,
    author: z.string().trim().min(1),
    license: z.string().trim().min(1),
  })
  .strict();

export const shotSchema = z
  .object({
    id: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    clipCount: z.number().int().min(1).max(20),
    recordSeconds: z.number().int().min(1).max(180),
    priority: z.enum(['must', 'normal', 'optional']),
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
    referenceImages: z.array(referenceImageSchema),
  })
  .strict();

export const vlogProjectSchema = z
  .object({
    schemaVersion: z.literal(1),
    promptVersion: z.string().trim().min(1),
    projectId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    destination: z.string().trim().min(1),
    shootDate: z.string().trim().min(1),
    shootWindow: z.string().trim().min(1),
    camera: z.string().trim().min(1),
    orientation: z.enum(['landscape', 'portrait']),
    videoResolution: z.string().trim().min(1),
    targetVideoMinutes: z.number().positive().max(60),
    stylePresetId: z.string().trim().min(1),
    notes: z.array(z.string().trim().min(1)),
    editingTimeline: z.array(z.tuple([z.string().trim().min(1), z.string().trim().min(1)])).min(1),
    sections: z.array(shootingSectionSchema).min(1),
    needsVerification: z.array(z.string()).optional(),
  })
  .strict()
  .superRefine((project, context) => {
    const sectionIds = new Set<string>();
    const shotIds = new Set<string>();

    project.sections.forEach((section, sectionIndex) => {
      if (sectionIds.has(section.id)) {
        context.addIssue({
          code: 'custom',
          message: '分段 ID 必须唯一',
          path: ['sections', sectionIndex, 'id'],
        });
      }
      sectionIds.add(section.id);

      section.shots.forEach((shot, shotIndex) => {
        if (shotIds.has(shot.id)) {
          context.addIssue({
            code: 'custom',
            message: '镜头 ID 必须在项目内唯一',
            path: ['sections', sectionIndex, 'shots', shotIndex, 'id'],
          });
        }
        shotIds.add(shot.id);
      });
    });
  });

export const progressExportSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('tabiframe-shot-progress'),
    projectId: z.string().trim().min(1),
    exportedAt: z.string().datetime(),
    completedShotIds: z.array(z.string().trim().min(1)),
  })
  .strict()
  .superRefine((progress, context) => {
    if (new Set(progress.completedShotIds).size !== progress.completedShotIds.length) {
      context.addIssue({
        code: 'custom',
        message: '完成镜头 ID 不得重复',
        path: ['completedShotIds'],
      });
    }
  });

export type VlogProject = z.infer<typeof vlogProjectSchema>;
export type ShootingSection = z.infer<typeof shootingSectionSchema>;
export type Shot = z.infer<typeof shotSchema>;
export type ReferenceImage = z.infer<typeof referenceImageSchema>;
export type ProgressExport = z.infer<typeof progressExportSchema>;
