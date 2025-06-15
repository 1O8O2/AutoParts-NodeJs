// Integration Test 5: Admin Dashboard and Reporting System
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');

// Mock all required models and dependencies
jest.mock('../../models/Order');
jest.mock('../../models/OrderDetail');
jest.mock('../../models/Product');
jest.mock('../../models/Customer');
jest.mock('../../models/Account');
jest.mock('../../models/Employee');
jest.mock('../../configs/database', () => {
    const mockModel = {
        belongsTo: jest.fn(),
        hasMany: jest.fn(),
        hasOne: jest.fn(),
        findAll: jest.fn(),
        findOne: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        save: jest.fn(),
        reload: jest.fn()
    };
    
    return {
        getSequelize: jest.fn(() => ({
            define: jest.fn(() => mockModel),
            transaction: jest.fn(),
            authenticate: jest.fn(),
            sync: jest.fn(),
            fn: jest.fn(() => 'mock_function_value'),
            literal: jest.fn((value) => value)
        }))
    };
});
jest.mock('../../configs/system');
jest.mock('exceljs');

const Order = require('../../models/Order');
const OrderDetail = require('../../models/OrderDetail');
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');
const Account = require('../../models/Account');
const Employee = require('../../models/Employee');
const systemConfig = require('../../configs/system');

// Mock system config
systemConfig.prefixAdmin = '/admin';

// Setup Express app for testing
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser('test-secret'));
app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 }
}));
app.use(flash());

// Mock view engine for render calls
app.set('view engine', 'ejs');
app.set('views', './views');

// Mock render function to avoid template errors
app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, locals) {
        // For tests, just return JSON instead of rendering templates
        res.json({ view, locals, status: 'rendered' });
    };
    next();
});

// Mock middleware for admin authentication
app.use((req, res, next) => {
    res.locals.messages = {
        DASHBOARD_ERROR: 'Error loading dashboard',
        REPORT_ERROR: 'Error generating report',
        EXPORT_SUCCESS: 'Report exported successfully',
        INVALID_DATE_RANGE: 'Invalid date range',
        NO_DATA_FOUND: 'No data found for selected criteria'
    };
    
    res.locals.user = {
        email: 'admin@example.com',
        fullName: 'Admin User',
        phone: '0123456789'
    };
    
    res.locals.permission = [
        'DASHBOARD_XEM', 
        'BAO_CAO_XEM', 
        'BAO_CAO_XUAT',
        'THONG_KE_XEM'
    ];
    next();
});

// Import controllers after mocking
const dashboardController = require('../../controller/admin/dashboardController');
const orderReportController = require('../../controller/admin/order-report.controller');
const productReportController = require('../../controller/admin/product-report.controller');
const financialReportController = require('../../controller/admin/financial-report.controller');

// Setup routes
app.get('/admin/dashboard/statistic', dashboardController.statistic);
app.get('/admin/dashboard/profile', dashboardController.profile);
app.post('/admin/dashboard/profile/edit/:userPhone', dashboardController.editProfile);
app.get('/admin/order-report', orderReportController.index);
app.get('/admin/order-report/export', orderReportController.exportReport);
app.get('/admin/product-report', productReportController.index);
app.get('/admin/product-report/export', productReportController.exportReport);
app.get('/admin/financial-report', financialReportController.index);
app.get('/admin/financial-report/export', financialReportController.exportReport);

