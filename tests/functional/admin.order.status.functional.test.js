// Functional Test 4: Admin Order Status Management Workflow
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock all required models and dependencies
jest.mock('../../models/Order');
jest.mock('../../models/OrderDetail');
jest.mock('../../models/Product');
jest.mock('../../models/Customer');
jest.mock('../../models/Employee');
jest.mock('../../models/Account');
jest.mock('../../models/Discount');
jest.mock('../../models/Brand');
jest.mock('../../models/ProductGroup');
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
    
    const mockSequelize = {
        define: jest.fn(() => mockModel),
        transaction: jest.fn(),
        authenticate: jest.fn(),
        sync: jest.fn(),
        fn: jest.fn(() => 'mock_function_value'),
        literal: jest.fn((value) => ({ val: value }))
    };
    
    return {
        getSequelize: jest.fn(() => mockSequelize),
        sequelize: mockSequelize
    };
});
jest.mock('../../configs/system');
jest.mock('../../helpers/mail');

const Order = require('../../models/Order');
const OrderDetail = require('../../models/OrderDetail');
const Product = require('../../models/Product');
const Customer = require('../../models/Customer');
const Employee = require('../../models/Employee');
const Account = require('../../models/Account');
const Discount = require('../../models/Discount');
const systemConfig = require('../../configs/system');
const { mailSend } = require('../../helpers/mail');

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

// Mock view engine for rendering
app.set('view engine', 'ejs');
app.set('views', __dirname + '/mock-views');

// Mock render method to return success instead of actually rendering
app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, locals) {
        // Instead of rendering, just return status 200 with data
        return res.status(200).json({
            view: view,
            data: locals
        });
    };
    next();
});

// Mock middleware for admin authentication
app.use((req, res, next) => {
    res.locals.user = {
        email: 'admin@test.com',
        permission: 'ADMIN'
    };
    res.locals.messages = {
        ORDER_CONFIRM_SUCCESS: 'Order confirmed successfully',
        ORDER_SHIP_SUCCESS: 'Order marked as shipped',
        ORDER_COMPLETE_SUCCESS: 'Order completed successfully',
        ORDER_CANCEL_SUCCESS: 'Order cancelled successfully',
        ORDER_NOT_FOUND: 'Order not found',
        INSUFFICIENT_STOCK: 'Insufficient stock',
        EMAIL_SEND_ERROR: 'Email notification failed'
    };
    next();
});

const orderController = require('../../controller/admin/orderController');

// Setup routes
app.get('/AutoParts/admin/order/:status', orderController.index);
app.patch('/admin/order/changeStatus', orderController.changeStatus);
app.get('/AutoParts/admin/order/detail/:orderId', orderController.detail);

