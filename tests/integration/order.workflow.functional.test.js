// Functional Test 2: E-commerce Order Processing Workflow
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock database and models
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

jest.mock('../../models/Order');
jest.mock('../../models/OrderDetail');
jest.mock('../../models/Product');
jest.mock('../../models/Customer');
jest.mock('../../models/Account');
jest.mock('../../models/Cart');
jest.mock('../../models/Discount');
jest.mock('../../helpers/mail');

const Order = require('../../models/Order');
const OrderDetail = require('../../models/OrderDetail');
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');
const Account = require('../../models/Account');
const { Cart, ProductsInCart } = require('../../models/Cart');
const Discount = require('../../models/Discount');
const { mailSend } = require('../../helpers/mail');

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

// Mock middleware
app.use((req, res, next) => {
    res.locals.messages = {
        ORDER_CREATE_SUCCESS: 'Order created successfully',
        ORDER_CREATE_ERROR: 'Order creation failed',
        INVALID_PHONE_WARNING: 'Invalid phone number',
        INVALID_EMAIL_WARNING: 'Invalid email format',
        INSUFFICIENT_STOCK: 'Insufficient stock',
        DISCOUNT_NOT_FOUND: 'Discount code not found',
        DISCOUNT_EXPIRED: 'Discount code expired',
        ORDER_NOT_FOUND: 'Order not found',
        ORDER_CANCEL_SUCCESS: 'Order cancelled successfully',
        ORDER_UPDATE_SUCCESS: 'Order updated successfully'
    };
    next();
});

const orderController = require('../../controller/client/orderController');

// Setup routes
app.post('/order/create', orderController.createOrder);
app.get('/order/detail', orderController.showDetail);
app.get('/order/cancel', orderController.cancel);
app.post('/order/edit', orderController.edit);
app.get('/order/check', orderController.checkOrder);
app.get('/order', orderController.showCart);

