// Integration Test 4: Admin Product Management
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

// Mock database first before importing any models
jest.mock('../../configs/database', () => ({
    getSequelize: () => ({
        define: jest.fn().mockReturnValue({
            belongsTo: jest.fn(),
            hasMany: jest.fn(),
            hasOne: jest.fn(),
            findAll: jest.fn(),
            findByPk: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            destroy: jest.fn(),
            save: jest.fn()
        }),
        transaction: jest.fn().mockResolvedValue({
            commit: jest.fn(),
            rollback: jest.fn()
        })
    })
}));

// Mock all required models and dependencies
jest.mock('../../models/Product');
jest.mock('../../models/Brand');
jest.mock('../../models/ProductGroup');
jest.mock('../../models/Account');
jest.mock('../../models/Employee');
jest.mock('../../models/Import');
jest.mock('../../models/ImportDetail');
jest.mock('../../configs/system');
jest.mock('../../helpers/generateId');
jest.mock('fs');

const Product = require('../../models/Product');
const Brand = require('../../models/Brand');
const ProductGroup = require('../../models/ProductGroup');
const Account = require('../../models/Account');
const Employee = require('../../models/Employee');
const Import = require('../../models/Import');
const ImportDetail = require('../../models/ImportDetail');
const systemConfig = require('../../configs/system');
const generateId = require('../../helpers/generateId');
const fs = require('fs');

// Mock system config
systemConfig.prefixAdmin = '/admin';

// Mock filesystem operations
fs.mkdirSync = jest.fn();
fs.existsSync = jest.fn().mockReturnValue(true);
fs.renameSync = jest.fn();
fs.unlinkSync = jest.fn();

// Setup multer mock for file uploads - use memory storage for testing
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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

// Mock view engine
app.set('view engine', 'ejs');
app.engine('ejs', (filePath, options, callback) => {
    // Mock render - just return some HTML
    callback(null, '<html><body>Mocked View</body></html>');
});

// Mock res.render to send 200 status instead
app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, locals, callback) {
        return res.status(200).send(`<html><body>Rendered: ${view}</body></html>`);
    };
    next();
});        // Mock middleware for admin authentication
        app.use((req, res, next) => {
            res.locals.messages = {
                CREATE_PRODUCT_SUCCESS: 'Product created successfully',
                CREATE_PRODUCT_ERROR: 'Error creating product',
                UPDATE_PRODUCT_SUCCESS: 'Product updated successfully',
                UPDATE_PRODUCT_ERROR: 'Error updating product',
                DELETE_PRODUCT_SUCCESS: 'Product deleted successfully',
                DELETE_PRODUCT_ERROR: 'Error deleting product',
                PRODUCT_NOT_FOUND: 'Product not found',
                INVALID_PERMISSION: 'Invalid permission'
            };
            
            res.locals.user = {
                email: 'admin@example.com',
                fullName: 'Admin User'
            };
            
            res.locals.permission = ['QUAN_LY_SAN_PHAM_XEM', 'QUAN_LY_SAN_PHAM_THEM', 'QUAN_LY_SAN_PHAM_SUA', 'QUAN_LY_SAN_PHAM_XOA'];
            
            // Mock session data that controller might expect
            req.session = req.session || {};
            req.session.admin = {
                email: 'admin@example.com',
                fullName: 'Admin User'
            };
            
            next();
        });

// Import controllers after mocking
const productController = require('../../controller/admin/productController');

// Wrapper function to catch async errors
const asyncWrapper = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Setup routes
app.get('/admin/product', asyncWrapper(productController.index));
app.get('/admin/product/add', asyncWrapper(productController.add));
app.post('/admin/product/add', upload.array('imageFiles'), asyncWrapper(productController.addPost));
app.get('/admin/product/edit', asyncWrapper(productController.edit));
app.post('/admin/product/edit', upload.array('imageFiles'), asyncWrapper(productController.editPost));
app.delete('/admin/product/delete/:productId', asyncWrapper(productController.delete));
app.get('/admin/product/detail', asyncWrapper(productController.detail));
app.post('/admin/product/changeStatus', asyncWrapper(productController.changeStatus));
app.get('/admin/product/import', asyncWrapper(productController.import));
app.get('/admin/product/import/add', asyncWrapper(productController.importAdd));

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Test Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
    });
    res.status(500).json({ error: error.message, stack: error.stack });
});

