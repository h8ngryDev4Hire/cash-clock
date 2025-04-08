/**
 * Database schema definitions for Cash Clock app
 * These schemas define the structure of the SQLite database tables
 */

/**
 * Project schema
 * Projects are used to group related tasks
 */
export const PROJECT_SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  item_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created INTEGER NOT NULL,
  last_updated INTEGER NOT NULL
);
`;

/**
 * Task schema
 * Tasks represent activities that can be timed
 */
export const TASK_SCHEMA = `
CREATE TABLE IF NOT EXISTS tasks (
  item_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_running INTEGER NOT NULL DEFAULT 0,
  is_grouped INTEGER NOT NULL DEFAULT 0,
  is_completed INTEGER NOT NULL DEFAULT 0,
  project_id TEXT,
  created INTEGER NOT NULL,
  last_updated INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects (item_id) ON DELETE SET NULL
);
`;

/**
 * TimeEntry schema
 * TimeEntries represent individual sessions of time tracking for a task
 */
export const TIME_ENTRY_SCHEMA = `
CREATE TABLE IF NOT EXISTS time_entries (
  item_id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  is_running INTEGER NOT NULL DEFAULT 0,
  time_spent INTEGER NOT NULL DEFAULT 0, /* in seconds */
  time_started INTEGER NOT NULL, /* timestamp */
  time_ended INTEGER, /* timestamp, null when timer is running */
  created INTEGER NOT NULL,
  last_updated INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks (item_id) ON DELETE CASCADE
);
`;

/**
 * Settings schema
 * App settings and user preferences
 */
export const SETTINGS_SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created INTEGER NOT NULL,
  last_updated INTEGER NOT NULL
);
`;

/**
 * Export all schemas
 */
export const ALL_SCHEMAS = [
  PROJECT_SCHEMA,
  TASK_SCHEMA,
  TIME_ENTRY_SCHEMA,
  SETTINGS_SCHEMA
];

/**
 * Helper function to create all tables
 */
export const createAllTables = async (executeSql: (query: string, params?: any[]) => Promise<any>) => {
  for (const schema of ALL_SCHEMAS) {
    await executeSql(schema);
  }
};

/**
 * Get mapping of table names to their schema definitions
 */
export function getSchemaDefinitions(): Record<string, string> {
  return {
    'projects': PROJECT_SCHEMA,
    'tasks': TASK_SCHEMA,
    'time_entries': TIME_ENTRY_SCHEMA,
    'settings': SETTINGS_SCHEMA
  };
}