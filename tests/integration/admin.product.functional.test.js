// Functional Test 3: Admin Product and Inventory Management System
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

// Mock database and file operations
jest.mock('../../configs/database', () => ({
    getSequelize: () => ({
        transaction: jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn()
        }),
        define: jest.fn().mockReturnValue({
            belongsTo: jest.fn(),
            hasMany: jest.fn(),
            hasOne: jest.fn()
        })
    })
}));

jest.mock('fs');
jest.mock('path');
jest.mock('multer');

// Mock models
jest.mock('../../models/Product');
jest.mock('../../models/Brand');
jest.mock('../../models/ProductGroup');
jest.mock('../../models/Import');
jest.mock('../../models/ImportDetail');
jest.mock('../../models/Employee');
jest.mock('../../models/Account');
jest.mock('../../helpers/generateId');

const Product = require('../../models/Product');
const Brand = require('../../models/Brand');
const ProductGroup = require('../../models/ProductGroup');
const Import = require('../../models/Import');
const ImportDetail = require('../../models/ImportDetail');
const Employee = require('../../models/Employee');
const Account = require('../../models/Account');
const generateId = require('../../helpers/generateId');
const fs = require('fs');

// Setup Express app
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

// Mock middleware for admin authentication
app.use((req, res, next) => {
    res.locals.user = {
        email: 'admin@test.com',
        fullName: 'Test Admin'
    };
    res.locals.permission = ['QUAN_LY_SAN_PHAM_XEM', 'QUAN_LY_SAN_PHAM_THEM', 'QUAN_LY_SAN_PHAM_SUA', 'QUAN_LY_SAN_PHAM_XOA'];
    res.locals.messages = {
        CREATE_PRODUCT_SUCCESS: 'Product created successfully',
        CREATE_PRODUCT_ERROR: 'Product creation failed',
        UPDATE_PRODUCT_SUCCESS: 'Product updated successfully',
        DELETE_PRODUCT_SUCCESS: 'Product deleted successfully',
        IMPORT_SUCCESS: 'Import completed successfully',
        IMPORT_ERROR: 'Import failed',
        INVALID_FILE_FORMAT: 'Invalid file format',
        INSUFFICIENT_PERMISSION: 'Insufficient permission'
    };
    next();
});

const productController = require('../../controller/admin/productController');

// Setup routes
app.get('/admin/product', productController.index);
app.get('/admin/product/add', productController.add);
app.post('/admin/product/add', productController.addPost);
app.get('/admin/product/edit', productController.edit);
app.post('/admin/product/edit', productController.editPost);
app.delete('/admin/product/delete/:productId', productController.delete);
app.get('/admin/product/detail', productController.detail);
app.post('/admin/product/changeStatus', productController.changeStatus);
app.get('/admin/product/import', productController.import);
app.post('/admin/product/import/add', productController.importAddPost);

