// Global test setup
process.env.NODE_ENV = 'test';

// Global test setup
process.env.NODE_ENV = 'test';

// Mock environment variables for testing
process.env.COOKIE_SECRET = 'test-cookie-secret';
process.env.DB_NAME = 'AutoPartsDB';
process.env.DB_USER_NAME = 'sa';
process.env.DB_PASS = '1111';
process.env.HOST = 'localhost';
process.env.DB_PORT = '1433';
process.env.DIALECT = 'mssql';

// Global test timeout
jest.setTimeout(10000);

// Mock console.log to reduce noise during tests
global.console = {
    ...console,
    // Uncomment to disable console.log during tests
    // log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