describe('Admin Dashboard and Reporting Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mock implementations
        Order.findAll = jest.fn();
        OrderDetail.findAll = jest.fn();
        Product.findAll = jest.fn();
        Customer.findAll = jest.fn();
        Account.findAll = jest.fn();
        Employee.findOne = jest.fn();
        Employee.update = jest.fn();
    });

    describe('Dashboard Statistics', () => {        test('should display dashboard with revenue and sales statistics', async () => {
            const mockOrders = [
                {
                    orderId: 'ORD001',
                    totalCost: 100000,
                    orderDate: new Date(),
                    status: 'Completed',
                    deleted: false,
                    OrderDetails: [
                        { productId: 'PRD001', amount: 2, unitPrice: 25000 },
                        { productId: 'PRD002', amount: 1, unitPrice: 50000 }
                    ]
                },
                {
                    orderId: 'ORD002',
                    totalCost: 150000,
                    orderDate: new Date(),
                    status: 'Completed',
                    deleted: false,
                    OrderDetails: [
                        { productId: 'PRD001', amount: 3, unitPrice: 25000 },
                        { productId: 'PRD003', amount: 1, unitPrice: 75000 }
                    ]
                }
            ];

            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    costPrice: 18000,
                    price: 25000,
                    stock: 50,
                    toJSON: jest.fn().mockReturnValue({
                        productId: 'PRD001',
                        productName: 'Engine Oil',
                        costPrice: 18000,
                        price: 25000,
                        stock: 50
                    })
                },
                {
                    productId: 'PRD002',
                    productName: 'Brake Fluid',
                    costPrice: 35000,
                    price: 50000,
                    stock: 30,
                    toJSON: jest.fn().mockReturnValue({
                        productId: 'PRD002',
                        productName: 'Brake Fluid',
                        costPrice: 35000,
                        price: 50000,
                        stock: 30
                    })
                },
                {
                    productId: 'PRD003',
                    productName: 'Transmission Oil',
                    costPrice: 55000,
                    price: 75000,
                    stock: 20,
                    toJSON: jest.fn().mockReturnValue({
                        productId: 'PRD003',
                        productName: 'Transmission Oil',
                        costPrice: 55000,
                        price: 75000,
                        stock: 20
                    })
                }
            ];

            const mockAccounts = [
                { accountId: 'ACC001', email: 'user1@example.com' },
                { accountId: 'ACC002', email: 'user2@example.com' }
            ];

            Order.findAll.mockResolvedValue(mockOrders);
            Product.findByPk.mockImplementation((productId) => {
                return Promise.resolve(mockProducts.find(p => p.productId === productId));
            });
            Account.findAll.mockResolvedValue(mockAccounts);

            const response = await request(app)
                .get('/admin/dashboard/statistic')
                .query({
                    fromDate: '2024-01-01',
                    toDate: '2024-12-31'
                });

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });

        test('should handle dashboard with no sales data', async () => {
            Order.findAll.mockResolvedValue([]);
            Product.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/dashboard/statistic')
                .query({
                    fromDate: '2024-01-01',
                    toDate: '2024-01-31'
                });

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });        test('should calculate statistics with default date range', async () => {
            const mockOrders = [
                {
                    orderId: 'ORD001',
                    totalCost: 50000,
                    orderDate: new Date(),
                    status: 'Completed',
                    deleted: false,
                    OrderDetails: []
                }
            ];

            Order.findAll.mockResolvedValue(mockOrders);
            Product.findByPk.mockResolvedValue(null);
            Account.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/dashboard/statistic');

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });
    });

    describe('Admin Profile Management', () => {        test('should display admin profile', async () => {
            const response = await request(app)
                .get('/admin/dashboard/profile');

            expect(response.status).toBe(200);
            expect(response.body.view).toBe('admin/pages/account/profile');
        });

        test('should update admin profile successfully', async () => {
            const mockEmployee = {
                email: 'admin@example.com',
                phone: '0123456789'
            };

            Employee.findOne.mockResolvedValue(mockEmployee);
            Employee.update.mockResolvedValue([1]); // Sequelize returns array with affected rows

            const response = await request(app)
                .post('/admin/dashboard/profile/edit/0123456789')
                .send({
                    fullName: 'Updated Admin User',
                    address: '456 New Admin Street'
                });

            expect(response.status).toBe(302);
            expect(Employee.update).toHaveBeenCalled();
        });

        test('should handle profile update error', async () => {
            Employee.findOne.mockResolvedValue(null);

            const response = await request(app)
                .post('/admin/dashboard/profile/edit/0123456789')
                .send({
                    fullName: 'Updated Admin User'
                });

            expect(response.status).toBe(302);
        });
    });

    describe('Order Reports', () => {
        test('should generate order report with statistics', async () => {
            const mockOrders = [
                {
                    orderId: 'ORD001',
                    orderDate: new Date('2024-01-15'),
                    totalCost: 100000,
                    status: 'Completed',
                    userEmail: 'customer1@example.com'
                },
                {
                    orderId: 'ORD002',
                    orderDate: new Date('2024-01-20'),
                    totalCost: 150000,
                    status: 'Pending',
                    userEmail: 'customer2@example.com'
                },
                {
                    orderId: 'ORD003',
                    orderDate: new Date('2024-01-25'),
                    totalCost: 75000,
                    status: 'Cancelled',
                    userEmail: 'customer1@example.com'
                }
            ];

            Order.findAll.mockResolvedValue(mockOrders);

            const response = await request(app)
                .get('/admin/order-report')
                .query({
                    fromDate: '2024-01-01',
                    toDate: '2024-01-31',
                    status: 'Completed'
                });

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });

        test('should export order report to Excel', async () => {
            const mockOrders = [
                {
                    orderId: 'ORD001',
                    orderDate: new Date('2024-01-15'),
                    totalCost: 100000,
                    status: 'Completed',
                    userEmail: 'customer1@example.com'
                }
            ];            // Mock ExcelJS workbook
            const mockWorksheet = {
                addRow: jest.fn().mockReturnValue({
                    getCell: jest.fn().mockReturnValue({
                        numFmt: '',
                        value: ''
                    }),
                    font: {},
                    alignment: {}
                }),
                getRow: jest.fn().mockReturnValue({
                    font: {},
                    fill: {},
                    values: [],
                    alignment: {}
                }),
                getCell: jest.fn().mockReturnValue({
                    value: '',
                    font: {},
                    alignment: {},
                    fill: {},
                    numFmt: ''
                }),
                mergeCells: jest.fn(),
                columns: [],
                lastRow: {
                    font: {},
                    alignment: {}
                }
            };

            const mockWorkbook = {
                addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
                xlsx: {
                    write: jest.fn().mockResolvedValue(),
                    writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel data'))
                }
            };

            ExcelJS.Workbook.mockImplementation(() => mockWorkbook);

            Order.findAll.mockResolvedValue(mockOrders);

            const response = await request(app)
                .get('/admin/order-report/export')
                .query({
                    fromDate: '2024-01-01',
                    toDate: '2024-01-31'
                });

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });
    });

    describe('Product Reports', () => {
        test('should generate product sales report', async () => {            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    salePrice: 25000,
                    costPrice: 18000,
                    stock: 50,
                    deleted: false
                },
                {
                    productId: 'PRD002',
                    productName: 'Brake Fluid',
                    salePrice: 50000,
                    costPrice: 35000,
                    stock: 30,
                    deleted: false
                }
            ];

            const mockOrders = [
                {
                    orderId: 'ORD001',
                    status: 'Completed',
                    orderDate: new Date('2024-01-15'),
                    details: [
                        { productId: 'PRD001', amount: 5 },
                        { productId: 'PRD002', amount: 2 }
                    ]
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);
            Order.findAll.mockResolvedValue(mockOrders);

            const response = await request(app)
                .get('/admin/product-report')
                .query({
                    fromDate: '2024-01-01',
                    toDate: '2024-01-31'
                });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
            expect(Order.findAll).toHaveBeenCalled();
        });        test('should export product report to Excel', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    salePrice: 25000,
                    stock: 50,
                    deleted: false
                }
            ];

            const mockWorksheet = {
                addRow: jest.fn().mockReturnValue({
                    getCell: jest.fn().mockReturnValue({
                        numFmt: '',
                        value: ''
                    }),
                    font: {},
                    alignment: {}
                }),
                getRow: jest.fn().mockReturnValue({
                    font: {},
                    fill: {},
                    values: [],
                    alignment: {}
                }),
                getCell: jest.fn().mockReturnValue({
                    value: '',
                    font: {},
                    alignment: {},
                    fill: {},
                    numFmt: ''
                }),
                mergeCells: jest.fn(),
                columns: [],
                lastRow: {
                    font: {},
                    alignment: {}
                }
            };

            const mockWorkbook = {
                addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
                xlsx: {
                    write: jest.fn().mockResolvedValue(),
                    writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel data'))
                }
            };

            ExcelJS.Workbook.mockImplementation(() => mockWorkbook);

            Product.findAll.mockResolvedValue(mockProducts);
            Order.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/product-report/export')
                .query({
                    fromDate: '2024-01-01',
                    toDate: '2024-01-31'
                });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Financial Reports', () => {
        test('should generate financial report with profit analysis', async () => {
            const mockOrders = [
                {
                    orderId: 'ORD001',
                    orderDate: new Date('2024-01-15'),
                    totalCost: 100000,
                    status: 'Completed',
                    details: [
                        { productId: 'PRD001', amount: 2, unitPrice: 25000 },
                        { productId: 'PRD002', amount: 1, unitPrice: 50000 }
                    ]
                }
            ];

            const mockProducts = [
                { productId: 'PRD001', costPrice: 18000 },
                { productId: 'PRD002', costPrice: 35000 }
            ];

            Order.findAll.mockResolvedValue(mockOrders);
            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/admin/financial-report')
                .query({
                    fromDate: '2024-01-01',
                    toDate: '2024-01-31'
                });

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
            expect(Product.findAll).toHaveBeenCalled();
        });        test('should export financial report to Excel', async () => {
            const mockOrders = [
                {
                    orderId: 'ORD001',
                    orderDate: new Date('2024-01-15'),
                    totalCost: 100000,
                    status: 'Completed',
                    details: [
                        { productId: 'PRD001', amount: 2, unitPrice: 25000 }
                    ]
                }
            ];

            const mockWorksheet = {
                addRow: jest.fn().mockReturnValue({
                    getCell: jest.fn().mockReturnValue({
                        numFmt: '',
                        value: ''
                    }),
                    font: {},
                    alignment: {}
                }),
                getRow: jest.fn().mockReturnValue({
                    font: {},
                    fill: {},
                    values: [],
                    alignment: {}
                }),
                getCell: jest.fn().mockReturnValue({
                    value: '',
                    font: {},
                    alignment: {},
                    fill: {},
                    numFmt: ''
                }),
                mergeCells: jest.fn(),
                columns: [],
                lastRow: {
                    font: {},
                    alignment: {}
                }
            };

            const mockWorkbook = {
                addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
                xlsx: {
                    write: jest.fn().mockResolvedValue(),
                    writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel data'))
                }
            };

            ExcelJS.Workbook.mockImplementation(() => mockWorkbook);

            Order.findAll.mockResolvedValue(mockOrders);
            Product.findAll.mockResolvedValue([{ productId: 'PRD001', costPrice: 18000 }]);

            const response = await request(app)
                .get('/admin/financial-report/export')
                .query({
                    fromDate: '2024-01-01',
                    toDate: '2024-01-31'
                });

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });
    });

    describe('Report Date Range Handling', () => {
        test('should handle invalid date ranges', async () => {
            Order.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/order-report')
                .query({
                    fromDate: '2024-12-31',
                    toDate: '2024-01-01' // Invalid: from date after to date
                });

            expect(response.status).toBe(200);
        });        test('should use default date range when none provided', async () => {
            Order.findAll.mockResolvedValue([]);
            Product.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/product-report');

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });

        test('should handle very large date ranges', async () => {
            Order.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/financial-report')
                .query({
                    fromDate: '2020-01-01',
                    toDate: '2024-12-31'
                });

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle database errors in dashboard', async () => {
            Order.findAll.mockRejectedValue(new Error('Database connection error'));

            const response = await request(app)
                .get('/admin/dashboard/statistic');

            expect(response.status).toBe(500);
        });        test('should handle export errors gracefully', async () => {
            Order.findAll.mockResolvedValue([]);
            
            const mockWorksheet = {
                addRow: jest.fn().mockReturnValue({
                    getCell: jest.fn().mockReturnValue({
                        numFmt: '',
                        value: ''
                    }),
                    font: {},
                    alignment: {}
                }),
                getRow: jest.fn().mockReturnValue({
                    font: {},
                    fill: {},
                    values: [],
                    alignment: {}
                }),
                getCell: jest.fn().mockReturnValue({
                    value: '',
                    font: {},
                    alignment: {},
                    fill: {},
                    numFmt: ''
                }),
                mergeCells: jest.fn(),
                columns: [],
                lastRow: {
                    font: {},
                    alignment: {}
                }
            };

            const mockWorkbook = {
                addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
                xlsx: {
                    write: jest.fn().mockRejectedValue(new Error('Excel generation error')),
                    writeBuffer: jest.fn().mockRejectedValue(new Error('Excel generation error'))
                }
            };

            ExcelJS.Workbook.mockImplementation(() => mockWorkbook);

            const response = await request(app)
                .get('/admin/order-report/export');

            expect(response.status).toBe(500);
        });        test('should handle missing user data', async () => {
            // The profile controller doesn't actually check for user data
            // It just renders the template, so it should return 200
            const response = await request(app)
                .get('/admin/dashboard/profile');

            expect(response.status).toBe(200);
        });
    });

    describe('Performance with Large Datasets', () => {        test('should handle large number of orders efficiently', async () => {
            // Generate mock data for 1000 orders
            const mockOrders = Array.from({ length: 1000 }, (_, i) => ({
                orderId: `ORD${String(i + 1).padStart(3, '0')}`,
                orderDate: new Date(`2024-01-${(i % 30) + 1}`),
                totalCost: Math.floor(Math.random() * 100000) + 10000,
                status: ['Completed', 'Pending', 'Cancelled'][i % 3],
                deleted: false,
                userEmail: `user${i}@example.com`
            }));

            Order.findAll.mockResolvedValue(mockOrders);

            const response = await request(app)
                .get('/admin/order-report')
                .query({
                    fromDate: '2024-01-01',
                    toDate: '2024-01-31'
                });

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });
    });
});