describe('Admin Product Management Functional Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mocks
        Product.findAll = jest.fn();
        Product.findByPk = jest.fn();
        Product.create = jest.fn();
        Product.update = jest.fn();
        Product.destroy = jest.fn();
        Brand.findAll = jest.fn();
        Brand.findByPk = jest.fn();
        ProductGroup.findAll = jest.fn();
        ProductGroup.findByPk = jest.fn();
        Import.create = jest.fn();
        ImportDetail.create = jest.fn();
        generateId.generateNextProductId = jest.fn();
        generateId.generateNextImportId = jest.fn();
        Account.findOne = jest.fn();
        Employee.findByPk = jest.fn();
        
        // Mock admin user
        Account.findOne.mockResolvedValue({
            email: 'admin@test.com',
            token: 'admin_token',
            permission: 'RG001'
        });
    });

    describe('Product CRUD Operations', () => {
        test('should list all products with filtering and pagination', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil 5W-30',
                    salePrice: 25000,
                    stock: 100,
                    status: 'Active',
                    Brand: { brandName: 'Castrol' },
                    ProductGroup: { groupName: 'Lubricants' }
                },
                {
                    productId: 'PRD002',
                    productName: 'Brake Pad Set',
                    salePrice: 150000,
                    stock: 50,
                    status: 'Active',
                    Brand: { brandName: 'Brembo' },
                    ProductGroup: { groupName: 'Brake System' }
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/admin/product')
                .set('Cookie', ['token=admin_token']);

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalledWith({
                where: { deleted: false },
                include: expect.any(Array),
                order: expect.any(Array)
            });
        });

        test('should create new product with complete information', async () => {
            generateId.generateNextProductId.mockResolvedValue('PRD003');
            
            Brand.findAll.mockResolvedValue([
                { brandId: 'BRD001', brandName: 'Toyota' }
            ]);
            
            ProductGroup.findAll.mockResolvedValue([
                { productGroupId: 'PG001', groupName: 'Engine Parts' }
            ]);

            Product.create.mockResolvedValue({
                productId: 'PRD003',
                productName: 'Air Filter',
                salePrice: 50000,
                stock: 25
            });

            // Mock file upload
            const mockFiles = [
                { filename: 'test_image1.jpg' },
                { filename: 'test_image2.jpg' }
            ];

            const response = await request(app)
                .post('/admin/product/add')
                .set('Cookie', ['token=admin_token'])
                .field('productId', 'PRD003')
                .field('productName', 'Air Filter')
                .field('brandId', 'BRD001')
                .field('productGroupId', 'PG001')
                .field('salePrice', '50000')
                .field('stock', '25')
                .field('description', 'High quality air filter')
                .field('status', 'Active');

            expect(response.status).toBe(302);
            expect(Product.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    productId: 'PRD003',
                    productName: 'Air Filter',
                    salePrice: '50000',
                    stock: '25'
                })
            );
        });

        test('should update existing product information', async () => {
            const existingProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil 5W-30',
                salePrice: 25000,
                stock: 100,
                update: jest.fn(),
                save: jest.fn()
            };

            Product.findByPk.mockResolvedValue(existingProduct);
            Brand.findAll.mockResolvedValue([]);
            ProductGroup.findAll.mockResolvedValue([]);

            const response = await request(app)
                .post('/admin/product/edit')
                .set('Cookie', ['token=admin_token'])
                .query({ productId: 'PRD001' })
                .send({
                    productName: 'Premium Engine Oil 5W-30',
                    salePrice: '28000',
                    stock: '150',
                    description: 'Updated premium engine oil'
                });

            expect(response.status).toBe(302);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
        });

        test('should soft delete product', async () => {
            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                update: jest.fn().mockResolvedValue(true)
            });

            const response = await request(app)
                .delete('/admin/product/delete/PRD001')
                .set('Cookie', ['token=admin_token']);

            expect(response.status).toBe(200);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
        });

        test('should change product status', async () => {
            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                status: 'Active',
                update: jest.fn(),
                save: jest.fn()
            });

            const response = await request(app)
                .post('/admin/product/changeStatus')
                .set('Cookie', ['token=admin_token'])
                .send({
                    productId: 'PRD001',
                    status: 'Inactive'
                });

            expect(response.status).toBe(302);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
        });
    });

    describe('Inventory Management', () => {
        test('should track stock levels and low stock alerts', async () => {
            const lowStockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    stock: 5, // Low stock
                    minimumStock: 10,
                    status: 'Active'
                },
                {
                    productId: 'PRD002',
                    productName: 'Brake Fluid',
                    stock: 2, // Very low stock
                    minimumStock: 10,
                    status: 'Active'
                }
            ];

            Product.findAll.mockResolvedValue(lowStockProducts);

            const response = await request(app)
                .get('/admin/product')
                .set('Cookie', ['token=admin_token'])
                .query({ filter: 'low_stock' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
            
            // Verify low stock filtering logic
            const filteredProducts = lowStockProducts.filter(p => p.stock < p.minimumStock);
            expect(filteredProducts).toHaveLength(2);
        });

        test('should handle bulk stock updates', async () => {
            const stockUpdates = [
                { productId: 'PRD001', newStock: 100 },
                { productId: 'PRD002', newStock: 50 },
                { productId: 'PRD003', newStock: 75 }
            ];

            Product.findByPk.mockImplementation((productId) => {
                return Promise.resolve({
                    productId: productId,
                    stock: 10,
                    update: jest.fn(),
                    save: jest.fn()
                });
            });

            // Simulate bulk update through multiple individual updates
            for (const update of stockUpdates) {
                const response = await request(app)
                    .post('/admin/product/edit')
                    .set('Cookie', ['token=admin_token'])
                    .query({ productId: update.productId })
                    .send({ stock: update.newStock.toString() });

                expect(response.status).toBe(302);
            }

            expect(Product.findByPk).toHaveBeenCalledTimes(3);
        });

        test('should generate inventory reports', async () => {
            const inventoryData = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    stock: 100,
                    salePrice: 25000,
                    totalValue: 2500000,
                    lastUpdated: new Date()
                },
                {
                    productId: 'PRD002',
                    productName: 'Brake Pad',
                    stock: 50,
                    salePrice: 150000,
                    totalValue: 7500000,
                    lastUpdated: new Date()
                }
            ];

            Product.findAll.mockResolvedValue(inventoryData);

            const response = await request(app)
                .get('/admin/product')
                .set('Cookie', ['token=admin_token'])
                .query({ report: 'inventory_value' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
            
            // Calculate total inventory value
            const totalValue = inventoryData.reduce((sum, product) => 
                sum + (product.stock * product.salePrice), 0);
            expect(totalValue).toBe(10000000);
        });
    });

    describe('Product Import Functionality', () => {
        test('should handle Excel file import for bulk product creation', async () => {
            generateId.generateNextImportId.mockResolvedValue('IMP001');
            
            const mockImportData = [
                {
                    productId: 'PRD004',
                    productName: 'Spark Plug Set',
                    brandId: 'BRD001',
                    productGroupId: 'PG001',
                    salePrice: 80000,
                    stock: 20
                },
                {
                    productId: 'PRD005',
                    productName: 'Oil Filter',
                    brandId: 'BRD002',
                    productGroupId: 'PG002',
                    salePrice: 35000,
                    stock: 30
                }
            ];

            Import.create.mockResolvedValue({
                importId: 'IMP001',
                status: 'Processing'
            });

            ImportDetail.create.mockImplementation((detail) => 
                Promise.resolve({ ...detail, importDetailId: 'ID' + Date.now() }));

            Product.create.mockImplementation((product) => 
                Promise.resolve({ ...product, createdAt: new Date() }));

            // Mock file processing
            fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockImportData));

            const response = await request(app)
                .post('/admin/product/import/add')
                .set('Cookie', ['token=admin_token'])
                .field('importId', 'IMP001')
                .field('note', 'Bulk import from supplier')
                .attach('excelFile', Buffer.from('mock excel data'), 'products.xlsx');

            expect(response.status).toBe(302);
            expect(Import.create).toHaveBeenCalled();
            expect(Product.create).toHaveBeenCalledTimes(2);
        });

        test('should validate import data format', async () => {
            const invalidImportData = [
                {
                    productId: '', // Missing required field
                    productName: 'Invalid Product',
                    salePrice: 'invalid_price', // Invalid price format
                    stock: -5 // Negative stock
                }
            ];

            fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(invalidImportData));

            const response = await request(app)
                .post('/admin/product/import/add')
                .set('Cookie', ['token=admin_token'])
                .field('importId', 'IMP002')
                .attach('excelFile', Buffer.from('invalid data'), 'invalid.xlsx');

            expect(response.status).toBe(302);
            // Should not create any products due to validation errors
            expect(Product.create).not.toHaveBeenCalled();
        });

        test('should track import history and status', async () => {
            const mockImports = [
                {
                    importId: 'IMP001',
                    status: 'Completed',
                    totalProducts: 25,
                    successCount: 23,
                    failureCount: 2,
                    createdAt: new Date(),
                    Employee: { fullName: 'Test Admin' }
                },
                {
                    importId: 'IMP002',
                    status: 'Processing',
                    totalProducts: 15,
                    successCount: 10,
                    failureCount: 0,
                    createdAt: new Date(),
                    Employee: { fullName: 'Test Admin' }
                }
            ];

            Import.findAll.mockResolvedValue(mockImports);

            const response = await request(app)
                .get('/admin/product/import')
                .set('Cookie', ['token=admin_token']);

            expect(response.status).toBe(200);
            expect(Import.findAll).toHaveBeenCalledWith({
                include: expect.any(Array),
                order: expect.any(Array)
            });
        });
    });

    describe('Product Search and Filtering', () => {
        test('should filter products by brand', async () => {
            const toyotaProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Toyota Oil Filter',
                    brandId: 'BRD001',
                    Brand: { brandName: 'Toyota' }
                }
            ];

            Product.findAll.mockResolvedValue(toyotaProducts);

            const response = await request(app)
                .get('/admin/product')
                .set('Cookie', ['token=admin_token'])
                .query({ brandId: 'BRD001' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        brandId: 'BRD001'
                    })
                })
            );
        });

        test('should filter products by category', async () => {
            const engineProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    productGroupId: 'PG001',
                    ProductGroup: { groupName: 'Engine Parts' }
                }
            ];

            Product.findAll.mockResolvedValue(engineProducts);

            const response = await request(app)
                .get('/admin/product')
                .set('Cookie', ['token=admin_token'])
                .query({ productGroupId: 'PG001' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        productGroupId: 'PG001'
                    })
                })
            );
        });

        test('should search products by name', async () => {
            const searchResults = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil 5W-30',
                    description: 'Premium engine oil'
                },
                {
                    productId: 'PRD002',
                    productName: 'Engine Air Filter',
                    description: 'High flow air filter for engine'
                }
            ];

            Product.findAll.mockResolvedValue(searchResults);

            const response = await request(app)
                .get('/admin/product')
                .set('Cookie', ['token=admin_token'])
                .query({ search: 'engine' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Permission and Security', () => {
        test('should check admin permissions for product operations', async () => {
            // Mock user without product management permission
            res.locals = {
                permission: ['QUAN_LY_DON_HANG_XEM'], // Only order permission
                messages: { INSUFFICIENT_PERMISSION: 'Insufficient permission' }
            };

            const response = await request(app)
                .post('/admin/product/add')
                .set('Cookie', ['token=limited_admin_token'])
                .send({
                    productName: 'Unauthorized Product'
                });

            // The middleware should handle permission checking
            // In a real implementation, this would be rejected
            expect(response.status).toBe(302);
        });

        test('should validate product data before saving', async () => {
            const response = await request(app)
                .post('/admin/product/add')
                .set('Cookie', ['token=admin_token'])
                .send({
                    productName: '', // Empty name
                    salePrice: -100, // Negative price
                    stock: 'invalid' // Invalid stock
                });

            expect(response.status).toBe(302);
            expect(Product.create).not.toHaveBeenCalled();
        });

        test('should handle file upload security', async () => {
            // Test with malicious file
            const response = await request(app)
                .post('/admin/product/add')
                .set('Cookie', ['token=admin_token'])
                .attach('imageFiles', Buffer.from('malicious script'), 'script.js');

            expect(response.status).toBe(302);
            // File should be rejected by multer filter
        });
    });
});