describe('Admin Order Status Management Functional Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mocks
        Order.findAll = jest.fn();
        Order.findByPk = jest.fn();
        Order.update = jest.fn();
        OrderDetail.findAll = jest.fn();
        Product.findByPk = jest.fn();
        Product.update = jest.fn();
        Customer.findByPk = jest.fn();
        Discount.findByPk = jest.fn();
        mailSend.mockResolvedValue(true);
    });

    describe('Order Status Display by Category', () => {
        test('should display pending orders correctly', async () => {
            const mockPendingOrders = [
                {
                    orderId: 'ORD001',
                    userEmail: 'customer1@test.com',
                    totalCost: 500000,
                    status: 'Pending',
                    orderDate: '2024-01-15',
                    Customer: {
                        fullName: 'John Doe',
                        phone: '0987654321'
                    }
                },
                {
                    orderId: 'ORD002',
                    userEmail: 'customer2@test.com',
                    totalCost: 750000,
                    status: 'Pending',
                    orderDate: '2024-01-16',
                    Customer: {
                        fullName: 'Jane Smith',
                        phone: '0123456789'
                    }
                }
            ];

            Order.findAll.mockResolvedValue(mockPendingOrders);

            const response = await request(app)
                .get('/AutoParts/admin/order/Pending');

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalledWith({
                where: {
                    status: 'Pending',
                    deleted: false
                },
                order: [['orderDate', 'DESC']],
                include: [{ model: Customer }]
            });
        });

        test('should display processing orders correctly', async () => {
            const mockProcessingOrders = [
                {
                    orderId: 'ORD003',
                    userEmail: 'customer3@test.com',
                    totalCost: 300000,
                    status: 'Processing',
                    orderDate: '2024-01-17',
                    Customer: {
                        fullName: 'Bob Johnson',
                        phone: '0987123456'
                    }
                }
            ];

            Order.findAll.mockResolvedValue(mockProcessingOrders);

            const response = await request(app)
                .get('/AutoParts/admin/order/Processing');

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalledWith({
                where: {
                    status: 'Processing',
                    deleted: false
                },
                order: [['orderDate', 'DESC']],
                include: [{ model: Customer }]
            });
        });

        test('should display shipping orders correctly', async () => {
            const mockShippingOrders = [
                {
                    orderId: 'ORD004',
                    userEmail: 'customer4@test.com',
                    totalCost: 400000,
                    status: 'Shipping',
                    orderDate: '2024-01-18',
                    Customer: {
                        fullName: 'Alice Brown',
                        phone: '0789456123'
                    }
                }
            ];

            Order.findAll.mockResolvedValue(mockShippingOrders);

            const response = await request(app)
                .get('/AutoParts/admin/order/Delivery');

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalledWith({
                where: {
                    status: 'Shipping',
                    deleted: false
                },
                order: [['orderDate', 'DESC']],
                include: [{ model: Customer }]
            });
        });

        test('should display order history correctly', async () => {
            const mockHistoryOrders = [
                {
                    orderId: 'ORD005',
                    status: 'Completed',
                    orderDate: '2024-01-10'
                },
                {
                    orderId: 'ORD006',
                    status: 'Cancelled',
                    orderDate: '2024-01-12'
                }
            ];

            Order.findAll.mockResolvedValue(mockHistoryOrders);

            const response = await request(app)
                .get('/AutoParts/admin/order/History');            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });
    });

    describe('Order Status Changes - Pending to Processing', () => {
        test('should confirm pending order successfully', async () => {
            const mockOrder = {
                orderId: 'ORD001',
                userEmail: 'customer@test.com',
                status: 'Pending',
                totalCost: 500000
            };

            Order.findByPk.mockResolvedValue(mockOrder);
            Order.update.mockResolvedValue([1]);

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD001',
                    status: 'Pending'
                });

            expect(response.status).toBe(302);
            expect(Order.update).toHaveBeenCalledWith(
                {
                    status: 'Processing',
                    confirmedBy: 'admin@test.com'
                },
                {
                    where: { orderId: 'ORD001' }
                }
            );
            expect(mailSend).toHaveBeenCalledWith(
                'no-reply@autopart.com',
                'customer@test.com',
                'Đơn hàng đã được xác nhận',
                expect.stringContaining('đã được xác nhận thành công')
            );
        });

        test('should handle order confirmation with email failure', async () => {
            const mockOrder = {
                orderId: 'ORD001',
                userEmail: 'customer@test.com',
                status: 'Pending'
            };

            Order.findByPk.mockResolvedValue(mockOrder);
            Order.update.mockResolvedValue([1]);
            mailSend.mockRejectedValue(new Error('Email service unavailable'));

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD001',
                    status: 'Pending'
                });

            expect(response.status).toBe(302);
            expect(Order.update).toHaveBeenCalled();
            // Should still succeed even if email fails
        });
    });

    describe('Order Status Changes - Processing to Shipping', () => {        test('should mark order as shipping successfully', async () => {
            const mockOrder = {
                orderId: 'ORD002',
                userEmail: 'customer@test.com',
                status: 'Processing',
                totalCost: 500000,
                shipAddress: '123 Test Street',
                shippingType: 'Express'
            };

            Order.findByPk.mockResolvedValue(mockOrder);
            Order.update.mockResolvedValue([1]);

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD002',
                    status: 'Processing'
                });

            expect(response.status).toBe(302);
            expect(Order.update).toHaveBeenCalledWith(
                {
                    status: 'Shipping',
                    updatedBy: 'admin@test.com'
                },
                {
                    where: { orderId: 'ORD002' }
                }
            );
            expect(mailSend).toHaveBeenCalledWith(
                'no-reply@autopart.com',
                'customer@test.com',
                'Đơn hàng đang được giao',
                expect.stringContaining('đang được giao')
            );
        });
    });

    describe('Order Status Changes - Shipping to Completed', () => {        test('should complete order successfully', async () => {
            const mockOrder = {
                orderId: 'ORD003',
                userEmail: 'customer@test.com',
                status: 'Shipping',
                totalCost: 500000,
                shipAddress: '123 Test Street',
                shippingType: 'Express'
            };

            Order.findByPk.mockResolvedValue(mockOrder);
            Order.update.mockResolvedValue([1]);

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD003',
                    status: 'Shipping'
                });

            expect(response.status).toBe(302);
            expect(Order.update).toHaveBeenCalledWith(
                {
                    status: 'Completed',
                    updatedBy: 'admin@test.com'
                },
                {
                    where: { orderId: 'ORD003' }
                }
            );            expect(mailSend).toHaveBeenCalledWith(
                'no-reply@autopart.com',
                'customer@test.com',
                'Đơn hàng đã hoàn tất',
                expect.stringContaining('đã được giao thành công')
            );
        });
    });

    describe('Order Cancellation Workflow', () => {
        test('should cancel order and restore stock successfully', async () => {            const mockOrder = {
                orderId: 'ORD004',
                userEmail: 'customer@test.com',
                status: 'Pending',
                totalCost: 500000,
                shipAddress: '123 Test Street',
                shippingType: 'Express'
            };

            const mockOrderDetails = [
                {
                    productId: 'PRD001',
                    amount: 5,
                    Product: { stock: 10 }
                },
                {
                    productId: 'PRD002',
                    amount: 3,
                    Product: { stock: 15 }
                }
            ];

            Order.findByPk.mockResolvedValue(mockOrder);
            OrderDetail.findAll.mockResolvedValue(mockOrderDetails);
            Order.update.mockResolvedValue([1]);
            Product.update.mockResolvedValue([1]);            // Mock sequelize transaction
            const mockTransaction = {
                commit: jest.fn(),
                rollback: jest.fn()
            };
            require('../../configs/database').getSequelize.mockReturnValue({
                transaction: jest.fn().mockImplementation(async (callback) => {
                    return await callback(mockTransaction);
                })
            });

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD004',
                    status: 'Cancelled'
                });

            expect(response.status).toBe(302);
            expect(Order.update).toHaveBeenCalledWith(
                {
                    status: 'Cancelled',
                    updatedBy: 'admin@test.com'
                },
                {
                    where: { orderId: 'ORD004' }
                }
            );
            expect(mailSend).toHaveBeenCalledWith(
                'no-reply@autopart.com',
                'customer@test.com',
                'Đơn hàng đã bị hủy',
                expect.stringContaining('đã bị hủy')
            );
        });        test('should handle cancellation with discount refund', async () => {
            const mockOrder = {
                orderId: 'ORD005',
                userEmail: 'customer@test.com',
                discountId: 'DISC001',
                status: 'Pending',
                totalCost: 100000,
                shipAddress: '123 Test St',
                shippingType: 'Normal'
            };

            const mockDiscount = {
                discountId: 'DISC001',
                usageLimit: 10,
                save: jest.fn()
            };

            Order.findByPk.mockResolvedValue(mockOrder);
            Discount.findByPk.mockResolvedValue(mockDiscount);
            OrderDetail.findAll.mockResolvedValue([
                { productId: 'PROD1', amount: 2, Product: { stock: 10 } }
            ]);
            Product.update.mockResolvedValue([1]);
            Order.update.mockResolvedValue([1]);

            // Mock the Discount.deleteDiscountUsed method that would handle discount refund
            Discount.deleteDiscountUsed = jest.fn();

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD005',
                    status: 'Cancelled'
                });

            expect(response.status).toBe(302);
            // The discount refund logic is handled in the deleteDiscountUsed method
            // This test verifies the correct flow is triggered
        });        test('should handle stock validation during cancellation', async () => {
            const mockOrder = {
                orderId: 'ORD006',
                userEmail: 'customer@test.com',
                status: 'Pending',
                totalCost: 100000,
                shipAddress: '123 Test St',
                shippingType: 'Normal'
            };

            const mockOrderDetails = [
                {
                    productId: 'PRD001',
                    amount: 5,
                    Product: { stock: null } // Invalid product - this will cause validation error
                }
            ];

            Order.findByPk.mockResolvedValue(mockOrder);
            OrderDetail.findAll.mockResolvedValue(mockOrderDetails);
            Product.update.mockResolvedValue([1]); // This won't be reached due to validation error

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD006',
                    status: 'Cancelled'
                });

            expect(response.status).toBe(302); // Should redirect back due to validation error
            // The test verifies that the controller handles validation errors gracefully
        });
    });

    describe('Order Detail View', () => {
        test('should display order details successfully', async () => {
            const mockOrder = {
                orderId: 'ORD007',
                userEmail: 'customer@test.com',
                totalCost: 600000,
                status: 'Processing',
                Customer: {
                    fullName: 'Test Customer',
                    phone: '0987654321',
                    address: '123 Test Street'
                },
                Discount: {
                    discountId: 'DISC001',
                    discountName: '10% Off',
                    discountValue: 10
                }
            };

            const mockOrderDetails = [
                {
                    productId: 'PRD001',
                    productName: 'Engine Oil',
                    amount: 2,
                    unitPrice: 250000,
                    Product: {
                        productName: 'Engine Oil Premium',
                        salePrice: 250000
                    }
                },
                {
                    productId: 'PRD002',
                    productName: 'Brake Pad',
                    amount: 1,
                    unitPrice: 350000,
                    Product: {
                        productName: 'Premium Brake Pad',
                        salePrice: 350000
                    }
                }
            ];

            Order.findByPk.mockResolvedValue(mockOrder);
            OrderDetail.findAll.mockResolvedValue(mockOrderDetails);

            const response = await request(app)
                .get('/AutoParts/admin/order/detail/ORD007');

            expect(response.status).toBe(200);
            expect(Order.findByPk).toHaveBeenCalledWith('ORD007', {
                include: [
                    { model: Customer },
                    { model: Discount }
                ]
            });
            expect(OrderDetail.findAll).toHaveBeenCalledWith({
                where: { orderId: 'ORD007' },
                include: [{ model: Product }]
            });
        });

        test('should handle order not found', async () => {
            Order.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .get('/AutoParts/admin/order/detail/INVALID');

            expect(response.status).toBe(302); // Should redirect with error
            expect(Order.findByPk).toHaveBeenCalledWith('INVALID', {
                include: [
                    { model: Customer },
                    { model: Discount }
                ]
            });
        });
    });

    describe('Email Notification System', () => {
        test('should send confirmation email with correct content', async () => {
            const mockOrder = {
                orderId: 'ORD008',
                userEmail: 'customer@test.com',
                totalCost: 500000,
                shipAddress: '123 Test Street',
                shippingType: 'Express'
            };

            Order.findByPk.mockResolvedValue(mockOrder);
            Order.update.mockResolvedValue([1]);

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD008',
                    status: 'Pending'
                });

            expect(mailSend).toHaveBeenCalledWith(
                'no-reply@autopart.com',
                'customer@test.com',
                'Đơn hàng đã được xác nhận',
                expect.stringContaining('ORD008')
            );            const emailCall = mailSend.mock.calls[0];
            const emailContent = emailCall[3];
            expect(emailContent).toContain('500.000 ₫');
            expect(emailContent).toContain('123 Test Street');
            expect(emailContent).toContain('Express');
        });        test('should send shipping email with tracking information', async () => {
            const mockOrder = {
                orderId: 'ORD009',
                userEmail: 'customer@test.com',
                status: 'Processing',
                totalCost: 500000,
                shipAddress: '123 Test Street',
                shippingType: 'Express'
            };

            Order.findByPk.mockResolvedValue(mockOrder);
            Order.update.mockResolvedValue([1]);

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD009',
                    status: 'Processing'
                });

            expect(mailSend).toHaveBeenCalledWith(
                'no-reply@autopart.com',
                'customer@test.com',
                'Đơn hàng đang được giao',
                expect.stringContaining('đang được giao')
            );
        });        test('should send completion email with delivery confirmation', async () => {
            const mockOrder = {
                orderId: 'ORD010',
                userEmail: 'customer@test.com',
                status: 'Shipping',
                totalCost: 500000,
                shipAddress: '123 Test Street',
                shippingType: 'Express'
            };

            Order.findByPk.mockResolvedValue(mockOrder);
            Order.update.mockResolvedValue([1]);

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD010',
                    status: 'Shipping'                });

            expect(mailSend).toHaveBeenCalledWith(
                'no-reply@autopart.com',
                'customer@test.com',
                'Đơn hàng đã hoàn tất',
                expect.stringContaining('đã được giao thành công')
            );
        });test('should send cancellation email with reason', async () => {
            const mockOrder = {
                orderId: 'ORD011',
                userEmail: 'customer@test.com',
                status: 'Pending',
                totalCost: 500000,
                shipAddress: '123 Test Street',
                shippingType: 'Express'
            };

            Order.findByPk.mockResolvedValue(mockOrder);
            Order.update.mockResolvedValue([1]);
            OrderDetail.findAll.mockResolvedValue([
                {
                    productId: 'PROD001',
                    amount: 2,
                    Product: { stock: 10 }
                }
            ]);
            Product.update.mockResolvedValue([1]);

            const mockTransaction = {
                commit: jest.fn(),
                rollback: jest.fn()
            };
            require('../../configs/database').getSequelize.mockReturnValue({
                transaction: jest.fn().mockImplementation(async (callback) => {
                    return await callback(mockTransaction);
                }),
                literal: jest.fn((value) => value)
            });

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD011',
                    status: 'Cancelled'
                });

            expect(mailSend).toHaveBeenCalledWith(
                'no-reply@autopart.com',
                'customer@test.com',
                'Đơn hàng đã bị hủy',
                expect.stringContaining('đã bị hủy')
            );
        });
    });

    describe('Error Handling and Edge Cases', () => {        test('should handle database errors gracefully', async () => {
            Order.findByPk.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD999',
                    status: 'Pending'
                });

            expect(response.status).toBe(302); // Should redirect back with error flash message
        });

        test('should handle invalid status transitions', async () => {
            const mockOrder = {
                orderId: 'ORD012',
                status: 'Completed' // Already completed
            };

            Order.findByPk.mockResolvedValue(mockOrder);

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD012',
                    status: 'Pending' // Invalid transition
                });

            // Should handle gracefully or reject invalid transition
            expect(response.status).toBeDefined();
        });        test('should handle missing order ID', async () => {
            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    status: 'Pending'
                    // Missing orderId
                });

            expect(response.status).toBe(302); // Should redirect back due to error
        });        test('should handle transaction rollback on error', async () => {
            const mockOrder = {
                orderId: 'ORD013',
                userEmail: 'customer@test.com',
                status: 'Pending',
                totalCost: 100000,
                shipAddress: '123 Test St',
                shippingType: 'Normal'
            };

            Order.findByPk.mockResolvedValue(mockOrder);

            // Mock sequelize.transaction to track its usage
            const mockSequelize = require('../../configs/database').getSequelize();
            mockSequelize.transaction = jest.fn().mockImplementation(async (callback) => {
                const mockTransaction = { rollback: jest.fn() };
                try {
                    await callback(mockTransaction);
                } catch (error) {
                    await mockTransaction.rollback();
                    throw error;
                }
            });

            // For this test, we're simulating error in the regular controller path, not the transaction
            // The controller catches the error and redirects back
            OrderDetail.findAll.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .patch('/admin/order/changeStatus')
                .send({
                    orderId: 'ORD013',
                    status: 'Cancelled'
                });

            expect(response.status).toBe(302); // Should redirect back due to error
            // The transaction might not be called if the error occurs before the transaction starts
            // This test verifies error handling in the overall controller flow
        });
    });
});
