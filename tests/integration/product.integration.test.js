// Integration Test 2: Product Management and Shopping Cart
const request = require('supertest');
const { createTestApp } = require('../helpers/testApp');

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

// Mock all required models
jest.mock('../../models/Product');
jest.mock('../../models/Brand');
jest.mock('../../models/ProductGroup');
jest.mock('../../models/Customer');
jest.mock('../../models/Account');
jest.mock('../../models/Cart');

const Product = require('../../models/Product');
const Brand = require('../../models/Brand');
const ProductGroup = require('../../models/ProductGroup');
const Customer = require('../../models/Customer');
const Account = require('../../models/Account');
const { Cart, ProductsInCart } = require('../../models/Cart');

// Setup Express app for testing
const app = createTestApp();

// Import controllers after mocking
const productController = require('../../controller/client/productController');

// Setup routes
app.get('/product/detail', productController.showProduct);
app.post('/product/add', productController.addProduct);
app.get('/product/search', productController.showFilter);
app.get('/product/remove', productController.deleteProduct);

describe('Product and Cart Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mock implementations
        Product.findByPk = jest.fn();
        Product.findAll = jest.fn();
        Brand.findByPk = jest.fn();
        ProductGroup.findByPk = jest.fn();
        Customer.findByPk = jest.fn();
        Account.findOne = jest.fn();
        Cart.findByPk = jest.fn();
        ProductsInCart.findOne = jest.fn();
        ProductsInCart.create = jest.fn();
        ProductsInCart.update = jest.fn();
        ProductsInCart.destroy = jest.fn();
        ProductsInCart.findAll = jest.fn();
    });

    describe('Product Display', () => {
        test('should display product details with complete information', async () => {
            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil',
                salePrice: 25000,
                stock: 10,
                imageUrls: 'image1.jpg,image2.jpg',
                description: 'High quality engine oil',
                brandId: 'BRD001',
                productGroupId: 'PG001'
            };

            const mockBrand = {
                brandId: 'BRD001',
                brandName: 'Castrol'
            };

            const mockGroup = {
                productGroupId: 'PG001',
                groupName: 'Lubricants'
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
            expect(ProductGroup.findByPk).toHaveBeenCalledWith('PG001');
        });

        test('should handle product not found scenario', async () => {
            Product.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get('/product/detail')
                .query({ productId: 'INVALID_ID' });

            expect(response.status).toBe(200);
            expect(Product.findByPk).toHaveBeenCalledWith('INVALID_ID');
        });
    });

    describe('Shopping Cart Operations', () => {        test('should add product to cart for logged-in user', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockCustomer = {
                email: 'test@example.com',
                cartId: 'CART123'
            };

            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil',
                stock: 10,
                salePrice: 25000
            };

            const mockCart = {
                cartId: 'CART123',
                products: [],
                changed: jest.fn(),
                save: jest.fn().mockResolvedValue(true)
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            Product.findByPk.mockResolvedValue(mockProduct);
            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: '2'
                });

            expect(response.status).toBe(302);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
            expect(mockCart.save).toHaveBeenCalled();
        });        test('should update quantity if product already in cart', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockCustomer = {
                email: 'test@example.com',
                cartId: 'CART123'
            };

            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil',
                stock: 10,
                salePrice: 25000
            };

            const existingCartItem = {
                product: mockProduct,
                amount: 1
            };

            const mockCart = {
                cartId: 'CART123',
                products: [existingCartItem],
                changed: jest.fn(),
                save: jest.fn().mockResolvedValue(true)
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            Product.findByPk.mockResolvedValue(mockProduct);
            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: '2'
                });

            expect(response.status).toBe(302);
            expect(mockCart.save).toHaveBeenCalled();
        });        test('should handle insufficient stock scenario', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockCustomer = {
                email: 'test@example.com',
                cartId: 'CART123'
            };

            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil',
                stock: 1, // Only 1 in stock
                salePrice: 25000
            };

            const existingCartItem = {
                product: mockProduct,
                amount: 1
            };

            const mockCart = {
                cartId: 'CART123',
                products: [existingCartItem],
                changed: jest.fn(),
                save: jest.fn().mockResolvedValue(true)
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            Product.findByPk.mockResolvedValue(mockProduct);
            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: '5' // Requesting more than available
                });

            expect(response.status).toBe(302);
            expect(mockCart.save).not.toHaveBeenCalled();
        });        test('should remove product from cart', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockCustomer = {
                email: 'test@example.com',
                cartId: 'CART123'
            };

            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil',
                stock: 10,
                salePrice: 25000
            };

            const cartItem = {
                product: mockProduct,
                amount: 2
            };

            const mockCart = {
                cartId: 'CART123',
                products: [cartItem],
                save: jest.fn().mockResolvedValue(true)
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .get('/product/remove')
                .set('Cookie', ['tokenUser=valid_token'])
                .query({ productId: 'PRD001' });

            expect(response.status).toBe(302);
            expect(mockCart.save).toHaveBeenCalled();
        });
    });

    describe('Product Search and Filtering', () => {
        test('should filter products by category', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    salePrice: 25000,
                    productGroupId: 'PG001'
                },
                {
                    productId: 'PRD002',
                    productName: 'Transmission Oil',
                    salePrice: 30000,
                    productGroupId: 'PG001'
                }
            ];

            const mockProductGroups = [
                { productGroupId: 'PG001', groupName: 'Lubricants' }
            ];

            const mockBrands = [
                { brandId: 'BRD001', brandName: 'Castrol' }
            ];

            Product.findAll.mockResolvedValue(mockProducts);
            ProductGroup.findAll.mockResolvedValue(mockProductGroups);
            Brand.findAll.mockResolvedValue(mockBrands);

            const response = await request(app)
                .get('/product/search')
                .query({ 
                    productGroupId: 'PG001',
                    sortKey: 'salePrice',
                    sortValue: 'asc'
                });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });

        test('should search products by name', async () => {
            const mockProducts = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    salePrice: 25000
                }
            ];

            Product.findAll.mockResolvedValue(mockProducts);
            ProductGroup.findAll.mockResolvedValue([]);
            Brand.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/product/search')
                .query({ keyword: 'Engine' });

            expect(response.status).toBe(200);
            expect(Product.findAll).toHaveBeenCalled();
        });
    });

    describe('Guest User Cart Operations', () => {        test('should handle cart operations for guest users', async () => {
            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil',
                stock: 10,
                salePrice: 25000
            };

            const mockCart = {
                cartId: 'GUEST_CART123',
                products: [],
                changed: jest.fn(),
                save: jest.fn().mockResolvedValue(true)
            };

            Account.findOne.mockResolvedValue(null); // Not logged in
            Product.findByPk.mockResolvedValue(mockProduct);
            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['cartId=GUEST_CART123'])
                .send({
                    productId: 'PRD001',
                    quantity: '1'
                });

            expect(response.status).toBe(302);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
        });
    });
});
