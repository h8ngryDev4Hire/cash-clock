import * as SQLite from 'expo-sqlite';
import { createAllTables, ALL_SCHEMAS } from '../database/schema';
import { MigrationService } from '../database/MigrationService';
import { errorService } from '../error/ErrorService';
import { ErrorLevel } from '@def/error';
import { log } from '@lib/util/debugging/logging';

/**
 * StorageService provides base database operations for the application
 * using SQLite for local storage.
 */
export class StorageService {
  private database: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;
  private isInitializing: boolean = false; // Add a flag to track initialization in progress
  private migrationService: MigrationService;

  constructor() {
    // Create our own instance of MigrationService, passing this StorageService
    this.migrationService = new MigrationService(this);
  }

  /**
   * Initialize the database connection
   */
  public async initialize(): Promise<void> {
    // Prevent multiple simultaneous initialization attempts
    if (this.initialized && this.database) return;
    if (this.isInitializing) return;

    try {
      this.isInitializing = true; // Set flag to indicate initialization in progress
      log('Opening database connection...', 'StorageService', 'initialize', 'INFO');
      this.database = SQLite.openDatabaseSync('cashclock.db');
      
      log('Database connection opened, creating tables...', 'StorageService', 'initialize', 'INFO');
      
      // Only proceed with schema initialization if we have a valid database instance
      if (this.database) {
        // First create the tables using the schema definitions
        await this.initializeSchema();
        log('Base schema initialized, tables created', 'StorageService', 'initialize', 'INFO');
        
        // Verify that tables were created
        const projectsExist = this.tableExists('projects');
        log(`Projects table exists: ${projectsExist}`, 'StorageService', 'initialize', 'INFO');
        
        if (projectsExist) {
          // Now run migrations to detect and apply schema changes
          log('Running schema migrations...', 'StorageService', 'initialize', 'INFO');
          await this.migrationService.syncSchemas();
          
          // Force migration for the projects table to ensure the description column exists
          log('Ensuring projects table has all required columns...', 'StorageService', 'initialize', 'INFO');
          const projectsUpdated = await this.migrationService.forceSchemaUpdate('projects');
          if (projectsUpdated) {
            log('Projects table schema updated successfully', 'StorageService', 'initialize', 'INFO');
          } else {
            log('Projects table schema update check completed', 'StorageService', 'initialize', 'WARNING');
          }
        } else {
          log('Failed to create necessary tables. Migration skipped.', 'StorageService', 'initialize', 'ERROR');
        }
        
        this.initialized = true;
        log('Database initialized successfully', 'StorageService', 'initialize', 'INFO');
      } else {
        throw new Error('Failed to open database connection');
      }
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.FATAL,
        {
          component: 'StorageService',
          operation: 'initialize',
          entityType: 'database'
        }
      );
      
      this.database = null;
      this.initialized = false;
      throw appError;
    } finally {
      this.isInitializing = false; // Reset flag regardless of success or failure
    }
  }

  /**
   * Initialize database schema by creating tables if they don't exist
   */
  private async initializeSchema(): Promise<void> {
    try {
      if (!this.database) {
        throw new Error('Database not initialized');
      }
      
      // Use direct execution for each schema
      for (const schema of ALL_SCHEMAS) {
        try {
          this.database.runSync(schema, []);
        } catch (error) {
          errorService.logError(
            error instanceof Error ? error : new Error(String(error)),
            ErrorLevel.ERROR,
            {
              component: 'StorageService',
              operation: 'initializeSchema',
              entityType: 'database',
              input: schema
            }
          );
          throw error;
        }
      }
      
      log('Database schema initialized successfully', 'StorageService', 'initializeSchema', 'INFO');
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.FATAL,
        {
          component: 'StorageService',
          operation: 'initializeSchema',
          entityType: 'database'
        }
      );
      throw appError;
    }
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    try {
      if (this.database) {
        this.database.closeSync();
        this.database = null;
      }
      this.initialized = false;
    } catch (error) {
      errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.WARNING,
        {
          component: 'StorageService',
          operation: 'close',
          entityType: 'database'
        }
      );
      // Don't throw on close errors, just log them
    }
  }

  /**
   * Execute a SQL query with parameters
   */
  public executeSql(query: string, params: any[] = []): SQLite.SQLiteRunResult {
    try {
      if (!this.initialized && !this.isInitializing) {
        // Throw a more helpful error instead of triggering initialization recursively
        throw new Error('Database not initialized. Please call initialize() first.');
      }
      
      if (!this.database) {
        throw new Error('Database not initialized');
      }

      return this.database.runSync(query, params);
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'executeSql',
          entityType: 'database',
          input: { query, params }
        }
      );
      throw appError;
    }
  }

  /**
   * Create a table if it doesn't exist
   */
  public createTable(tableName: string, columns: string): void {
    try {
      const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns});`;
      this.executeSql(query, []);
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'createTable',
          entityType: 'database',
          input: { tableName, columns }
        }
      );
      throw appError;
    }
  }

  /**
   * Insert a record into a table
   */
  public insert(tableName: string, data: Record<string, any>): void {
    try {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders});`;
      this.executeSql(query, values);
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'insert',
          entityType: tableName,
          input: data
        }
      );
      throw appError;
    }
  }

  /**
   * Update a record in a table
   */
  public update(tableName: string, data: Record<string, any>, whereClause: string, whereParams: any[] = []): void {
    try {
      const setClause = Object.keys(data)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = [...Object.values(data), ...whereParams];
      
      const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause};`;
      this.executeSql(query, values);
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'update',
          entityType: tableName,
          input: { data, whereClause, whereParams }
        }
      );
      throw appError;
    }
  }

  /**
   * Delete a record from a table
   */
  public delete(tableName: string, whereClause: string, whereParams: any[] = []): void {
    try {
      const query = `DELETE FROM ${tableName} WHERE ${whereClause};`;
      this.executeSql(query, whereParams);
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'delete',
          entityType: tableName,
          input: { whereClause, whereParams }
        }
      );
      throw appError;
    }
  }

  /**
   * Find records in a table
   */
  public find(tableName: string, columns: string = '*', whereClause: string = '', whereParams: any[] = [], orderBy: string = ''): any[] {
    try {
      let query = `SELECT ${columns} FROM ${tableName}`;
      
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }
      
      if (orderBy) {
        query += ` ORDER BY ${orderBy}`;
      }
      
      query += ';';
      
      if (!this.database) {
        throw new Error('Database not initialized');
      }
      
      const results = this.database.getAllSync(query, whereParams);
      return results;
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'find',
          entityType: tableName,
          input: { columns, whereClause, whereParams, orderBy }
        }
      );
      throw appError;
    }
  }

  /**
   * Find a single record in a table
   */
  public findOne(tableName: string, columns: string = '*', whereClause: string, whereParams: any[] = []): any | null {
    try {
      const items = this.find(tableName, columns, whereClause, whereParams);
      return items.length > 0 ? items[0] : null;
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'findOne',
          entityType: tableName,
          input: { columns, whereClause, whereParams }
        }
      );
      throw appError;
    }
  }

  /**
   * Check if a table exists
   */
  public tableExists(tableName: string): boolean {
    try {
      const query = "SELECT name FROM sqlite_master WHERE type='table' AND name=?;";
      if (!this.database) {
        throw new Error('Database not initialized');
      }
      const results = this.database.getAllSync(query, [tableName]);
      return results.length > 0;
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'tableExists',
          entityType: 'database',
          input: { tableName }
        }
      );
      throw appError;
    }
  }

  /**
   * Count records in a table
   */
  public count(tableName: string, whereClause: string = '', whereParams: any[] = []): number {
    try {
      let query = `SELECT COUNT(*) as count FROM ${tableName}`;
      
      if (whereClause) {
        query += ` WHERE ${whereClause}`;
      }
      
      query += ';';
      
      if (!this.database) {
        throw new Error('Database not initialized');
      }
      
      const result = this.database.getFirstSync(query, whereParams);
      return result && typeof result === 'object' && 'count' in result ? (result.count as number) : 0;
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'count',
          entityType: tableName,
          input: { whereClause, whereParams }
        }
      );
      throw appError;
    }
  }

  /**
   * Execute a transaction
   */
  public transaction(callback: (tx: SQLite.SQLiteDatabase) => void): void {
    try {
      if (!this.initialized) {
        this.initialize();
      }
      
      if (!this.database) {
        throw new Error('Database not initialized');
      }

      // In expo-sqlite, we don't have explicit transaction API in the newer versions
      // So we'll just pass the database instance to the callback
      callback(this.database);
    } catch (error) {
      const appError = errorService.logError(
        error instanceof Error ? error : new Error(String(error)),
        ErrorLevel.ERROR,
        {
          component: 'StorageService',
          operation: 'transaction',
          entityType: 'database'
        }
      );
      throw appError;
    }
  }
}

// Create and export singleton instance
export const storageService = new StorageService();