describe('E-commerce Order Processing Functional Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mocks
        Order.create = jest.fn();
        Order.findByPk = jest.fn();
        Order.findAll = jest.fn();
        Order.update = jest.fn();
        OrderDetail.create = jest.fn();
        OrderDetail.findAll = jest.fn();
        OrderDetail.destroy = jest.fn();
        Product.findByPk = jest.fn();
        Product.findAll = jest.fn();
        Customer.findByPk = jest.fn();
        Customer.create = jest.fn();
        Account.findOne = jest.fn();
        Account.create = jest.fn();
        Cart.findByPk = jest.fn();
        ProductsInCart.findAll = jest.fn();
        Discount.findByPk = jest.fn();
        mailSend.mockResolvedValue(true);
    });

    describe('Complete Order Creation Workflow', () => {
        test('should create order for authenticated customer with valid data', async () => {
            // Mock authenticated customer
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                fullName: 'John Doe',
                cartId: 'CART123'
            });

            Cart.findByPk.mockResolvedValue({
                cartId: 'CART123',
                products: [
                    {
                        product: {
                            productId: 'PRD001',
                            productName: 'Engine Oil',
                            salePrice: 25000,
                            stock: 10
                        },
                        quantity: 2
                    }
                ]
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                productName: 'Engine Oil',
                salePrice: 25000,
                stock: 10,
                save: jest.fn()
            });

            Order.create.mockResolvedValue({
                orderId: 'ORD' + Date.now(),
                userEmail: 'customer@test.com',
                totalCost: 50000,
                status: 'Pending'
            });

            OrderDetail.create.mockResolvedValue({
                orderId: 'ORD123',
                productId: 'PRD001',
                amount: 2,
                unitPrice: 25000
            });

            const response = await request(app)
                .post('/order/create')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    email: 'customer@test.com',
                    customerName: 'John Doe',
                    phoneNumber: '0123456789',
                    address: '123 Test Street',
                    shippingType: 'Standard',
                    discountCode: ''
                });

            expect(response.status).toBe(302);
            expect(Order.create).toHaveBeenCalled();
            expect(OrderDetail.create).toHaveBeenCalled();
            expect(mailSend).toHaveBeenCalled();
        });

        test('should create order for guest customer', async () => {
            // Mock guest customer (no token)
            Account.findOne.mockResolvedValue(null);

            Cart.findByPk.mockResolvedValue({
                cartId: 'GUEST_CART',
                products: [
                    {
                        product: {
                            productId: 'PRD001',
                            productName: 'Engine Oil',
                            salePrice: 25000,
                            stock: 10
                        },
                        quantity: 1
                    }
                ]
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 10,
                save: jest.fn()
            });

            Account.create.mockResolvedValue({
                email: 'guest@test.com',
                status: 'Guest'
            });

            Customer.create.mockResolvedValue({
                email: 'guest@test.com',
                fullName: 'Guest User'
            });

            Order.create.mockResolvedValue({
                orderId: 'ORD_GUEST',
                userEmail: 'guest@test.com',
                totalCost: 25000
            });

            const response = await request(app)
                .post('/order/create')
                .set('Cookie', ['cartId=GUEST_CART'])
                .send({
                    email: 'guest@test.com',
                    customerName: 'Guest User',
                    phoneNumber: '0987654321',
                    address: '456 Guest Street',
                    shippingType: 'Express'
                });

            expect(response.status).toBe(302);
            expect(Account.create).toHaveBeenCalled();
            expect(Customer.create).toHaveBeenCalled();
            expect(Order.create).toHaveBeenCalled();
        });

        test('should apply discount code correctly', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART123'
            });

            Cart.findByPk.mockResolvedValue({
                cartId: 'CART123',
                products: [
                    {
                        product: {
                            productId: 'PRD001',
                            salePrice: 100000,
                            stock: 5
                        },
                        quantity: 1
                    }
                ]
            });

            Discount.findByPk.mockResolvedValue({
                discountId: 'DISC001',
                discountAmount: 10000,
                discountType: 'Fixed',
                usageLimit: 5,
                status: 'Active',
                save: jest.fn()
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 5,
                save: jest.fn()
            });

            Order.create.mockResolvedValue({
                orderId: 'ORD_DISCOUNT',
                totalCost: 90000, // 100000 - 10000 discount
                discountId: 'DISC001'
            });

            const response = await request(app)
                .post('/order/create')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    email: 'customer@test.com',
                    customerName: 'John Doe',
                    phoneNumber: '0123456789',
                    address: '123 Test Street',
                    shippingType: 'Standard',
                    discountCode: 'DISC001'
                });

            expect(response.status).toBe(302);
            expect(Discount.findByPk).toHaveBeenCalledWith('DISC001');
            expect(Order.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    discountId: 'DISC001'
                }),
                expect.any(Object)
            );
        });
    });

    describe('Order Management and Updates', () => {
        test('should allow customer to view order details', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                fullName: 'John Doe'
            });

            Order.findByPk.mockResolvedValue({
                orderId: 'ORD123',
                userEmail: 'customer@test.com',
                totalCost: 50000,
                status: 'Pending',
                details: [
                    {
                        productId: 'PRD001',
                        productName: 'Engine Oil',
                        amount: 2,
                        unitPrice: 25000
                    }
                ]
            });

            const response = await request(app)
                .get('/order/detail')
                .set('Cookie', ['tokenUser=valid_token'])
                .query({ orderId: 'ORD123' });

            expect(response.status).toBe(200);
            expect(Order.findByPk).toHaveBeenCalledWith('ORD123');
        });

        test('should handle order cancellation', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Order.findByPk.mockResolvedValue({
                orderId: 'ORD123',
                userEmail: 'customer@test.com',
                status: 'Pending',
                details: [
                    {
                        productId: 'PRD001',
                        amount: 2,
                        unitPrice: 25000
                    }
                ],
                update: jest.fn(),
                save: jest.fn()
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 8,
                save: jest.fn()
            });

            const response = await request(app)
                .get('/order/cancel')
                .set('Cookie', ['tokenUser=valid_token'])
                .query({ orderId: 'ORD123' });

            expect(response.status).toBe(302);
            expect(Product.findByPk).toHaveBeenCalledWith('PRD001');
        });

        test('should allow order editing within time limit', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            const recentOrderDate = new Date();
            recentOrderDate.setMinutes(recentOrderDate.getMinutes() - 10); // 10 minutes ago

            Order.findByPk.mockResolvedValue({
                orderId: 'ORD123',
                userEmail: 'customer@test.com',
                orderDate: recentOrderDate,
                status: 'Pending',
                totalCost: 50000,
                update: jest.fn(),
                save: jest.fn()
            });

            OrderDetail.findAll.mockResolvedValue([
                {
                    productId: 'PRD001',
                    amount: 2,
                    unitPrice: 25000,
                    save: jest.fn()
                }
            ]);

            const response = await request(app)
                .post('/order/edit')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    orderId: 'ORD123',
                    customerName: 'John Doe Updated',
                    address: '456 New Address',
                    phoneNumber: '0123456789'
                });

            expect(response.status).toBe(302);
            expect(Order.findByPk).toHaveBeenCalledWith('ORD123');
        });
    });

    describe('Order Validation and Error Handling', () => {
        test('should reject order with invalid phone number', async () => {
            const response = await request(app)
                .post('/order/create')
                .send({
                    email: 'customer@test.com',
                    customerName: 'John Doe',
                    phoneNumber: '123', // Invalid phone
                    address: '123 Test Street',
                    shippingType: 'Standard'
                });

            expect(response.status).toBe(302);
            expect(Order.create).not.toHaveBeenCalled();
        });

        test('should reject order with invalid email format', async () => {
            const response = await request(app)
                .post('/order/create')
                .send({
                    email: 'invalid-email', // Invalid email
                    customerName: 'John Doe',
                    phoneNumber: '0123456789',
                    address: '123 Test Street',
                    shippingType: 'Standard'
                });

            expect(response.status).toBe(302);
            expect(Order.create).not.toHaveBeenCalled();
        });

        test('should handle insufficient stock scenario', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART123'
            });

            Cart.findByPk.mockResolvedValue({
                cartId: 'CART123',
                products: [
                    {
                        product: {
                            productId: 'PRD001',
                            salePrice: 25000,
                            stock: 1 // Low stock
                        },
                        quantity: 5 // Requesting more than available
                    }
                ]
            });

            Product.findByPk.mockResolvedValue({
                productId: 'PRD001',
                stock: 1
            });

            const response = await request(app)
                .post('/order/create')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    email: 'customer@test.com',
                    customerName: 'John Doe',
                    phoneNumber: '0123456789',
                    address: '123 Test Street',
                    shippingType: 'Standard'
                });

            expect(response.status).toBe(302);
            expect(Order.create).not.toHaveBeenCalled();
        });

        test('should handle expired discount code', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                cartId: 'CART123'
            });

            Discount.findByPk.mockResolvedValue({
                discountId: 'DISC_EXPIRED',
                status: 'Inactive', // Expired discount
                usageLimit: 0
            });

            const response = await request(app)
                .post('/order/create')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    email: 'customer@test.com',
                    customerName: 'John Doe',
                    phoneNumber: '0123456789',
                    address: '123 Test Street',
                    shippingType: 'Standard',
                    discountCode: 'DISC_EXPIRED'
                });

            expect(response.status).toBe(302);
            expect(Discount.findByPk).toHaveBeenCalledWith('DISC_EXPIRED');
        });
    });

    describe('Order Status Check and Tracking', () => {
        test('should allow order status check by order ID', async () => {
            Order.findByPk.mockResolvedValue({
                orderId: 'ORD123',
                userEmail: 'customer@test.com',
                status: 'Processing',
                totalCost: 50000,
                orderDate: new Date()
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                fullName: 'John Doe',
                phone: '0123456789'
            });

            OrderDetail.findAll.mockResolvedValue([
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    amount: 2,
                    unitPrice: 25000
                }
            ]);

            const response = await request(app)
                .get('/order/check')
                .query({ orderId: 'ORD123' });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('order');
            expect(response.body).toHaveProperty('customer');
            expect(response.body).toHaveProperty('products');
        });

        test('should handle non-existent order lookup', async () => {
            Order.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get('/order/check')
                .query({ orderId: 'NONEXISTENT' });

            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message');
        });

        test('should require order ID for status check', async () => {
            const response = await request(app)
                .get('/order/check');

            expect(response.status).toBe(400);
            expect(Order.findByPk).not.toHaveBeenCalled();
        });
    });
});