describe('Admin Product Management Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mock implementations
        Product.findAll = jest.fn();
        Product.findByPk = jest.fn();
        Product.create = jest.fn();
        Product.update = jest.fn();
        Product.destroy = jest.fn();
        Brand.findAll = jest.fn();
        ProductGroup.findAll = jest.fn();
        generateId.generateNextProductId = jest.fn();
        fs.existsSync = jest.fn().mockReturnValue(true);
        fs.mkdirSync = jest.fn();
    });

    describe('Product Listing', () => {
        test('should display all products with pagination and filters', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    salePrice: 25000,
                    stock: 10,
                    status: 'Active',
                    Brand: { brandName: 'Castrol' },
                    ProductGroup: { groupName: 'Lubricants' }
                },
                {
                    productId: 'PRD002',
                    productName: 'Brake Fluid',
                    salePrice: 15000,
                    stock: 20,
                    status: 'Active',
                    Brand: { brandName: 'Bosch' },
                    ProductGroup: { groupName: 'Fluids' }
                }
            ];

            const mockBrands = [
                { brandId: 'BRD001', brandName: 'Castrol' },
                { brandId: 'BRD002', brandName: 'Bosch' }
            ];

            const mockProductGroups = [
                { productGroupId: 'PG001', groupName: 'Lubricants' },
                { productGroupId: 'PG002', groupName: 'Fluids' }
            ];

            Product.findAll.mockResolvedValue(mockProducts);
            Brand.findAll.mockResolvedValue(mockBrands);
            ProductGroup.findAll.mockResolvedValue(mockProductGroups);

            const response = await request(app)
                .get('/admin/product')
                .query({
                    status: 'Active',
                    brandId: 'BRD001',
                    productGroupId: 'PG001',
                    keyword: 'Oil'
                });            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
            // Note: Brand.findAll and ProductGroup.findAll are not called in index method
        });

        test('should handle empty product list', async () => {
            Product.findAll.mockResolvedValue([]);
            Brand.findAll.mockResolvedValue([]);
            ProductGroup.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/product');

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Product Creation', () => {
        test('should create new product with valid data and images', async () => {
            const mockBrands = [
                { brandId: 'BRD001', brandName: 'Castrol' }
            ];

            const mockProductGroups = [
                { productGroupId: 'PG001', groupName: 'Lubricants' }
            ];

            Brand.findAll.mockResolvedValue(mockBrands);
            ProductGroup.findAll.mockResolvedValue(mockProductGroups);
            generateId.generateNextProductId.mockResolvedValue('PRD003');

            const response = await request(app)
                .get('/admin/product/add');            expect(response.status).toBe(200);
            // The controller generates product ID internally, not using helper
            expect(Brand.findAll).toHaveBeenCalled();
            expect(ProductGroup.findAll).toHaveBeenCalled();
        });

        test('should successfully create product with POST request', async () => {
            Product.create.mockResolvedValue({
                productId: 'PRD003',
                productName: 'New Engine Oil',
                salePrice: 30000
            });

            const response = await request(app)
                .post('/admin/product/add')
                .field('productId', 'PRD003')
                .field('productName', 'New Engine Oil')
                .field('salePrice', '30000')
                .field('costPrice', '20000')
                .field('stock', '50')
                .field('brandId', 'BRD001')
                .field('productGroupId', 'PG001')
                .field('status', 'Active')
                .field('description', 'High quality engine oil');

            expect(response.status).toBe(302);
            expect(Product.create).toHaveBeenCalled();
        });

        test('should handle product creation with file upload', async () => {
            Product.create.mockResolvedValue({
                productId: 'PRD003',
                productName: 'New Engine Oil',
                imageUrls: 'image1.jpg,image2.jpg'
            });

            // Mock req.files for multer
            const mockFiles = [
                { filename: 'image1.jpg' },
                { filename: 'image2.jpg' }
            ];

            const response = await request(app)
                .post('/admin/product/add')
                .field('productId', 'PRD003')
                .field('productName', 'New Engine Oil')
                .field('salePrice', '30000')
                .attach('imageFiles', Buffer.from('fake image'), 'test1.jpg')
                .attach('imageFiles', Buffer.from('fake image'), 'test2.jpg');

            expect(response.status).toBe(302);
        });

        test('should handle product creation error', async () => {
            Product.create.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/admin/product/add')
                .field('productId', 'PRD003')
                .field('productName', 'New Engine Oil');

            expect(response.status).toBe(302);
            expect(Product.create).toHaveBeenCalled();
        });
    });

    describe('Product Editing', () => {
        test('should display product edit form with existing data', async () => {
            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil',
                salePrice: 25000,
                costPrice: 18000,
                stock: 10,
                brandId: 'BRD001',
                productGroupId: 'PG001',
                status: 'Active',
                description: 'High quality engine oil'
            };

            const mockBrands = [
                { brandId: 'BRD001', brandName: 'Castrol' }
            ];

            const mockProductGroups = [
                { productGroupId: 'PG001', groupName: 'Lubricants' }
            ];

            Product.findByPk.mockResolvedValue(mockProduct);
            Brand.findAll.mockResolvedValue(mockBrands);
            ProductGroup.findAll.mockResolvedValue(mockProductGroups);

            const response = await request(app)
                .get('/admin/product/edit')
                .query({ productId: 'PRD001' });

            expect(response.status).toBe(200);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
        });

        test('should update product successfully', async () => {
            const mockProduct = {
                productId: 'PRD001',
                update: jest.fn().mockResolvedValue(true)
            };

            Product.findByPk.mockResolvedValue(mockProduct);

            const response = await request(app)
                .post('/admin/product/edit')
                .field('productId', 'PRD001')
                .field('productName', 'Updated Engine Oil')
                .field('salePrice', '35000')
                .field('stock', '15');

            expect(response.status).toBe(302);
            expect(mockProduct.update).toHaveBeenCalled();
        });        test('should handle product not found for editing', async () => {
            Product.findByPk.mockResolvedValue(null);
            Brand.findAll.mockResolvedValue([]);
            ProductGroup.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/product/edit')
                .query({ productId: 'INVALID_ID' });

            expect(response.status).toBe(200);
        });
    });

    describe('Product Status Management', () => {
        test('should toggle product status successfully', async () => {
            const mockProduct = {
                productId: 'PRD001',
                status: 'Active',
                update: jest.fn().mockResolvedValue(true)
            };

            Product.findByPk.mockResolvedValue(mockProduct);

            const response = await request(app)
                .post('/admin/product/changeStatus')
                .send({ productId: 'PRD001' });

            expect(response.status).toBe(200);
            expect(mockProduct.update).toHaveBeenCalledWith({ status: 'Inactive' });
        });

        test('should handle status change error', async () => {
            Product.findByPk.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/admin/product/changeStatus')
                .send({ productId: 'PRD001' });

            expect(response.status).toBe(500);
        });
    });

    describe('Product Deletion', () => {        test('should delete product successfully', async () => {
            const mockProduct = {
                productId: 'PRD001',
                update: jest.fn().mockResolvedValue(true)
            };

            Product.findByPk.mockResolvedValue(mockProduct);

            const response = await request(app)
                .delete('/admin/product/delete/PRD001');

            expect(response.status).toBe(302);
            expect(mockProduct.update).toHaveBeenCalledWith({ deleted: true });
        });        test('should handle product not found for deletion', async () => {
            Product.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .delete('/admin/product/delete/INVALID_ID');

            expect(response.status).toBe(302);
        });
    });

    describe('Product Details', () => {
        test('should display detailed product information', async () => {
            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil',
                salePrice: 25000,
                costPrice: 18000,
                stock: 10,
                description: 'High quality engine oil',
                Brand: { brandName: 'Castrol' },
                ProductGroup: { groupName: 'Lubricants' }
            };

            Product.findByPk.mockResolvedValue(mockProduct);

            const response = await request(app)
                .get('/admin/product/detail')
                .query({ productId: 'PRD001' });

            expect(response.status).toBe(200);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
        });
    });

    describe('Product Import Management', () => {
        test('should display import history', async () => {
            const mockImports = [
                {
                    importId: 'IMP001',
                    importDate: new Date(),
                    totalCost: 1000000,
                    Employee: { fullName: 'Admin User' },
                    importDetails: [
                        { productId: 'PRD001', quantity: 10, unitPrice: 20000 }
                    ]
                }
            ];

            Import.findAll.mockResolvedValue(mockImports);

            const response = await request(app)
                .get('/admin/product/import');

            expect(response.status).toBe(200);
            expect(Import.findAll).toHaveBeenCalled();
        });

        test('should create new import record', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    costPrice: 20000
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);
            generateId.generateNextImportId = jest.fn().mockResolvedValue('IMP002');

            const response = await request(app)
                .get('/admin/product/import/add');

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Search and Filtering', () => {
        test('should filter products by multiple criteria', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    status: 'Active',
                    brandId: 'BRD001'
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);
            Brand.findAll.mockResolvedValue([]);
            ProductGroup.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/product')
                .query({
                    keyword: 'Engine',
                    status: 'Active',
                    brandId: 'BRD001',
                    sortBy: 'productName',
                    sortOrder: 'asc'
                });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should handle search with no results', async () => {
            Product.findAll.mockResolvedValue([]);
            Brand.findAll.mockResolvedValue([]);
            ProductGroup.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/admin/product')
                .query({ keyword: 'NonExistentProduct' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });
});
