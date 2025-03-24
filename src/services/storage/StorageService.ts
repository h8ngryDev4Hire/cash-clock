import * as SQLite from 'expo-sqlite';
import { createAllTables, ALL_SCHEMAS } from '../database/schema';

/**
 * StorageService provides base database operations for the application
 * using SQLite for local storage.
 */
export class StorageService {
  private database: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the database connection
   */
  public async initialize(): Promise<void> {
    if (this.initialized && this.database) return;

    try {
      console.log('Opening database connection...');
      this.database = SQLite.openDatabaseSync('cashclock.db');
      
      console.log('Database connection opened, creating tables...');
      
      // Only proceed with schema initialization if we have a valid database instance
      if (this.database) {
        await this.initializeSchema();
        this.initialized = true;
        console.log('Database initialized successfully');
      } else {
        throw new Error('Failed to open database connection');
      }
    } catch (error) {
      console.error('Failed to initialize database', error);
      this.database = null;
      this.initialized = false;
      throw new Error('Database initialization failed');
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
          console.error('Error executing schema:', error);
          throw error;
        }
      }
      
      console.log('Database schema initialized successfully');
    } catch (error) {
      console.error('Failed to initialize schema', error);
      throw new Error('Schema initialization failed');
    }
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (this.database) {
      this.database.closeSync();
      this.database = null;
    }
    this.initialized = false;
  }

  /**
   * Execute a SQL query with parameters
   */
  public executeSql(query: string, params: any[] = []): SQLite.SQLiteRunResult {
    if (!this.initialized) {
      this.initialize();
    }
    
    if (!this.database) {
      throw new Error('Database not initialized');
    }

    try {
      return this.database.runSync(query, params);
    } catch (error) {
      console.error('SQL execution error:', error, { query, params });
      throw new Error(`Failed to execute SQL: ${query}`);
    }
  }

  /**
   * Create a table if it doesn't exist
   */
  public createTable(tableName: string, columns: string): void {
    const query = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns});`;
    this.executeSql(query, []);
  }

  /**
   * Insert a record into a table
   */
  public insert(tableName: string, data: Record<string, any>): void {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders});`;
    this.executeSql(query, values);
  }

  /**
   * Update a record in a table
   */
  public update(tableName: string, data: Record<string, any>, whereClause: string, whereParams: any[] = []): void {
    const setClause = Object.keys(data)
      .map(key => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(data), ...whereParams];
    
    const query = `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause};`;
    this.executeSql(query, values);
  }

  /**
   * Delete a record from a table
   */
  public delete(tableName: string, whereClause: string, whereParams: any[] = []): void {
    const query = `DELETE FROM ${tableName} WHERE ${whereClause};`;
    this.executeSql(query, whereParams);
  }

  /**
   * Find records in a table
   */
  public find(tableName: string, columns: string = '*', whereClause: string = '', whereParams: any[] = [], orderBy: string = ''): any[] {
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
  }

  /**
   * Find a single record in a table
   */
  public findOne(tableName: string, columns: string = '*', whereClause: string, whereParams: any[] = []): any | null {
    const items = this.find(tableName, columns, whereClause, whereParams);
    return items.length > 0 ? items[0] : null;
  }

  /**
   * Check if a table exists
   */
  public tableExists(tableName: string): boolean {
    const query = "SELECT name FROM sqlite_master WHERE type='table' AND name=?;";
    if (!this.database) {
      throw new Error('Database not initialized');
    }
    const results = this.database.getAllSync(query, [tableName]);
    return results.length > 0;
  }

  /**
   * Count records in a table
   */
  public count(tableName: string, whereClause: string = '', whereParams: any[] = []): number {
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
  }
}

// Create and export singleton instance
export const storageService = new StorageService();
