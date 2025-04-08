import _ from 'lodash';
import { errorService } from '../error/ErrorService';
import { ErrorLevel } from '@def/error';
import { PROJECT_SCHEMA, TASK_SCHEMA, TIME_ENTRY_SCHEMA, SETTINGS_SCHEMA } from './schema';
import type { StorageService } from '../storage/StorageService';
import { log } from '@lib/util/debugging/logging';

interface ColumnDefinition {
  name: string;
  type: string;
  notNull: boolean;
  primaryKey: boolean;
  defaultValue?: any;
}

interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
}

// SQLite types
interface SQLiteColumn {
  name: string;
  type: string;
  notnull: number;
  pk: number;
  dflt_value: any;
}

/**
 * MigrationService dynamically detects and applies schema changes
 * by comparing code-defined schemas with the actual database structure
 */
export class MigrationService {
  // Map entity names to their schema definitions
  private schemaDefinitions: Record<string, string> = {
    'projects': PROJECT_SCHEMA,
    'tasks': TASK_SCHEMA,
    'time_entries': TIME_ENTRY_SCHEMA,
    'settings': SETTINGS_SCHEMA
  };
  
  private isInitialized: boolean = false;
  private isMigrating: boolean = false; // Track whether migrations are in progress
  private storageService: StorageService;
  
  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  /**
   * Initializes migration tracking
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }
    
    try {
      // Create schema versions table if it doesn't exist
      await this.storageService.executeSql(`
        CREATE TABLE IF NOT EXISTS schema_versions (
          entity_name TEXT PRIMARY KEY,
          schema_hash TEXT NOT NULL,
          last_updated INTEGER NOT NULL
        );
      `, []);
      
      log('Initialized migration tracking', 'MigrationService', 'INFO');
      this.isInitialized = true;
      return true;
    } catch (error) {
      errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'MigrationService',
          operation: 'initialize'
        }
      );
      return false;
    }
  }

  /**
   * Analyzes and synchronizes all schemas
   */
  public async syncSchemas(): Promise<boolean> {
    // Prevent concurrent migrations
    if (this.isMigrating) {
      log('Migration already in progress, skipping duplicate call', 'MigrationService', 'DEBUG');
      return true;
    }
    
    this.isMigrating = true;
    
    try {
      // Initialize migration tracking
      const initialized = await this.initialize();
      if (!initialized) {
        this.isMigrating = false;
        return false; // Return false if initialization fails
      }
      
      let success = true;
      
      // Process each entity schema
      for (const [entityName, schemaDefinition] of Object.entries(this.schemaDefinitions)) {
        log('Checking schema for ' + entityName + '...', 'MigrationService', 'DEBUG');
        
        try {
          // Check if table exists first
          const tableExists = await this.tableExists(entityName);
          
          if (!tableExists) {
            log('Table ' + entityName + ' doesn\'t exist yet, skipping migration', 'MigrationService', 'VERBOSE');
            continue; // Skip migration for non-existent tables, they'll be created by the schema init
          }
          
          // Get current database structure for this table
          const dbSchema = await this.getTableSchema(entityName);
          
          if (!dbSchema) {
            log('Failed to get schema for ' + entityName, 'MigrationService', 'ERROR');
            success = false;
            continue;
          }
          
          // Parse schema definition to comparable format
          const codeSchema = this.parseSchemaDefinition(schemaDefinition, entityName);
          
          // Log the schemas for debugging
          log('Database schema for ' + entityName + ': ' + JSON.stringify(dbSchema.columns.map(c => c.name)), 'MigrationService', 'VERBOSE');
          log('Code schema for ' + entityName + ': ' + JSON.stringify(codeSchema.columns.map(c => c.name)), 'MigrationService', 'VERBOSE');
          
          // Generate schema hash for comparison
          const codeSchemaHash = this.generateSchemaHash(codeSchema);
          
          // Get stored schema version
          const storedVersion = await this.getStoredSchemaVersion(entityName);
          
          if (!storedVersion || storedVersion.schema_hash !== codeSchemaHash) {
            log('Schema changes detected for ' + entityName, 'MigrationService', 'INFO');
            
            // Table exists, determine what changes are needed
            const schemaChanges = this.detectSchemaChanges(dbSchema, codeSchema);
            
            if (schemaChanges.length > 0) {
              log('Found ' + schemaChanges.length + ' changes for ' + entityName + ': ' + 
                        JSON.stringify(schemaChanges.map(c => `${c.type} ${c.column}`)), 'MigrationService', 'INFO');
              
              // Apply schema changes
              const migrationSuccess = await this.applySchemaChanges(entityName, schemaChanges);
              
              if (!migrationSuccess) {
                log('Failed to migrate schema for ' + entityName, 'MigrationService', 'ERROR');
                success = false;
                continue;
              }
            } else {
              log('No changes to apply for ' + entityName, 'MigrationService', 'DEBUG');
            }
            
            try {
              // Update schema version record even if no changes (could be different hash calculation)
              await this.updateSchemaVersion(entityName, codeSchemaHash);
              log('Schema version for ' + entityName + ' updated successfully', 'MigrationService', 'INFO');
            } catch (versionError) {
              // If this fails, log it but don't fail the whole migration
              errorService.logError(
                versionError instanceof Error ? versionError : new Error(String(versionError)),
                ErrorLevel.WARNING,
                {
                  component: 'MigrationService',
                  operation: 'updateSchemaVersion',
                  entityType: entityName
                }
              );
              log('Warning: Unable to update schema version for ' + entityName, 'MigrationService', 'WARNING');
            }
          } else {
            log('Schema for ' + entityName + ' is up to date', 'MigrationService', 'DEBUG');
          }
        } catch (entityError) {
          // Log error but continue with other entities
          log('Error processing ' + entityName + ': ' + entityError, 'MigrationService', 'ERROR', { variableName: 'entityError', value: entityError });
          errorService.logError(
            entityError instanceof Error ? entityError : new Error(String(entityError)),
            ErrorLevel.ERROR,
            {
              component: 'MigrationService',
              operation: 'syncSchemas',
              entityType: entityName
            }
          );
          success = false;
        }
      }
      
      this.isMigrating = false;
      return success;
    } catch (error) {
      log('Error in syncSchemas: ' + error, 'MigrationService', 'ERROR', { variableName: 'error', value: error });
      errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'MigrationService',
          operation: 'syncSchemas'
        }
      );
      this.isMigrating = false;
      return false; // Always return false on error
    }
  }

  /**
   * Retrieves the current schema for a table from the database
   */
  private async getTableSchema(tableName: string): Promise<TableSchema | null> {
    try {
      // Make sure table exists
      const tableExists = await this.tableExists(tableName);
      if (!tableExists) {
        log('Table ' + tableName + ' doesn\'t exist, can\'t get schema', 'MigrationService', 'VERBOSE');
        return null;
      }
      
      // Try using the raw database object for more direct access if available
      if (this.storageService && (this.storageService as any).database) {
        try {
          log('Using direct database access for PRAGMA table_info(' + tableName + ')', 'MigrationService', 'VERBOSE');
          
          // Use the raw database object to get table info
          const db = (this.storageService as any).database;
          const columnData = db.getAllSync(`PRAGMA table_info(${tableName})`, []);
          
          if (columnData && columnData.length > 0) {
            log('Direct access found ' + columnData.length + ' columns for ' + tableName + ': ' + columnData.map((c: SQLiteColumn) => c.name).join(', '), 'MigrationService', 'VERBOSE');
            
            // Parse column information
            const columns = columnData.map((col: SQLiteColumn) => {
              return {
                name: col.name,
                type: col.type || 'TEXT',
                notNull: col.notnull === 1,
                primaryKey: col.pk === 1,
                defaultValue: col.dflt_value
              };
            });
            
            return {
              name: tableName,
              columns
            };
          }
        } catch (directError) {
          log('Error with direct database access: ' + directError, 'MigrationService', 'ERROR', { variableName: 'directError', value: directError });
          // Continue with standard approach
        }
      }
      
      // Standard PRAGMA approach as fallback
      log('Using standard PRAGMA table_info for ' + tableName, 'MigrationService', 'VERBOSE');
      const result = await this.storageService.executeSql(
        `PRAGMA table_info(${tableName})`, 
        []
      );
      
      log('PRAGMA result type: ' + typeof result + ', isArray: ' + Array.isArray(result), 'MigrationService', 'VERBOSE');
      
      // SQLite returns an array-like object with results
      // In expo-sqlite, the result format can vary; we need to handle multiple formats
      let columnData: SQLiteColumn[] = [];
      
      if (Array.isArray(result)) {
        columnData = result;
      } else if (result && typeof result === 'object' && 'rows' in result) {
        const rows = (result as any).rows;
        if (rows && typeof rows.length === 'number') {
          columnData = [];
          for (let i = 0; i < rows.length; i++) {
            columnData.push(rows.item(i));
          }
        }
      }
      
      log('Found ' + columnData.length + ' columns for ' + tableName + ' from PRAGMA: ' + columnData.map(c => c.name || 'unnamed').join(', '), 'MigrationService', 'VERBOSE');
      
      if (columnData.length === 0) {
        log('No columns found for ' + tableName + ' using PRAGMA, falling back to alternative method', 'MigrationService', 'DEBUG');
        
        // Try to get column names by querying the table structure differently
        try {
          const tempResult = await this.storageService.executeSql(
            `SELECT sql FROM sqlite_master WHERE type='table' AND name=?`,
            [tableName]
          );
          
          // Try to extract column information from the CREATE TABLE statement
          if (tempResult && typeof tempResult === 'object') {
            let sql = '';
            
            if (Array.isArray(tempResult) && tempResult.length > 0) {
              sql = tempResult[0].sql;
            } else if ('rows' in tempResult) {
              const rows = (tempResult as any).rows;
              if (rows && typeof rows.length === 'number' && rows.length > 0) {
                sql = rows.item(0).sql;
              }
            }
            
            if (sql) {
              log('Extracted CREATE TABLE SQL: ' + sql, 'MigrationService', 'VERBOSE');
              
              // Parse column definitions from SQL
              const columnsMatch = /\(([^)]+)\)/m.exec(sql);
              if (columnsMatch && columnsMatch[1]) {
                const columnDefs = columnsMatch[1].split(',').map(s => s.trim());
                const columns = columnDefs
                  .filter(def => !def.startsWith('FOREIGN KEY') && !def.startsWith('PRIMARY KEY'))
                  .map(def => {
                    const parts = def.split(' ');
                    const name = parts[0].replace(/[\[\]\"'`]/g, ''); // Remove quotes and brackets
                    const type = parts[1] || 'TEXT';
                    return {
                      name,
                      type,
                      notNull: def.includes('NOT NULL'),
                      primaryKey: def.includes('PRIMARY KEY'),
                      defaultValue: null
                    };
                  });
                
                log('Parsed ' + columns.length + ' columns from SQL for ' + tableName + ': ' + columns.map(c => c.name).join(', '), 'MigrationService', 'VERBOSE');
                
                if (columns.length > 0) {
                  return {
                    name: tableName,
                    columns
                  };
                }
              }
            }
          }
        } catch (sqlMasterError) {
          log('Error getting table SQL: ' + sqlMasterError, 'MigrationService', 'ERROR', { variableName: 'sqlMasterError', value: sqlMasterError });
        }
        
        // Try querying for a sample row with no filters
        try {
          log('Trying SELECT * LIMIT 0 approach for ' + tableName, 'MigrationService', 'VERBOSE');
          const query = `SELECT * FROM ${tableName} LIMIT 0`;
          const sampleResult = await this.storageService.executeSql(query, []);
          
          // Check if we can determine column names from the result object
          if (sampleResult && typeof sampleResult === 'object') {
            if ('columns' in sampleResult) {
              const columnsArray = (sampleResult as any).columns;
              if (Array.isArray(columnsArray) && columnsArray.length > 0) {
                const columns = columnsArray.map((colName: string) => ({
                  name: colName,
                  type: 'TEXT', // Default type
                  notNull: false,
                  primaryKey: colName === 'item_id',
                  defaultValue: null
                }));
                
                log('Found ' + columns.length + ' columns using SELECT * LIMIT 0: ' + columns.map(c => c.name).join(', '), 'MigrationService', 'VERBOSE');
                
                return {
                  name: tableName,
                  columns
                };
              }
            }
          }
        } catch (sampleError) {
          log('Error with SELECT * approach: ' + sampleError, 'MigrationService', 'ERROR', { variableName: 'sampleError', value: sampleError });
        }
      }
      
      // If we still don't have columns, use schema definition as last resort
      if (columnData.length === 0) {
        log('No columns found via database queries for ' + tableName + ', using schema definition as fallback', 'MigrationService', 'DEBUG');
        return this.parseSchemaDefinition(this.schemaDefinitions[tableName], tableName);
      }
      
      // Parse column information
      const columns = columnData.map((col: SQLiteColumn) => {
        return {
          name: col.name,
          type: col.type || 'TEXT',
          notNull: col.notnull === 1,
          primaryKey: col.pk === 1,
          defaultValue: col.dflt_value
        };
      });
      
      return {
        name: tableName,
        columns
      };
    } catch (error) {
      log('Error getting schema for ' + tableName + ': ' + error, 'MigrationService', 'ERROR', { variableName: 'error', value: error });
      return null;
    }
  }

  /**
   * Checks if a table exists in the database
   */
  private async tableExists(tableName: string): Promise<boolean> {
    try {
      // Use the tableExists method directly from storageService
      const exists = this.storageService.tableExists(tableName);
      log('Table ' + tableName + ' exists (using StorageService): ' + exists, 'MigrationService', 'VERBOSE');
      
      // Get more information about the table structure
      if (exists) {
        try {
          const tableInfo = await this.storageService.executeSql(
            "SELECT * FROM sqlite_master WHERE type='table' AND name=?;",
            [tableName]
          );
          
          log('Raw table info for ' + tableName + ': ' + JSON.stringify(tableInfo), 'MigrationService', 'VERBOSE');
          
          // Try to extract the SQL that created the table
          if (tableInfo && typeof tableInfo === 'object') {
            if (Array.isArray(tableInfo) && tableInfo.length > 0) {
              log('Table ' + tableName + ' creation SQL: ' + tableInfo[0].sql, 'MigrationService', 'VERBOSE');
            } else if ('rows' in tableInfo) {
              const rows = (tableInfo as any).rows;
              if (rows && typeof rows.length === 'number' && rows.length > 0) {
                const firstRow = rows.item(0);
                if (firstRow && 'sql' in firstRow) {
                  log('Table ' + tableName + ' creation SQL: ' + firstRow.sql, 'MigrationService', 'VERBOSE');
                }
              }
            }
          }
        } catch (infoError) {
          log('Error getting table info: ' + infoError, 'MigrationService', 'ERROR', { variableName: 'infoError', value: infoError });
        }
      }
      
      return exists;
    } catch (error) {
      log('Error checking if table ' + tableName + ' exists: ' + error, 'MigrationService', 'ERROR', { variableName: 'error', value: error });
      return false;
    }
  }

  /**
   * Parses a schema definition string into a structured TableSchema object
   */
  private parseSchemaDefinition(definition: string, tableName: string): TableSchema {
    // Extract column definitions from CREATE TABLE statement
    const columnsRegex = /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+\w+\s*\(([\s\S]*?)\);/i;
    const matches = columnsRegex.exec(definition);
    
    if (!matches || !matches[1]) {
      throw new Error(`Invalid schema definition for ${tableName}`);
    }
    
    // Pre-process to remove inline comments
    let columnDefinitionsText = matches[1].trim();
    // Remove inline comments
    columnDefinitionsText = columnDefinitionsText.replace(/\/\*[^*]*\*\//g, '');
    
    // Split column definitions, handling commas within parentheses
    const columnDefinitions: string[] = [];
    
    let depth = 0;
    let start = 0;
    
    for (let i = 0; i < columnDefinitionsText.length; i++) {
      const char = columnDefinitionsText[i];
      
      if (char === '(') depth++;
      else if (char === ')') depth--;
      
      if (char === ',' && depth === 0) {
        columnDefinitions.push(columnDefinitionsText.substring(start, i).trim());
        start = i + 1;
      }
    }
    
    // Add the last column definition
    columnDefinitions.push(columnDefinitionsText.substring(start).trim());
    
    // Filter out constraints and parse columns
    const columns = columnDefinitions
      .filter(col => 
        !col.toUpperCase().startsWith('FOREIGN KEY') && 
        !col.toUpperCase().startsWith('PRIMARY KEY') &&
        !col.toUpperCase().startsWith('CONSTRAINT')
      )
      .map(colDef => {
        // Parse name and type
        const parts = colDef.trim().split(/\s+/);
        const name = parts[0];
        const type = parts[1] || 'TEXT';
        
        // Check for constraints
        const notNull = colDef.toUpperCase().includes('NOT NULL');
        const primaryKey = colDef.toUpperCase().includes('PRIMARY KEY');
        
        // Extract default value if present
        const defaultRegex = /DEFAULT\s+([^,\s]+)/i;
        const defaultMatch = colDef.match(defaultRegex);
        const defaultValue = defaultMatch ? defaultMatch[1] : undefined;
        
        return { name, type, notNull, primaryKey, defaultValue };
      });
    
    return {
      name: tableName,
      columns
    };
  }

  /**
   * Generates a hash to represent a schema definition for comparison
   */
  private generateSchemaHash(schema: TableSchema): string {
    // Use Lodash to create a stable representation
    const normalized = _.map(schema.columns, (col: ColumnDefinition) => 
      _.pick(col, ['name', 'type', 'notNull', 'primaryKey', 'defaultValue'])
    );
    
    // Sort by column name for consistent ordering
    const sorted = _.sortBy(normalized, 'name');
    
    // Convert to string for hashing
    return JSON.stringify(sorted);
  }

  /**
   * Retrieves stored schema version for an entity
   */
  private async getStoredSchemaVersion(entityName: string): Promise<Record<string, any> | null> {
    try {
      const result = await this.storageService.executeSql(
        "SELECT * FROM schema_versions WHERE entity_name = ?",
        [entityName]
      );
      
      let storedVersion = null;
      
      if (Array.isArray(result) && result.length > 0) {
        storedVersion = result[0];
      } else if (result && typeof result === 'object' && 'rows' in result) {
        const rows = (result as any).rows;
        if (rows && typeof rows.length === 'number' && rows.length > 0) {
          storedVersion = rows.item(0);
        }
      }
      
      return storedVersion;
    } catch (error) {
      log('Error getting schema version for ' + entityName + ': ' + error, 'MigrationService', 'ERROR', { variableName: 'error', value: error });
      return null;
    }
  }

  /**
   * Updates stored schema version for an entity
   */
  private async updateSchemaVersion(entityName: string, schemaHash: string): Promise<void> {
    const now = Date.now();
    
    try {
      // Use INSERT OR REPLACE instead of separate INSERT/UPDATE logic
      await this.storageService.executeSql(
        "INSERT OR REPLACE INTO schema_versions (entity_name, schema_hash, last_updated) VALUES (?, ?, ?)",
        [entityName, schemaHash, now]
      );
    } catch (error) {
      log('Error updating schema version for ' + entityName + ': ' + error, 'MigrationService', 'ERROR', { variableName: 'error', value: error });
      throw error; // Re-throw so the caller can handle it
    }
  }

  /**
   * Detects differences between database schema and code schema
   */
  private detectSchemaChanges(dbSchema: TableSchema, codeSchema: TableSchema): Array<{
    type: 'add' | 'modify' | 'remove';
    column: string;
    details: any;
  }> {
    // Normalize column types to make comparison more accurate
    const normalizeType = (type: string): string => {
      // SQLite treats these types as equivalent
      type = type.toUpperCase();
      if (type === 'INT') return 'INTEGER';
      if (type === 'CHAR' || type === 'CLOB' || type === 'VARCHAR') return 'TEXT';
      if (type === 'DOUBLE' || type === 'FLOAT' || type === 'NUMERIC') return 'REAL';
      return type;
    };
    
    // Normalize column definitions
    const normalizeColumns = (columns: ColumnDefinition[]): ColumnDefinition[] => {
      return columns.map(col => ({
        ...col,
        type: normalizeType(col.type)
      }));
    };
    
    const normalizedDbColumns = normalizeColumns(dbSchema.columns);
    const normalizedCodeColumns = normalizeColumns(codeSchema.columns);
    
    // Use Lodash to find columns that need to be added
    const columnsToAdd = _.differenceBy(normalizedCodeColumns, normalizedDbColumns, 'name')
      .map((col: ColumnDefinition) => ({
        type: 'add' as const,
        column: col.name,
        details: col
      }));
    
    // Find columns with different definitions
    // Note: SQLite has limited ALTER TABLE capabilities
    // We currently only support adding columns, not modifying existing ones
    const modifiedColumns = _.intersectionBy(normalizedCodeColumns, normalizedDbColumns, 'name')
      .filter((codeCol: ColumnDefinition) => {
        const dbCol = _.find(normalizedDbColumns, { name: codeCol.name });
        
        // Compare only relevant attributes, ignoring minor differences
        return !_.isEqual(
          _.pick(codeCol, ['type']),
          _.pick(dbCol, ['type'])
        );
      })
      .map((col: ColumnDefinition) => ({
        type: 'modify' as const,
        column: col.name,
        details: {
          current: _.find(normalizedDbColumns, { name: col.name }),
          target: col
        }
      }));
    
    // Note: For now, we'll log modified columns but won't attempt to alter them
    // since SQLite doesn't easily support column modifications
    if (modifiedColumns.length > 0) {
      log(
        'Found ' + modifiedColumns.length + ' modified columns, ' +
        'but SQLite doesn\'t support ALTER COLUMN. These changes will be ignored.',
        'MigrationService',
        'WARNING'
      );
      log('Modified columns: ' + JSON.stringify(modifiedColumns), 'MigrationService', 'VERBOSE');
    }
    
    return columnsToAdd;
  }

  /**
   * Applies schema changes to the database
   */
  private async applySchemaChanges(
    tableName: string, 
    changes: Array<{ type: string; column: string; details: any }>
  ): Promise<boolean> {
    try {
      for (const change of changes) {
        if (change.type === 'add') {
          const column = change.details;
          
          // Build column definition
          const notNullClause = column.notNull ? ' NOT NULL' : '';
          const defaultClause = column.defaultValue 
            ? ` DEFAULT ${column.defaultValue}` 
            : '';
          
          const columnDef = `${column.type}${notNullClause}${defaultClause}`;
          
          // Add column to table
          log('Adding column ' + change.column + ' to ' + tableName + ' with definition: ' + columnDef, 'MigrationService', 'INFO');
          
          try {
            // Use ALTER TABLE to add the column
            await this.storageService.executeSql(
              `ALTER TABLE ${tableName} ADD COLUMN ${change.column} ${columnDef}`,
              []
            );
            log('Successfully added column ' + change.column + ' to ' + tableName, 'MigrationService', 'INFO');
          } catch (alterError) {
            log('Error adding column ' + change.column + ' to ' + tableName + ': ' + alterError, 'MigrationService', 'ERROR', { variableName: 'alterError', value: alterError });
            throw alterError;
          }
        }
        
        // Support for other operations could be added here
      }
      
      return true;
    } catch (error) {
      log('Error applying schema changes: ' + error, 'MigrationService', 'ERROR', { variableName: 'error', value: error });
      errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'MigrationService',
          operation: 'applySchemaChanges',
          input: { tableName, changes }
        }
      );
      return false; // Ensure we return false on error
    }
  }
  
  /**
   * Forces a full schema update for a specific table
   * This can be used as a last resort when normal migrations fail
   */
  public async forceSchemaUpdate(tableName: string): Promise<boolean> {
    if (!this.schemaDefinitions[tableName]) {
      log('No schema definition found for ' + tableName, 'MigrationService', 'ERROR');
      return false;
    }
    
    try {
      // Check if table exists
      const tableExists = await this.tableExists(tableName);
      
      if (!tableExists) {
        log('Table ' + tableName + ' doesn\'t exist, creating it first', 'MigrationService', 'INFO');
        try {
          // Execute the schema definition to create the table
          await this.storageService.executeSql(this.schemaDefinitions[tableName], []);
          log('Table ' + tableName + ' created successfully', 'MigrationService', 'INFO');
          
          // After creating the table, we don't need to add columns since it was created with the latest schema
          // But we should store the schema version
          const codeSchema = this.parseSchemaDefinition(this.schemaDefinitions[tableName], tableName);
          const codeSchemaHash = this.generateSchemaHash(codeSchema);
          await this.updateSchemaVersion(tableName, codeSchemaHash);
          
          return true;
        } catch (createError) {
          log('Failed to create table ' + tableName + ': ' + createError, 'MigrationService', 'ERROR', { variableName: 'createError', value: createError });
          return false;
        }
      }
      
      // Parse schema definition
      const codeSchema = this.parseSchemaDefinition(this.schemaDefinitions[tableName], tableName);
      
      // Get current schema
      const dbSchema = await this.getTableSchema(tableName);
      
      if (!dbSchema) {
        log('Cannot force update: failed to get schema for ' + tableName, 'MigrationService', 'ERROR');
        return false;
      }
      
      // Find missing columns
      const columnsToAdd = _.differenceBy(codeSchema.columns, dbSchema.columns, 'name');
      
      if (columnsToAdd.length === 0) {
        log('No columns to add for ' + tableName, 'MigrationService', 'DEBUG');
        return true;
      }
      
      log('Adding ' + columnsToAdd.length + ' missing columns to ' + tableName + ': ' + 
                 columnsToAdd.map(col => col.name).join(', '), 'MigrationService', 'INFO');
      
      // Apply changes directly
      for (const column of columnsToAdd) {
        // Build column definition
        const notNullClause = column.notNull ? ' NOT NULL' : '';
        const defaultClause = column.defaultValue 
          ? ` DEFAULT ${column.defaultValue}` 
          : '';
        
        const columnDef = `${column.type}${notNullClause}${defaultClause}`;
        
        log('Force adding column ' + column.name + ' to ' + tableName, 'MigrationService', 'INFO');
        await this.storageService.executeSql(
          `ALTER TABLE ${tableName} ADD COLUMN ${column.name} ${columnDef}`,
          []
        );
      }
      
      // Update schema version
      const codeSchemaHash = this.generateSchemaHash(codeSchema);
      await this.updateSchemaVersion(tableName, codeSchemaHash);
      
      return true;
    } catch (error) {
      log('Error in forceSchemaUpdate for ' + tableName + ': ' + error, 'MigrationService', 'ERROR', { variableName: 'error', value: error });
      return false;
    }
  }

  /**
   * Guess the SQLite type of a column based on its value
   */
  private guessColumnType(value: any): string {
    if (value === null || value === undefined) {
      return 'TEXT'; // Default to TEXT for null values
    }
    
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return 'INTEGER';
      }
      return 'REAL';
    }
    
    if (typeof value === 'boolean') {
      return 'INTEGER'; // SQLite stores booleans as integers
    }
    
    return 'TEXT'; // Default to TEXT for everything else
  }
} 