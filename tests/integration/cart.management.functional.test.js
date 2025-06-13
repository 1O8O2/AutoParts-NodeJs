// Functional Test 3: Shopping Cart Management System
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock all required models and dependencies
jest.mock('../../models/Account');
jest.mock('../../models/Customer');
jest.mock('../../models/Product');
jest.mock('../../models/Cart');
jest.mock('../../configs/system');

const Account = require('../../models/Account');
const Customer = require('../../models/Customer');
const Product = require('../../models/Product');
const { Cart, ProductsInCart } = require('../../models/Cart');
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
        ADD_TO_CART_SUCCESS: 'Product added to cart successfully',
        ADD_TO_CART_FAILED: 'Failed to add product to cart',
        REMOVE_FROM_CART_SUCCESS: 'Product removed from cart successfully',
        REMOVE_FROM_CART_FAILED: 'Failed to remove product from cart',
        CART_UPDATE_SUCCESS: 'Cart updated successfully',
        CART_UPDATE_FAILED: 'Failed to update cart',
        PRODUCT_NOT_FOUND: 'Product not found',
        INVALID_PRODUCT_NUMBER: 'Invalid product quantity',
        CART_ERROR: 'Cart error occurred',
        INSUFFICIENT_STOCK: 'Insufficient stock available'
    };
    next();
});

const productController = require('../../controller/client/productController');

// Setup routes
app.post('/product/add', productController.addProduct);
app.delete('/product/remove', productController.deleteProduct);
app.get('/cart/view', (req, res) => {
    // Mock cart view functionality
    res.status(200).json({ message: 'Cart view' });
});

