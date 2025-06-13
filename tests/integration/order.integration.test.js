// Integration Test 3: Order Management System
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock all required models and services
jest.mock('../../models/Order');
jest.mock('../../models/OrderDetail');
jest.mock('../../models/Product');
jest.mock('../../models/Customer');
jest.mock('../../models/Account');
jest.mock('../../models/Cart');
jest.mock('../../models/Discount');
jest.mock('../../configs/database');
jest.mock('../../helpers/mail');

const Order = require('../../models/Order');
const OrderDetail = require('../../models/OrderDetail');
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');
const Account = require('../../models/Account');
const { Cart, ProductsInCart } = require('../../models/Cart');
const Discount = require('../../models/Discount');
const { mailSend } = require('../../helpers/mail');

// Mock sequelize transaction
const mockTransaction = {
    commit: jest.fn(),
    rollback: jest.fn()
};

const mockSequelize = {
    transaction: jest.fn().mockResolvedValue(mockTransaction)
};

jest.mock('../../configs/database', () => ({
    getSequelize: () => mockSequelize
}));

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
        INVALID_PHONE_WARNING: 'Invalid phone number',
        INVALID_EMAIL_WARNING: 'Invalid email address',
        BLANK_SHIPPING_TYPE: 'Please select shipping type',
        ORDER_CREATE_SUCCESS: 'Order created successfully',
        ORDER_CREATE_ERROR: 'Error creating order',
        ORDER_NOT_FOUND: 'Order not found',
        ORDER_CANCEL_SUCCESS: 'Order cancelled successfully',
        ORDER_CANCEL_ERROR: 'Error cancelling order',
        NOT_LOGGED_IN: 'Please login first',
        CUSTOMER_NOT_FOUND: 'Customer not found',
        ORDER_DETAIL_ERROR: 'Error loading order details',
        DISCOUNT_QUANTITY_EXCEEDED: 'Discount usage limit exceeded'
    };
    next();
});

// Import controllers after mocking
const orderController = require('../../controller/client/orderController');

// Setup routes
app.post('/order/create', orderController.createOrder);
app.get('/order/detail', orderController.showDetail);
app.get('/order/cancel', orderController.cancel);
app.get('/order/edit', orderController.editForm);
app.post('/order/edit', orderController.edit);
app.post('/order/edit/remove-product', orderController.removeProduct);
app.get('/order/check', orderController.checkOrder);

