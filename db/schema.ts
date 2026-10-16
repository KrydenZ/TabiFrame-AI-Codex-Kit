import { index, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const remoteProjects = sqliteTable('projects', {
  userId: text('user_id').notNull(),
  projectId: text('project_id').notNull(),
  projectJson: text('project_json').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.projectId] }),
  index('projects_user_updated_idx').on(table.userId, table.updatedAt),
]);

export const remoteShotProgress = sqliteTable('shot_progress', {
  userId: text('user_id').notNull(),
  projectId: text('project_id').notNull(),
  shotId: text('shot_id').notNull(),
  completedAt: text('completed_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.projectId, table.shotId] }),
  index('shot_progress_user_project_idx').on(table.userId, table.projectId),
]);
