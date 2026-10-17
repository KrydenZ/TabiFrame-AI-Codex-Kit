import { z } from 'zod';

const httpsUrlSchema = z
  .url()
  .refine((value) => new URL(value).protocol === 'https:', '只允许 HTTPS 链接');

export const sourceKindSchema = z.enum(['reference', 'demo', 'imported', 'generated']);

export const routeMapStopSchema = z
  .object({
    id: z.string().trim().min(1),
    label: z.string().trim().min(1).max(40),
    detail: z.string().trim().max(80).default(''),
    lat: z.number().min(-85).max(85),
    lng: z.number().min(-180).max(180),
    sectionId: z.string().trim().min(1).optional(),
    modeToNext: z.enum(['rail', 'walk']).optional(),
  })
  .strict();

export const routeMapSchema = z
  .object({
    title: z.string().trim().min(1).max(80),
    summary: z.string().trim().min(1).max(240),
    zoom: z.number().int().min(2).max(18),
    stops: z.array(routeMapStopSchema).min(2).max(12),
  })
  .strict()
  .superRefine((routeMap, context) => {
    const ids = new Set<string>();
    routeMap.stops.forEach((stop, index) => {
      if (ids.has(stop.id)) context.addIssue({ code: 'custom', message: '地图地点 ID 必须唯一', path: ['stops', index, 'id'] });
      ids.add(stop.id);
    });
  });

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
  .strict()
  .superRefine((fact, context) => {
    if (fact.status === 'verified' && (!fact.sourceUrl || !fact.checkedAt)) {
      context.addIssue({
        code: 'custom',
        message: '标记为已核实的事实必须同时提供 HTTPS 来源和核实时间',
      });
    }
  });

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
    travelState: z.enum(['planned', 'visited']).default('planned'),
    travelReflection: z.string().trim().max(2000).default(''),
    tags: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
    routeMap: routeMapSchema.optional(),
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

    project.routeMap?.stops.forEach((stop, stopIndex) => {
      if (stop.sectionId && !sectionIds.has(stop.sectionId)) {
        context.addIssue({ code: 'custom', message: '地图地点必须关联到项目内已有的路线步骤', path: ['routeMap', 'stops', stopIndex, 'sectionId'] });
      }
    });
  });

export const projectBackupSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.literal('tabiframe-project-backup'),
    exportedAt: z.string().datetime(),
    templateRef: z.enum(['jianying-rules-draft-v2.1', 'jianying-series-confirmed-v1']),
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
export type RouteMap = z.infer<typeof routeMapSchema>;
export type RouteMapStop = z.infer<typeof routeMapStopSchema>;
export type ProjectBackup = z.infer<typeof projectBackupSchema>;
