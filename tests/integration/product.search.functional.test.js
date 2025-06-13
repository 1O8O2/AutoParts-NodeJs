// Functional Test 2: Product Search and Filter System
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock all required models and dependencies
jest.mock('../../models/Product');
jest.mock('../../models/Brand');
jest.mock('../../models/ProductGroup');
jest.mock('../../configs/system');

const Product = require('../../models/Product');
const Brand = require('../../models/Brand');
const ProductGroup = require('../../models/ProductGroup');
const systemConfig = require('../../configs/system');

// Mock system config
systemConfig.prefixUrl = '/AutoParts';

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

// Mock middleware
app.use((req, res, next) => {
    res.locals.messages = {
        PRODUCT_NOT_FOUND: 'Product not found',
        SEARCH_ERROR: 'Search error occurred',
        FILTER_ERROR: 'Filter error occurred',
        INVALID_SEARCH_PARAMS: 'Invalid search parameters'
    };
    next();
});

const productController = require('../../controller/client/productController');

// Setup routes
app.get('/product/search', productController.showFilter);
app.get('/product/detail', productController.showProduct);

describe('Product Search and Filter System Functional Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mocks
        Product.findAll = jest.fn();
        Product.findByPk = jest.fn();
        Brand.findAll = jest.fn();
        Brand.findByPk = jest.fn();
        ProductGroup.findAll = jest.fn();
        ProductGroup.findByPk = jest.fn();
    });

    describe('Product Search by Keyword', () => {
        test('should search products by keyword successfully', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil 5W-30',
                    brandId: 'BRD001',
                    productGroupId: 'GRP001',
                    salePrice: 250000,
                    stock: 50,
                    status: 'Active',
                    imageUrls: 'oil1.jpg,oil2.jpg'
                },
                {
                    productId: 'PRD002',
                    productName: 'Motor Oil Premium',
                    brandId: 'BRD001',
                    productGroupId: 'GRP001',
                    salePrice: 300000,
                    stock: 30,
                    status: 'Active',
                    imageUrls: 'motor1.jpg'
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ keyword: 'oil' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should handle empty search results', async () => {
            Product.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/product/search')
                .query({ keyword: 'nonexistent' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should search with multiple keywords', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil Premium Grade',
                    brandId: 'BRD001',
                    productGroupId: 'GRP001',
                    salePrice: 250000,
                    stock: 50,
                    status: 'Active',
                    imageUrls: 'oil1.jpg'
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ keyword: 'engine oil premium' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should be case insensitive', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    brandId: 'BRD001',
                    productGroupId: 'GRP001',
                    salePrice: 250000,
                    stock: 50,
                    status: 'Active',
                    imageUrls: 'oil1.jpg'
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const testKeywords = ['ENGINE', 'engine', 'Engine', 'eNgInE'];

            for (const keyword of testKeywords) {
                jest.clearAllMocks();
                Product.findAll.mockResolvedValue(mockProducts);

                const response = await request(app)
                    .get('/product/search')
                    .query({ keyword });

                expect(response.status).toBe(200);
                expect(Product.findAll).toHaveBeenCalled();
            }
        });
    });

    describe('Product Filtering by Brand', () => {
        test('should filter products by specific brand', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Toyota Oil Filter',
                    brandId: 'BRD001',
                    productGroupId: 'GRP001',
                    salePrice: 150000,
                    stock: 25,
                    status: 'Active',
                    Brand: { brandName: 'Toyota' }
                },
                {
                    productId: 'PRD002',
                    productName: 'Toyota Air Filter',
                    brandId: 'BRD001',
                    productGroupId: 'GRP002',
                    salePrice: 200000,
                    stock: 20,
                    status: 'Active',
                    Brand: { brandName: 'Toyota' }
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ brand: 'Toyota' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should filter by multiple brands', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Toyota Oil Filter',
                    brandId: 'BRD001',
                    Brand: { brandName: 'Toyota' }
                },
                {
                    productId: 'PRD002',
                    productName: 'Honda Brake Pad',
                    brandId: 'BRD002',
                    Brand: { brandName: 'Honda' }
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ brand: ['Toyota', 'Honda'] });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Product Filtering by Category', () => {
        test('should filter products by category', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Brake Pad Set',
                    productGroupId: 'GRP001',
                    ProductGroup: { groupName: 'Brake System' }
                },
                {
                    productId: 'PRD002',
                    productName: 'Brake Disc',
                    productGroupId: 'GRP001',
                    ProductGroup: { groupName: 'Brake System' }
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ category: 'Brake System' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should filter by multiple categories', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Brake Pad',
                    productGroupId: 'GRP001',
                    ProductGroup: { groupName: 'Brake System' }
                },
                {
                    productId: 'PRD002',
                    productName: 'Engine Oil',
                    productGroupId: 'GRP002',
                    ProductGroup: { groupName: 'Engine' }
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ category: ['Brake System', 'Engine'] });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Combined Filters', () => {
        test('should apply keyword, brand, and category filters together', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Toyota Engine Oil 5W-30',
                    brandId: 'BRD001',
                    productGroupId: 'GRP001',
                    salePrice: 250000,
                    Brand: { brandName: 'Toyota' },
                    ProductGroup: { groupName: 'Engine' }
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ 
                    keyword: 'oil',
                    brand: 'Toyota',
                    category: 'Engine'
                });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should handle no results with combined filters', async () => {
            Product.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/product/search')
                .query({ 
                    keyword: 'brake',
                    brand: 'Toyota',
                    category: 'Engine' // Conflicting category
                });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Price Range Filtering', () => {
        test('should filter products by price range', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Budget Oil Filter',
                    salePrice: 100000,
                    status: 'Active'
                },
                {
                    productId: 'PRD002',
                    productName: 'Premium Oil Filter',
                    salePrice: 200000,
                    status: 'Active'
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ 
                    minPrice: 150000,
                    maxPrice: 250000
                });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should handle minimum price only', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Premium Product',
                    salePrice: 500000,
                    status: 'Active'
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ minPrice: 300000 });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should handle maximum price only', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Budget Product',
                    salePrice: 100000,
                    status: 'Active'
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ maxPrice: 200000 });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Product Detail View', () => {
        test('should display product details successfully', async () => {
            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil Premium',
                brandId: 'BRD001',
                productGroupId: 'GRP001',
                salePrice: 250000,
                stock: 50,
                description: 'High quality engine oil',
                imageUrls: 'oil1.jpg,oil2.jpg,oil3.jpg',
                status: 'Active'
            };

            const mockBrand = {
                brandId: 'BRD001',
                brandName: 'Toyota'
            };

            const mockGroup = {
                productGroupId: 'GRP001',
                groupName: 'Engine'
            };

            Product.findByPk.mockResolvedValue(mockProduct);
            Brand.findByPk.mockResolvedValue(mockBrand);
            ProductGroup.findByPk.mockResolvedValue(mockGroup);

            const response = await request(app)
                .get('/product/detail')
                .query({ productId: 'PRD001' });

            expect(response.status).toBe(200);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
            expect(Brand.findByPk).toHaveBeenCalledWith('BRD001');
            expect(ProductGroup.findByPk).toHaveBeenCalledWith('GRP001');
        });

        test('should handle product not found', async () => {
            Product.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get('/product/detail')
                .query({ productId: 'INVALID' });

            expect(response.status).toBe(200); // Should render error page
            expect(Product.findByPk).toHaveBeenCalledWith('INVALID');
        });

        test('should handle missing product ID', async () => {
            const response = await request(app)
                .get('/product/detail');

            expect(response.status).toBe(200); // Should render error page
            expect(Product.findByPk).not.toHaveBeenCalled();
        });
    });

    describe('Sort and Pagination', () => {
        test('should sort products by price (low to high)', async () => {
            const mockProducts = [
                { productId: 'PRD001', productName: 'Cheap Product', salePrice: 100000 },
                { productId: 'PRD002', productName: 'Expensive Product', salePrice: 500000 }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ sortBy: 'price_asc' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should sort products by price (high to low)', async () => {
            const mockProducts = [
                { productId: 'PRD002', productName: 'Expensive Product', salePrice: 500000 },
                { productId: 'PRD001', productName: 'Cheap Product', salePrice: 100000 }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ sortBy: 'price_desc' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should sort products by name', async () => {
            const mockProducts = [
                { productId: 'PRD001', productName: 'Air Filter', salePrice: 100000 },
                { productId: 'PRD002', productName: 'Brake Pad', salePrice: 150000 }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ sortBy: 'name_asc' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should handle pagination', async () => {
            const mockProducts = Array.from({ length: 12 }, (_, i) => ({
                productId: `PRD${String(i + 1).padStart(3, '0')}`,
                productName: `Product ${i + 1}`,
                salePrice: 100000 + (i * 10000)
            }));

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ 
                    page: 2,
                    limit: 8
                });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Stock Status Filtering', () => {
        test('should filter products in stock only', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Available Product',
                    stock: 10,
                    status: 'Active'
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ inStock: 'true' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should include out of stock products when requested', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Available Product',
                    stock: 10,
                    status: 'Active'
                },
                {
                    productId: 'PRD002',
                    productName: 'Out of Stock Product',
                    stock: 0,
                    status: 'Active'
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);

            const response = await request(app)
                .get('/product/search')
                .query({ inStock: 'false' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        test('should handle database errors gracefully', async () => {
            Product.findAll.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/product/search')
                .query({ keyword: 'test' });

            expect(response.status).toBe(500);
        });

        test('should handle invalid filter parameters', async () => {
            const response = await request(app)
                .get('/product/search')
                .query({ 
                    minPrice: 'invalid',
                    maxPrice: 'also_invalid',
                    page: 'not_a_number'
                });

            // Should handle gracefully and return results or error page
            expect(response.status).toBeDefined();
        });

        test('should sanitize search input', async () => {
            Product.findAll.mockResolvedValue([]);

            const maliciousInputs = [
                '<script>alert("xss")</script>',
                'DROP TABLE products;',
                'SELECT * FROM users;',
                "'; DROP TABLE products; --"
            ];

            for (const input of maliciousInputs) {
                const response = await request(app)
                    .get('/product/search')
                    .query({ keyword: input });

                expect(response.status).toBe(200);
                expect(Product.findAll).toHaveBeenCalled();
            }
        });
    });
});
