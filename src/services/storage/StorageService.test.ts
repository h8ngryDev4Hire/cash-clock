import { StorageService } from './StorageService';
import SQLite from 'react-native-sqlite-storage';

// Mock the SQLite module
jest.mock('react-native-sqlite-storage', () => {
  const executeSqlMock = jest.fn();
  const transactionMock = jest.fn();
  const closeMock = jest.fn();

  return {
    enablePromise: jest.fn(),
    openDatabase: jest.fn().mockReturnValue({
      executeSql: executeSqlMock,
      transaction: transactionMock,
      close: closeMock
    }),
    ResultSet: jest.fn(),
    Transaction: jest.fn()
  };
});

describe('StorageService', () => {
  let storageService: StorageService;
  let mockExecuteSql: jest.Mock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get access to the mocked executeSql function
    const mockDb = (SQLite.openDatabase() as unknown) as { 
      executeSql: jest.Mock,
      transaction: jest.Mock,
      close: jest.Mock 
    };
    mockExecuteSql = mockDb.executeSql;
    
    // Set up mock return value for executeSql
    mockExecuteSql.mockImplementation(() => {
      return Promise.resolve([{
        rows: {
          length: 2,
          item: (index: number) => {
            return index === 0 ? { id: 1, name: 'Test1' } : { id: 2, name: 'Test2' };
          }
        }
      }]);
    });
    
    storageService = new StorageService();
  });

  test('should initialize the database', async () => {
    await storageService.initialize();
    expect(SQLite.enablePromise).toHaveBeenCalledWith(true);
    expect(SQLite.openDatabase).toHaveBeenCalledWith({
      name: 'cashclock.db',
      location: 'default',
    });
  });

  test('should create a table if it does not exist', async () => {
    await storageService.initialize();
    await storageService.createTable('test_table', 'id INTEGER PRIMARY KEY, name TEXT');
    
    expect(mockExecuteSql).toHaveBeenCalledWith(
      'CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY, name TEXT);',
      []
    );
  });

  test('should insert a record into a table', async () => {
    await storageService.initialize();
    await storageService.insert('test_table', { id: 1, name: 'Test' });
    
    expect(mockExecuteSql).toHaveBeenCalledWith(
      'INSERT INTO test_table (id, name) VALUES (?, ?);',
      [1, 'Test']
    );
  });

  test('should update a record in a table', async () => {
    await storageService.initialize();
    await storageService.update('test_table', { name: 'Updated' }, 'id = ?', [1]);
    
    expect(mockExecuteSql).toHaveBeenCalledWith(
      'UPDATE test_table SET name = ? WHERE id = ?;',
      ['Updated', 1]
    );
  });

  test('should delete a record from a table', async () => {
    await storageService.initialize();
    await storageService.delete('test_table', 'id = ?', [1]);
    
    expect(mockExecuteSql).toHaveBeenCalledWith(
      'DELETE FROM test_table WHERE id = ?;',
      [1]
    );
  });

  test('should find records in a table', async () => {
    await storageService.initialize();
    const results = await storageService.find('test_table', '*', 'name LIKE ?', ['%Test%'], 'name ASC');
    
    expect(mockExecuteSql).toHaveBeenCalledWith(
      'SELECT * FROM test_table WHERE name LIKE ? ORDER BY name ASC;',
      ['%Test%']
    );
    
    expect(results).toEqual([
      { id: 1, name: 'Test1' },
      { id: 2, name: 'Test2' }
    ]);
  });

  test('should find a single record in a table', async () => {
    await storageService.initialize();
    const result = await storageService.findOne('test_table', '*', 'id = ?', [1]);
    
    expect(mockExecuteSql).toHaveBeenCalledWith(
      'SELECT * FROM test_table WHERE id = ?;',
      [1]
    );
    
    expect(result).toEqual({ id: 1, name: 'Test1' });
  });

  test('should check if a table exists', async () => {
    mockExecuteSql.mockImplementationOnce(() => {
      return Promise.resolve([{
        rows: {
          length: 1,
          item: () => ({ name: 'test_table' })
        }
      }]);
    });
    
    await storageService.initialize();
    const exists = await storageService.tableExists('test_table');
    
    expect(mockExecuteSql).toHaveBeenCalledWith(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?;",
      ['test_table']
    );
    
    expect(exists).toBe(true);
  });

  test('should count records in a table', async () => {
    mockExecuteSql.mockImplementationOnce(() => {
      return Promise.resolve([{
        rows: {
          length: 1,
          item: () => ({ count: 10 })
        }
      }]);
    });
    
    await storageService.initialize();
    const count = await storageService.count('test_table', 'name LIKE ?', ['%Test%']);
    
    expect(mockExecuteSql).toHaveBeenCalledWith(
      'SELECT COUNT(*) as count FROM test_table WHERE name LIKE ?;',
      ['%Test%']
    );
    
    expect(count).toBe(10);
  });
});