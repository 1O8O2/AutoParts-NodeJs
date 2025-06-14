require('dotenv').config();

process.env.NODE_ENV = 'test';

// Mock environment variables for testing
process.env.COOKIE_SECRET = 'test-cookie-secret';
process.env.DB_NAME = 'AutoPartsDB';
process.env.DB_USER_NAME = 'sa';
process.env.DB_PASS = '1111';
process.env.HOST = 'localhost';
process.env.DB_PORT = '1433';
process.env.DIALECT = 'mssql';

// Mock console methods to reduce test noise
const originalLog = console.log;
const originalError = console.error;
console.log = jest.fn();
console.error = jest.fn();

// Mock Sequelize để tránh lỗi database trong test
jest.mock('../configs/database', () => ({
    getSequelize: jest.fn(() => ({
        define: jest.fn((name, schema) => {
            const MockModel = function() {};
            MockModel.findAll = jest.fn();
            MockModel.findOne = jest.fn();
            MockModel.findByPk = jest.fn();
            MockModel.create = jest.fn();
            MockModel.update = jest.fn();
            MockModel.destroy = jest.fn();
            MockModel.bulkCreate = jest.fn();
            MockModel.belongsTo = jest.fn();
            MockModel.hasOne = jest.fn();
            MockModel.hasMany = jest.fn();
            MockModel.belongsToMany = jest.fn();
            MockModel.save = jest.fn();
            MockModel.changed = jest.fn();
            return MockModel;
        }),
        authenticate: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue(),
        sync: jest.fn().mockResolvedValue(),
        syncDatabase: jest.fn().mockResolvedValue(true),
        fn: jest.fn((funcName) => `MOCK_${funcName}_FUNCTION`),
        literal: jest.fn((value) => value),
        col: jest.fn((column) => column),
        where: jest.fn(),
        Op: {
            and: Symbol('and'),
            or: Symbol('or'),
            eq: Symbol('eq'),
            ne: Symbol('ne'),
            gt: Symbol('gt'),
            gte: Symbol('gte'),
            lt: Symbol('lt'),
            lte: Symbol('lte'),
            like: Symbol('like'),
            iLike: Symbol('iLike'),
            in: Symbol('in'),
            notIn: Symbol('notIn'),
            between: Symbol('between'),
            notBetween: Symbol('notBetween')
        }
    })),
    syncDatabase: jest.fn().mockResolvedValue(true)
}));

// Mock system config
jest.mock('../configs/system', () => ({
    prefixUrl: '/AutoParts',
    prefixAdmin: '/admin'
}));

// Mock all model files globally
const createMockModel = (modelName) => ({
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findByPk: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue([1]),
    destroy: jest.fn().mockResolvedValue(1),
    bulkCreate: jest.fn().mockResolvedValue([]),
    save: jest.fn().mockResolvedValue({}),
    belongsTo: jest.fn(),
    hasOne: jest.fn(),
    hasMany: jest.fn(),
    belongsToMany: jest.fn(),
    changed: jest.fn().mockReturnValue(false),
    modelName
});

// Mock all individual models
jest.mock('../models/Account', () => createMockModel('Account'));
jest.mock('../models/Blog', () => createMockModel('Blog'));
jest.mock('../models/BlogGroup', () => createMockModel('BlogGroup'));
jest.mock('../models/Brand', () => createMockModel('Brand'));
jest.mock('../models/Cart', () => ({
    Cart: createMockModel('Cart'),
    ProductsInCart: createMockModel('ProductsInCart')
}));
jest.mock('../models/Chat', () => createMockModel('Chat'));
jest.mock('../models/Customer', () => createMockModel('Customer'));
jest.mock('../models/Discount', () => createMockModel('Discount'));
jest.mock('../models/Employee', () => createMockModel('Employee'));
jest.mock('../models/GeneralSettings', () => createMockModel('GeneralSettings'));
jest.mock('../models/Import', () => createMockModel('Import'));
jest.mock('../models/ImportDetail', () => createMockModel('ImportDetail'));
jest.mock('../models/Order', () => createMockModel('Order'));
jest.mock('../models/OrderDetail', () => createMockModel('OrderDetail'));
jest.mock('../models/Product', () => createMockModel('Product'));
jest.mock('../models/ProductGroup', () => createMockModel('ProductGroup'));
jest.mock('../models/ProductsInCart', () => createMockModel('ProductsInCart'));
jest.mock('../models/RoleGroup', () => createMockModel('RoleGroup'));
jest.mock('../models/RoleGroupPermissions', () => createMockModel('RoleGroupPermissions'));

// Mock session and flash middleware
const mockFlash = jest.fn();
const mockSession = {
    user: null,
    cart: null,
    destroy: jest.fn(),
    save: jest.fn()
};

// Mock express-flash and express-session
jest.mock('express-session', () => {
    return () => (req, res, next) => {
        req.session = mockSession;
        req.flash = mockFlash;
        next();
    };
});

jest.mock('express-flash', () => {
    return () => (req, res, next) => {
        req.flash = mockFlash;
        res.locals.messages = {};
        next();
    };
});

// Mock cookie parser
jest.mock('cookie-parser', () => {
    return () => (req, res, next) => {
        req.cookies = req.cookies || {};
        next();
    };
});

// Mock message loading helper
jest.mock('../helpers/loadMessages', () => jest.fn().mockReturnValue({}));

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
global.console = {
    ...console,
    // Uncomment to disable console.log during tests
    // log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