describe('Order Management Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mock implementations
        Order.create = jest.fn();
        Order.findByPk = jest.fn();
        Order.findOne = jest.fn();
        Order.findAll = jest.fn();
        OrderDetail.create = jest.fn();
        OrderDetail.findAll = jest.fn();
        OrderDetail.findOne = jest.fn();
        OrderDetail.destroy = jest.fn();
        Product.findByPk = jest.fn();
        Product.update = jest.fn();
        Customer.findByPk = jest.fn();
        Customer.create = jest.fn();
        Account.findOne = jest.fn();
        Account.create = jest.fn();
        Cart.create = jest.fn();
        Cart.findByPk = jest.fn();
        ProductsInCart.findAll = jest.fn();
        ProductsInCart.destroy = jest.fn();
        Discount.findByPk = jest.fn();
        mailSend.mockResolvedValue(true);
    });

    describe('Order Creation', () => {
        test('should create order for logged-in user with valid data', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockCustomer = {
                email: 'test@example.com',
                cartId: 'CART123',
                fullName: 'John Doe',
                phone: '0123456789',
                address: '123 Test Street'
            };

            const mockCartItems = [
                {
                    productId: 'PRD001',
                    quantity: 2,
                    destroy: jest.fn()
                }
            ];

            const mockProduct = {
                productId: 'PRD001',
                salePrice: 25000,
                stock: 10,
                update: jest.fn()
            };

            const mockDiscount = {
                discountId: 'DIS001',
                discountAmount: 5000,
                usageLimit: 5,
                update: jest.fn()
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            ProductsInCart.findAll.mockResolvedValue(mockCartItems);
            Product.findByPk.mockResolvedValue(mockProduct);
            Discount.findByPk.mockResolvedValue(mockDiscount);
            
            Order.create.mockResolvedValue({
                orderId: 'ORD001',
                userEmail: 'test@example.com'
            });
            
            OrderDetail.create.mockResolvedValue({
                orderId: 'ORD001',
                productId: 'PRD001'
            });

            const response = await request(app)
                .post('/order/create')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    email: 'test@example.com',
                    customerName: 'John Doe',
                    phoneNumber: '0123456789',
                    shipAddress: '123 Test Street',
                    totalCost: '45', // 45000 VND (will be multiplied by 1000)
                    shippingType: '20000', // Normal shipping
                    discountId: 'DIS001'
                });

            expect(response.status).toBe(302);
            expect(Order.create).toHaveBeenCalled();
            expect(OrderDetail.create).toHaveBeenCalled();
            expect(mockTransaction.commit).toHaveBeenCalled();
        });

        test('should create order for guest user', async () => {
            const mockCartItems = [
                {
                    productId: 'PRD001',
                    quantity: 1,
                    destroy: jest.fn()
                }
            ];

            const mockProduct = {
                productId: 'PRD001',
                salePrice: 25000,
                stock: 10,
                update: jest.fn()
            };

            Account.findOne.mockResolvedValue(null); // Not logged in
            ProductsInCart.findAll.mockResolvedValue(mockCartItems);
            Product.findByPk.mockResolvedValue(mockProduct);
            
            // Mock creating guest account and customer
            Account.create.mockResolvedValue({
                email: 'guest@example.com',
                status: 'Guest'
            });
            
            Customer.create.mockResolvedValue({
                email: 'guest@example.com',
                status: 'Guest'
            });

            Order.create.mockResolvedValue({
                orderId: 'ORD002',
                userEmail: 'guest@example.com'
            });

            const response = await request(app)
                .post('/order/create')
                .set('Cookie', ['cartId=GUEST_CART123'])
                .send({
                    email: 'guest@example.com',
                    customerName: 'Guest User',
                    phoneNumber: '0987654321',
                    shipAddress: '456 Guest Street',
                    totalCost: '25',
                    shippingType: '10000' // Economy shipping
                });

            expect(response.status).toBe(302);
            expect(Account.create).toHaveBeenCalled();
            expect(Customer.create).toHaveBeenCalled();
            expect(Order.create).toHaveBeenCalled();
        });

        test('should fail order creation with invalid phone number', async () => {
            const response = await request(app)
                .post('/order/create')
                .send({
                    email: 'test@example.com',
                    customerName: 'John Doe',
                    phoneNumber: '123', // Invalid phone
                    shipAddress: '123 Test Street',
                    totalCost: '45',
                    shippingType: '20000'
                });

            expect(response.status).toBe(302);
            expect(Order.create).not.toHaveBeenCalled();
        });

        test('should fail order creation with invalid email', async () => {
            const response = await request(app)
                .post('/order/create')
                .send({
                    email: 'invalid-email', // Invalid email
                    customerName: 'John Doe',
                    phoneNumber: '0123456789',
                    shipAddress: '123 Test Street',
                    totalCost: '45',
                    shippingType: '20000'
                });

            expect(response.status).toBe(302);
            expect(Order.create).not.toHaveBeenCalled();
        });

        test('should handle discount usage limit exceeded', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockDiscount = {
                discountId: 'DIS001',
                usageLimit: 0 // No uses left
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Discount.findByPk.mockResolvedValue(mockDiscount);

            const response = await request(app)
                .post('/order/create')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    email: 'test@example.com',
                    customerName: 'John Doe',
                    phoneNumber: '0123456789',
                    shipAddress: '123 Test Street',
                    totalCost: '45',
                    shippingType: '20000',
                    discountId: 'DIS001'
                });

            expect(response.status).toBe(302);
            expect(Order.create).not.toHaveBeenCalled();
        });
    });

    describe('Order Details and Management', () => {
        test('should display order details for authenticated user', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockCustomer = {
                email: 'test@example.com',
                fullName: 'John Doe'
            };

            const mockOrder = {
                orderId: 'ORD001',
                userEmail: 'test@example.com',
                totalCost: 50000,
                status: 'Pending',
                details: [
                    {
                        productId: 'PRD001',
                        quantity: 2,
                        unitPrice: 25000
                    }
                ]
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            Order.findByPk.mockResolvedValue(mockOrder);

            const response = await request(app)
                .get('/order/detail')
                .set('Cookie', ['tokenUser=valid_token'])
                .query({ orderId: 'ORD001' });

            expect(response.status).toBe(200);
            expect(Order.findByPk).toHaveBeenCalledWith('ORD001');
        });

        test('should cancel order successfully', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockOrder = {
                orderId: 'ORD001',
                status: 'Pending',
                details: [
                    { productId: 'PRD001', amount: 2 }
                ],
                update: jest.fn()
            };

            const mockProduct = {
                productId: 'PRD001',
                stock: 5,
                save: jest.fn()
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Order.findByPk.mockResolvedValue(mockOrder);
            Product.findByPk.mockResolvedValue(mockProduct);

            const response = await request(app)
                .get('/order/cancel')
                .set('Cookie', ['tokenUser=valid_token'])
                .query({ orderId: 'ORD001' });

            expect(response.status).toBe(302);
            expect(mockOrder.update).toHaveBeenCalledWith({
                status: 'Cancelled',
                deleted: true
            });
        });

        test('should remove product from order', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            const mockOrderDetail = {
                orderId: 'ORD001',
                productId: 'PRD001',
                amount: 2,
                unitPrice: 25000,
                destroy: jest.fn()
            };

            const mockOrder = {
                orderId: 'ORD001',
                totalCost: 50000,
                save: jest.fn()
            };

            const mockProduct = {
                productId: 'PRD001',
                stock: 5,
                save: jest.fn()
            };

            Account.findOne.mockResolvedValue(mockAccount);
            OrderDetail.findOne.mockResolvedValue(mockOrderDetail);
            Order.findByPk.mockResolvedValue(mockOrder);
            Product.findByPk.mockResolvedValue(mockProduct);

            const response = await request(app)
                .post('/order/edit/remove-product')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    orderId: 'ORD001',
                    productId: 'PRD001'
                });

            expect(response.status).toBe(302);
            expect(mockOrderDetail.destroy).toHaveBeenCalled();
            expect(mockProduct.save).toHaveBeenCalled();
            expect(mockOrder.save).toHaveBeenCalled();
        });
    });

    describe('Order Lookup', () => {
        test('should find order by orderId', async () => {
            const mockOrder = {
                orderId: 'ORD001',
                userEmail: 'test@example.com',
                totalCost: 50000,
                status: 'Completed'
            };

            const mockCustomer = {
                email: 'test@example.com',
                fullName: 'John Doe'
            };

            const mockOrderDetails = [
                {
                    orderId: 'ORD001',
                    productId: 'PRD001',
                    quantity: 2
                }
            ];

            Order.findByPk.mockResolvedValue(mockOrder);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            OrderDetail.findAll.mockResolvedValue(mockOrderDetails);

            const response = await request(app)
                .get('/order/check')
                .query({ orderId: 'ORD001' });

            expect(response.status).toBe(200);
            expect(Order.findByPk).toHaveBeenCalledWith('ORD001');
        });

        test('should handle order not found', async () => {
            Order.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get('/order/check')
                .query({ orderId: 'INVALID_ORDER' });

            expect(response.status).toBe(404);
        });

        test('should handle missing orderId', async () => {
            const response = await request(app)
                .get('/order/check');

            expect(response.status).toBe(400);
        });
    });

    describe('Error Handling', () => {
        test('should handle database transaction rollback on error', async () => {
            const mockAccount = {
                email: 'test@example.com',
                token: 'valid_token'
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Order.create.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .post('/order/create')
                .set('Cookie', ['tokenUser=valid_token'])
                .send({
                    email: 'test@example.com',
                    customerName: 'John Doe',
                    phoneNumber: '0123456789',
                    shipAddress: '123 Test Street',
                    totalCost: '45',
                    shippingType: '20000'
                });

            expect(response.status).toBe(302);
            expect(mockTransaction.rollback).toHaveBeenCalled();
        });
    });
});
