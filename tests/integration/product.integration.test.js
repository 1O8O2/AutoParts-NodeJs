// Integration Test 2: Product Management and Shopping Cart
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock all required models
jest.mock('../../models/Product');
jest.mock('../../models/Brand');
jest.mock('../../models/ProductGroup');
jest.mock('../../models/Customer');
jest.mock('../../models/Account');
jest.mock('../../models/Cart');
jest.mock('../../configs/database');

const Product = require('../../models/Product');
const Brand = require('../../models/Brand');
const ProductGroup = require('../../models/ProductGroup');
const Customer = require('../../models/Customer');
const Account = require('../../models/Account');
const { Cart, ProductsInCart } = require('../../models/Cart');

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
        PRODUCT_ADD_TO_CART_SUCCESS: 'Product added to cart successfully',
        PRODUCT_ADD_TO_CART_ERROR: 'Error adding product to cart',
        CART_UPDATE_SUCCESS: 'Cart updated successfully',
        INSUFFICIENT_STOCK: 'Insufficient stock',
        INVALID_QUANTITY: 'Invalid quantity',
        NOT_LOGGED_IN: 'Please login first'
    };
    next();
});

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

    describe('Shopping Cart Operations', () => {
        test('should add product to cart for logged-in user', async () => {
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

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            Product.findByPk.mockResolvedValue(mockProduct);
            ProductsInCart.findOne.mockResolvedValue(null); // Product not in cart yet
            ProductsInCart.create.mockResolvedValue({
                cartId: 'CART123',
                productId: 'PRD001',
                quantity: 2
            });

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: '2'
                });

            expect(response.status).toBe(302);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
            expect(ProductsInCart.create).toHaveBeenCalled();
        });

        test('should update quantity if product already in cart', async () => {
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
                cartId: 'CART123',
                productId: 'PRD001',
                quantity: 1,
                update: jest.fn().mockResolvedValue(true)
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            Product.findByPk.mockResolvedValue(mockProduct);
            ProductsInCart.findOne.mockResolvedValue(existingCartItem);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: '2'
                });

            expect(response.status).toBe(302);
            expect(existingCartItem.update).toHaveBeenCalledWith({
                quantity: 3 // 1 existing + 2 new
            });
        });

        test('should handle insufficient stock scenario', async () => {
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

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            Product.findByPk.mockResolvedValue(mockProduct);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: '5' // Requesting more than available
                });

            expect(response.status).toBe(302);
            expect(ProductsInCart.create).not.toHaveBeenCalled();
        });

        test('should remove product from cart', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockCustomer = {
                email: 'test@example.com',
                cartId: 'CART123'
            };

            const cartItem = {
                cartId: 'CART123',
                productId: 'PRD001',
                destroy: jest.fn().mockResolvedValue(true)
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            ProductsInCart.findOne.mockResolvedValue(cartItem);

            const response = await request(app)
                .get('/product/remove')
                .set('Cookie', ['tokenUser=valid_token'])
                .query({ productId: 'PRD001' });

            expect(response.status).toBe(302);
            expect(cartItem.destroy).toHaveBeenCalled();
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

    describe('Guest User Cart Operations', () => {
        test('should handle cart operations for guest users', async () => {
            const mockProduct = {
                productId: 'PRD001',
                productName: 'Engine Oil',
                stock: 10,
                salePrice: 25000
            };

            Account.findOne.mockResolvedValue(null); // Not logged in
            Product.findByPk.mockResolvedValue(mockProduct);

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