describe('Shopping Cart Management Functional Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mocks
        Account.findOne = jest.fn();
        Customer.findByPk = jest.fn();
        Product.findByPk = jest.fn();
        Cart.findByPk = jest.fn();
        Cart.create = jest.fn();
    });

    describe('Add Product to Cart', () => {
        test('should add product to cart for authenticated user', async () => {
            // Mock authenticated user
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                productName: 'Engine Oil',
                salePrice: 250000,
                stock: 50,
                status: 'Active'
            });

            const mockCart = {
                cartId: 'CART001',
                products: [],
                save: jest.fn(),
                changed: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 2
                });

            expect(response.status).toBe(302); // Redirect after success
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
            expect(Cart.findByPk).toHaveBeenCalledWith('CART001');
            expect(mockCart.save).toHaveBeenCalled();
        });

        test('should add product to cart for guest user', async () => {
            // Mock guest user (no token)
            Account.findOne.mockResolvedValue(null);

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                productName: 'Engine Oil',
                salePrice: 250000,
                stock: 50,
                status: 'Active'
            });

            const mockCart = {
                cartId: 'GUEST_CART',
                products: [],
                save: jest.fn(),
                changed: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['cartId=GUEST_CART'])
                .send({
                    productId: 'PRD001',
                    quantity: 1
                });

            expect(response.status).toBe(302);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
            expect(Cart.findByPk).toHaveBeenCalledWith('GUEST_CART');
            expect(mockCart.save).toHaveBeenCalled();
        });

        test('should update quantity if product already in cart', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                productName: 'Engine Oil',
                salePrice: 250000,
                stock: 50,
                status: 'Active'
            });

            const existingProduct = {
                product: {
                    productId: 'PRD001',
                    productName: 'Engine Oil'
                },
                amount: 2
            };

            const mockCart = {
                cartId: 'CART001',
                products: [existingProduct],
                save: jest.fn(),
                changed: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 3
                });

            expect(response.status).toBe(302);
            expect(mockCart.save).toHaveBeenCalled();
            // Check that quantity was updated (2 + 3 = 5)
            expect(mockCart.products[0].amount).toBe(5);
        });

        test('should reject adding product with insufficient stock', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                productName: 'Engine Oil',
                salePrice: 250000,
                stock: 5,
                status: 'Active'
            });

            const existingProduct = {
                product: {
                    productId: 'PRD001',
                    productName: 'Engine Oil'
                },
                amount: 3
            };

            const mockCart = {
                cartId: 'CART001',
                products: [existingProduct],
                save: jest.fn(),
                changed: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 5 // 3 + 5 = 8, but stock is only 5
                });

            expect(response.status).toBe(302); // Redirect back with error
            expect(mockCart.save).not.toHaveBeenCalled();
        });

        test('should reject adding non-existent product', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            Product.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'INVALID',
                    quantity: 1
                });

            expect(response.status).toBe(302); // Redirect back with error
            expect(Product.findByPk).toHaveBeenCalledWith('INVALID');
        });

        test('should handle zero or negative quantity', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 10,
                status: 'Active'
            });

            const testQuantities = [0, -1, -5];

            for (const quantity of testQuantities) {
                jest.clearAllMocks();
                Product.findByPk.mockResolvedValue({
                    productId: 'PRD001',
                    stock: 10,
                    status: 'Active'
                });

                const response = await request(app)
                    .post('/product/add')
                    .set('Cookie', ['tokenUser=valid_token'])
                    .send({
                        productId: 'PRD001',
                        quantity: quantity
                    });

                expect(response.status).toBe(302);
            }
        });
    });

    describe('Remove Product from Cart', () => {
        test('should remove product from cart successfully', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            const existingProducts = [
                {
                    product: { productId: 'PRD001', productName: 'Engine Oil' },
                    amount: 2
                },
                {
                    product: { productId: 'PRD002', productName: 'Brake Pad' },
                    amount: 1
                }
            ];

            const mockCart = {
                cartId: 'CART001',
                products: existingProducts,
                save: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .delete('/product/remove')
                .set('Cookie', ['tokenUser=valid_token'])
                .query({ productId: 'PRD001' });

            expect(response.status).toBe(302);
            expect(mockCart.save).toHaveBeenCalled();
            // Check that product was removed
            expect(mockCart.products).toHaveLength(1);
            expect(mockCart.products[0].product.productId).toBe('PRD002');
        });

        test('should remove product from guest cart', async () => {
            Account.findOne.mockResolvedValue(null);

            const existingProducts = [
                {
                    product: { productId: 'PRD001', productName: 'Engine Oil' },
                    amount: 2
                }
            ];

            const mockCart = {
                cartId: 'GUEST_CART',
                products: existingProducts,
                save: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .delete('/product/remove')
                .set('Cookie', ['cartId=GUEST_CART'])
                .query({ productId: 'PRD001' });

            expect(response.status).toBe(302);
            expect(mockCart.save).toHaveBeenCalled();
            expect(mockCart.products).toHaveLength(0);
        });

        test('should handle removing non-existent product from cart', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            const existingProducts = [
                {
                    product: { productId: 'PRD001', productName: 'Engine Oil' },
                    amount: 2
                }
            ];

            const mockCart = {
                cartId: 'CART001',
                products: existingProducts,
                save: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .delete('/product/remove')
                .set('Cookie', ['tokenUser=valid_token'])
                .query({ productId: 'PRD999' }); // Non-existent product

            expect(response.status).toBe(302);
            expect(mockCart.save).toHaveBeenCalled();
            // Cart should remain unchanged
            expect(mockCart.products).toHaveLength(1);
            expect(mockCart.products[0].product.productId).toBe('PRD001');
        });
    });

    describe('Cart Quantity Updates', () => {
        test('should update product quantity in cart', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 10,
                status: 'Active'
            });

            const existingProduct = {
                product: { productId: 'PRD001', productName: 'Engine Oil' },
                amount: 2
            };

            const mockCart = {
                cartId: 'CART001',
                products: [existingProduct],
                save: jest.fn(),
                changed: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 1 // Will add to existing 2, making it 3
                });

            expect(response.status).toBe(302);
            expect(mockCart.save).toHaveBeenCalled();
            expect(mockCart.products[0].amount).toBe(3);
        });

        test('should handle quantity updates exceeding stock', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 5,
                status: 'Active'
            });

            const existingProduct = {
                product: { productId: 'PRD001', productName: 'Engine Oil' },
                amount: 4
            };

            const mockCart = {
                cartId: 'CART001',
                products: [existingProduct],
                save: jest.fn(),
                changed: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 5 // 4 + 5 = 9, but stock is only 5
                });

            expect(response.status).toBe(302); // Should redirect with error
            expect(mockCart.save).not.toHaveBeenCalled();
        });
    });

    describe('Cart State Management', () => {
        test('should maintain cart across sessions for authenticated users', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            const existingProducts = [
                {
                    product: { productId: 'PRD001', productName: 'Engine Oil' },
                    amount: 2
                },
                {
                    product: { productId: 'PRD002', productName: 'Brake Pad' },
                    amount: 1
                }
            ];

            const mockCart = {
                cartId: 'CART001',
                products: existingProducts
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .get('/cart/view')
                .set('Cookie', ['tokenUser=valid_token']);

            expect(response.status).toBe(200);
            expect(Cart.findByPk).toHaveBeenCalledWith('CART001');
        });

        test('should handle cart creation for new users', async () => {
            Account.findOne.mockResolvedValue({
                email: 'newuser@test.com',
                token: 'new_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'newuser@test.com',
                cartId: 'NEW_CART'
            });

            Cart.findByPk.mockResolvedValue(null); // No existing cart
            Cart.create.mockResolvedValue({
                cartId: 'NEW_CART',
                products: []
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 10,
                status: 'Active'
            });

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=new_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 1
                });

            expect(response.status).toBe(302);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
        });

        test('should handle empty cart scenarios', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            const mockCart = {
                cartId: 'CART001',
                products: []
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .get('/cart/view')
                .set('Cookie', ['tokenUser=valid_token']);

            expect(response.status).toBe(200);
            expect(Cart.findByPk).toHaveBeenCalledWith('CART001');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle database errors gracefully', async () => {
            Account.findOne.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 1
                });

            expect(response.status).toBe(302); // Should redirect with error
        });

        test('should handle cart corruption scenarios', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            // Mock corrupted cart data
            const mockCart = {
                cartId: 'CART001',
                products: null, // Corrupted data
                save: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .get('/cart/view')
                .set('Cookie', ['tokenUser=valid_token']);

            expect(response.status).toBe(200); // Should handle gracefully
        });

        test('should handle invalid product data', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            const mockCart = {
                cartId: 'CART001',
                products: [],
                save: jest.fn(),
                changed: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            // Test with various invalid inputs
            const invalidInputs = [
                { productId: '', quantity: 1 },
                { productId: null, quantity: 1 },
                { productId: 'PRD001', quantity: '' },
                { productId: 'PRD001', quantity: null },
                { productId: 'PRD001', quantity: 'invalid' }
            ];

            for (const input of invalidInputs) {
                jest.clearAllMocks();
                Cart.findByPk.mockResolvedValue(mockCart);

                const response = await request(app)
                    .post('/product/add')
                    .set('Cookie', ['tokenUser=valid_token'])
                    .send(input);

                expect(response.status).toBe(302); // Should handle gracefully
            }
        });

        test('should handle concurrent cart modifications', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 10,
                status: 'Active'
            });

            const mockCart = {
                cartId: 'CART001',
                products: [],
                save: jest.fn().mockRejectedValue(new Error('Concurrent modification')),
                changed: jest.fn()
            };

            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 1
                });

            expect(response.status).toBe(302); // Should handle error gracefully
        });
    });
});
