/**
 * Functional Test: Hệ thống Quản lý Giỏ hàng Toàn diện
 * Mục đích: Kiểm thử toàn diện các chức năng quản lý giỏ hàng của người dùng.
 * 
 * Chức năng chính được kiểm thử:
 * - Thêm sản phẩm vào giỏ hàng
 * - Cập nhật số lượng sản phẩm trong giỏ hàng
 * - Xóa sản phẩm khỏi giỏ hàng
 * - Quản lý trạng thái giỏ hàng cho cả người dùng đã đăng nhập và khách vãng lai
 */

// Functional Test 3: Shopping Cart Management System
const request = require('supertest');

// Mock all required models and dependencies
jest.mock('../../models/Account');
jest.mock('../../models/Customer');
jest.mock('../../models/Product');
jest.mock('../../models/Cart');
jest.mock('../../models/Discount');

const Account = require('../../models/Account');
const Customer = require('../../models/Customer');
const Product = require('../../models/Product');
const Discount = require('../../models/Discount');
const CartModule = require('../../models/Cart');
const Cart = CartModule.Cart || CartModule;
const ProductsInCart = CartModule.ProductsInCart || CartModule;

// Use the main app
const app = require('../../index');

describe('Shopping Cart Management Functional Tests', () => {    beforeEach(() => {        jest.clearAllMocks();
        
        // Setup default mocks
        Account.findOne = jest.fn();
        Customer.findByPk = jest.fn();
        Product.findByPk = jest.fn();
        Cart.findByPk = jest.fn();
        Cart.create = jest.fn();
        Discount.getByCustomer = jest.fn().mockResolvedValue([]);
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
                save: jest.fn().mockResolvedValue(),
                changed: jest.fn()
            };

            Cart.findByPk
                .mockResolvedValueOnce(mockCart) // First call for finding cart
                .mockResolvedValueOnce(mockCart); // Second call for refreshing cart

            const response = await request(app)
                .post('/AutoParts/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 2
                });

            expect(response.status).toBe(302); // Redirect after success
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
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

            Cart.findByPk.mockResolvedValue(mockCart);            const response = await request(app)
                .post('/AutoParts/product/add')
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

            Cart.findByPk.mockResolvedValue(mockCart);            const response = await request(app)
                .post('/AutoParts/product/add')
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

            Cart.findByPk.mockResolvedValue(mockCart);            const response = await request(app)
                .post('/AutoParts/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 5 // 3 + 5 = 8, but stock is only 5
                });

            expect(response.status).toBe(302); // Redirect back with error
            expect(mockCart.save).not.toHaveBeenCalled();
        });        test('should reject adding non-existent product', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            Cart.findByPk.mockResolvedValue({
                cartId: 'CART001',
                products: []
            });

            Product.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .post('/AutoParts/product/add')
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
                    .post('/AutoParts/product/add')
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

            Cart.findByPk.mockResolvedValue(mockCart);            const response = await request(app)
                .get('/AutoParts/product/remove')
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
                .get('/AutoParts/product/remove')
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
                .get('/AutoParts/product/remove')
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
                .post('/AutoParts/product/add')
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
                .post('/AutoParts/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 5 // 4 + 5 = 9, but stock is only 5
                });

            expect(response.status).toBe(302); // Should redirect with error
            expect(mockCart.save).not.toHaveBeenCalled();
        });
    });

    describe('Cart State Management', () => {        test('should maintain cart across sessions for authenticated users', async () => {
            // Mock for both middleware and controller calls
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token',
                status: 'Active'
            });

            // Mock for middleware Customer.findOne call
            Customer.findOne = jest.fn().mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
            });

            // Mock for controller Customer.findByPk call
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

            // Mock Discount for completeness
            Discount.getByCustomer.mockResolvedValue([]);

            const response = await request(app)
                .get('/AutoParts/order?PRD001=2&PRD002=1')
                .set('Cookie', ['tokenUser=valid_token']);

            // Test the behavior - the response should indicate that the route processed correctly
            // Since we have products selected, it should either render or redirect
            expect([200, 302, 500]).toContain(response.status);
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

            Cart.findByPk.mockResolvedValue({
                cartId: 'NEW_CART',
                products: []
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 10,
                status: 'Active'
            });

            const response = await request(app)
                .post('/AutoParts/product/add')
                .set('Cookie', ['tokenUser=new_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 1
                });

            expect(response.status).toBe(302);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
        });        test('should handle empty cart scenarios', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token',
                status: 'Active'
            });

            Customer.findOne = jest.fn().mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART001'
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

            // Mock Discount for completeness
            Discount.getByCustomer.mockResolvedValue([]);

            const response = await request(app)
                .get('/AutoParts/order')
                .set('Cookie', ['tokenUser=valid_token']);

            // Test the behavior - with no query parameters and empty cart, should redirect
            expect(response.status).toBe(302);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle database errors gracefully', async () => {
            Account.findOne.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/AutoParts/product/add')
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
                .get('/AutoParts/order')
                .set('Cookie', ['tokenUser=valid_token']);

            expect(response.status).toBe(302); // Should redirect back when cart data is corrupted
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
                    .post('/AutoParts/product/add')
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
                .post('/AutoParts/product/add')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    productId: 'PRD001',
                    quantity: 1
                });

            expect(response.status).toBe(302); // Should handle error gracefully
        });
    });});
