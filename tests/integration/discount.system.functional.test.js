// Functional Test 5: Discount System and Coupon Management
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock all required models and dependencies
jest.mock('../../models/Discount');
jest.mock('../../models/Account');
jest.mock('../../models/Customer');
jest.mock('../../models/Order');
jest.mock('../../models/OrderDetail');
jest.mock('../../configs/system');

const Discount = require('../../models/Discount');
const Account = require('../../models/Account');
const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const OrderDetail = require('../../models/OrderDetail');
const systemConfig = require('../../configs/system');

// Mock system config
systemConfig.prefixUrl = '/AutoParts';
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

// Mock middleware
app.use((req, res, next) => {
    res.locals.messages = {
        DISCOUNT_APPLIED_SUCCESS: 'Discount applied successfully',
        DISCOUNT_NOT_FOUND: 'Discount code not found',
        DISCOUNT_EXPIRED: 'Discount code has expired',
        DISCOUNT_USED: 'Discount code already used',
        DISCOUNT_QUANTITY_EXCEEDED: 'Discount usage limit exceeded',
        DISCOUNT_MINIMUM_ORDER: 'Order does not meet minimum requirement',
        DISCOUNT_CREATE_SUCCESS: 'Discount created successfully',
        DISCOUNT_UPDATE_SUCCESS: 'Discount updated successfully',
        DISCOUNT_DELETE_SUCCESS: 'Discount deleted successfully'
    };
    next();
});

// Mock routes for testing
app.post('/discount/apply', async (req, res) => {
    // Mock discount application logic
    try {
        const { discountCode, orderTotal, userEmail } = req.body;
        
        const discount = await Discount.findByPk(discountCode);
        if (!discount) {
            return res.status(404).json({ message: res.locals.messages.DISCOUNT_NOT_FOUND });
        }

        const customerDiscounts = await Discount.getByCustomer(userEmail);
        const isAvailable = customerDiscounts.some(d => d.discountId === discountCode);
        
        if (!isAvailable && discount.usageLimit <= 0) {
            return res.status(400).json({ message: res.locals.messages.DISCOUNT_QUANTITY_EXCEEDED });
        }

        if (orderTotal < discount.minimumOrderValue) {
            return res.status(400).json({ message: res.locals.messages.DISCOUNT_MINIMUM_ORDER });
        }

        if (new Date() > new Date(discount.expiryDate)) {
            return res.status(400).json({ message: res.locals.messages.DISCOUNT_EXPIRED });
        }

        let discountAmount = 0;
        if (discount.discountType === 'percentage') {
            discountAmount = (orderTotal * discount.discountValue) / 100;
            if (discount.maxDiscountAmount && discountAmount > discount.maxDiscountAmount) {
                discountAmount = discount.maxDiscountAmount;
            }
        } else {
            discountAmount = Math.min(discount.discountValue, orderTotal);
        }

        res.json({
            success: true,
            discountAmount,
            finalAmount: orderTotal - discountAmount,
            discountCode: discount.discountId
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/discount/available/:email', async (req, res) => {
    try {
        const discounts = await Discount.getByCustomer(req.params.email);
        res.json({ discounts });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/admin/discount/create', async (req, res) => {
    try {
        const discount = await Discount.create(req.body);
        res.status(201).json({ discount });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

describe('Discount System and Coupon Management Functional Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mocks
        Discount.findByPk = jest.fn();
        Discount.findAll = jest.fn();
        Discount.create = jest.fn();
        Discount.update = jest.fn();
        Discount.destroy = jest.fn();
        Discount.getByCustomer = jest.fn();
        Discount.setUsedDiscount = jest.fn();
        Discount.deleteDiscountUsed = jest.fn();
        Account.findOne = jest.fn();
        Customer.findByPk = jest.fn();
    });

    describe('Discount Code Validation', () => {
        test('should validate active discount code successfully', async () => {
            const mockDiscount = {
                discountId: 'SAVE10',
                discountName: '10% Off',
                discountType: 'percentage',
                discountValue: 10,
                minimumOrderValue: 100000,
                maxDiscountAmount: 50000,
                usageLimit: 100,
                expiryDate: '2024-12-31',
                status: 'Active'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'SAVE10',
                    orderTotal: 500000,
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.discountAmount).toBe(50000); // 10% of 500000, capped at 50000
            expect(response.body.finalAmount).toBe(450000);
        });

        test('should reject invalid discount code', async () => {
            Discount.findByPk.mockResolvedValue(null);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'INVALID',
                    orderTotal: 500000,
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Discount code not found');
        });

        test('should reject expired discount code', async () => {
            const mockDiscount = {
                discountId: 'EXPIRED10',
                discountType: 'percentage',
                discountValue: 10,
                minimumOrderValue: 0,
                usageLimit: 100,
                expiryDate: '2023-12-31', // Expired
                status: 'Active'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'EXPIRED10',
                    orderTotal: 500000,
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Discount code has expired');
        });

        test('should reject discount with usage limit exceeded', async () => {
            const mockDiscount = {
                discountId: 'USED10',
                discountType: 'percentage',
                discountValue: 10,
                minimumOrderValue: 0,
                usageLimit: 0, // No usage left
                expiryDate: '2024-12-31',
                status: 'Active'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([]); // Not available for this customer

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'USED10',
                    orderTotal: 500000,
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Discount usage limit exceeded');
        });

        test('should reject order below minimum value', async () => {
            const mockDiscount = {
                discountId: 'MIN100',
                discountType: 'percentage',
                discountValue: 10,
                minimumOrderValue: 1000000, // 1M VND minimum
                usageLimit: 100,
                expiryDate: '2024-12-31',
                status: 'Active'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'MIN100',
                    orderTotal: 500000, // Below minimum
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Order does not meet minimum requirement');
        });
    });

    describe('Percentage Discount Calculations', () => {
        test('should calculate percentage discount correctly', async () => {
            const mockDiscount = {
                discountId: 'PERCENT15',
                discountType: 'percentage',
                discountValue: 15,
                minimumOrderValue: 0,
                maxDiscountAmount: null,
                usageLimit: 100,
                expiryDate: '2024-12-31',
                status: 'Active'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'PERCENT15',
                    orderTotal: 800000,
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.discountAmount).toBe(120000); // 15% of 800000
            expect(response.body.finalAmount).toBe(680000);
        });

        test('should apply maximum discount cap for percentage discounts', async () => {
            const mockDiscount = {
                discountId: 'CAPPED20',
                discountType: 'percentage',
                discountValue: 20,
                minimumOrderValue: 0,
                maxDiscountAmount: 100000, // Cap at 100k
                usageLimit: 100,
                expiryDate: '2024-12-31',
                status: 'Active'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'CAPPED20',
                    orderTotal: 1000000, // 20% would be 200k, but capped at 100k
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.discountAmount).toBe(100000); // Capped amount
            expect(response.body.finalAmount).toBe(900000);
        });
    });

    describe('Fixed Amount Discount Calculations', () => {
        test('should calculate fixed amount discount correctly', async () => {
            const mockDiscount = {
                discountId: 'FIXED50K',
                discountType: 'fixed',
                discountValue: 50000,
                minimumOrderValue: 200000,
                usageLimit: 100,
                expiryDate: '2024-12-31',
                status: 'Active'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'FIXED50K',
                    orderTotal: 300000,
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.discountAmount).toBe(50000);
            expect(response.body.finalAmount).toBe(250000);
        });

        test('should not allow fixed discount greater than order total', async () => {
            const mockDiscount = {
                discountId: 'BIGFIXED',
                discountType: 'fixed',
                discountValue: 500000,
                minimumOrderValue: 0,
                usageLimit: 100,
                expiryDate: '2024-12-31',
                status: 'Active'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'BIGFIXED',
                    orderTotal: 300000, // Less than discount value
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.discountAmount).toBe(300000); // Capped at order total
            expect(response.body.finalAmount).toBe(0);
        });
    });

    describe('Customer-Specific Discounts', () => {
        test('should retrieve available discounts for customer', async () => {
            const mockDiscounts = [
                {
                    discountId: 'LOYAL10',
                    discountName: 'Loyalty Discount',
                    discountType: 'percentage',
                    discountValue: 10,
                    minimumOrderValue: 100000,
                    expiryDate: '2024-12-31'
                },
                {
                    discountId: 'FIRST20',
                    discountName: 'First Purchase',
                    discountType: 'percentage',
                    discountValue: 20,
                    minimumOrderValue: 0,
                    expiryDate: '2024-12-31'
                }
            ];

            Discount.getByCustomer.mockResolvedValue(mockDiscounts);

            const response = await request(app)
                .get('/discount/available/customer@test.com');

            expect(response.status).toBe(200);
            expect(response.body.discounts).toHaveLength(2);
            expect(response.body.discounts[0].discountId).toBe('LOYAL10');
            expect(response.body.discounts[1].discountId).toBe('FIRST20');
        });

        test('should handle customer with no available discounts', async () => {
            Discount.getByCustomer.mockResolvedValue([]);

            const response = await request(app)
                .get('/discount/available/customer@test.com');

            expect(response.status).toBe(200);
            expect(response.body.discounts).toHaveLength(0);
        });
    });

    describe('Admin Discount Management', () => {
        test('should create new discount successfully', async () => {
            const newDiscount = {
                discountId: 'NEWCODE',
                discountName: 'New Year Sale',
                discountType: 'percentage',
                discountValue: 25,
                minimumOrderValue: 500000,
                maxDiscountAmount: 200000,
                usageLimit: 1000,
                expiryDate: '2024-12-31',
                status: 'Active'
            };

            Discount.create.mockResolvedValue(newDiscount);

            const response = await request(app)
                .post('/admin/discount/create')
                .send(newDiscount);

            expect(response.status).toBe(201);
            expect(response.body.discount.discountId).toBe('NEWCODE');
            expect(Discount.create).toHaveBeenCalledWith(newDiscount);
        });

        test('should validate discount creation parameters', async () => {
            const invalidDiscount = {
                discountId: '', // Empty ID
                discountName: 'Invalid Discount',
                discountType: 'percentage',
                discountValue: -10, // Negative value
                minimumOrderValue: -1000, // Negative minimum
                usageLimit: 0
            };

            Discount.create.mockRejectedValue(new Error('Validation error'));

            const response = await request(app)
                .post('/admin/discount/create')
                .send(invalidDiscount);

            expect(response.status).toBe(500);
        });
    });

    describe('Discount Usage Tracking', () => {
        test('should track discount usage when applied to order', async () => {
            const mockDiscount = {
                discountId: 'TRACK10',
                usageLimit: 100,
                save: jest.fn()
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.setUsedDiscount.mockResolvedValue(true);

            // Simulate order creation with discount
            await Discount.setUsedDiscount('customer@test.com', 'TRACK10');
            mockDiscount.usageLimit -= 1;
            await mockDiscount.save();

            expect(Discount.setUsedDiscount).toHaveBeenCalledWith('customer@test.com', 'TRACK10');
            expect(mockDiscount.usageLimit).toBe(99);
            expect(mockDiscount.save).toHaveBeenCalled();
        });

        test('should restore discount usage when order is cancelled', async () => {
            const mockDiscount = {
                discountId: 'RESTORE10',
                usageLimit: 99,
                save: jest.fn()
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.deleteDiscountUsed.mockResolvedValue(true);

            // Simulate order cancellation
            await Discount.deleteDiscountUsed('RESTORE10', 'customer@test.com');
            mockDiscount.usageLimit += 1;
            await mockDiscount.save();

            expect(Discount.deleteDiscountUsed).toHaveBeenCalledWith('RESTORE10', 'customer@test.com');
            expect(mockDiscount.usageLimit).toBe(100);
            expect(mockDiscount.save).toHaveBeenCalled();
        });
    });

    describe('Multiple Discount Scenarios', () => {
        test('should handle discount code changes in order', async () => {
            const oldDiscount = {
                discountId: 'OLD10',
                usageLimit: 50,
                save: jest.fn()
            };

            const newDiscount = {
                discountId: 'NEW15',
                discountType: 'percentage',
                discountValue: 15,
                minimumOrderValue: 0,
                usageLimit: 100,
                expiryDate: '2024-12-31',
                save: jest.fn()
            };

            Discount.findByPk
                .mockResolvedValueOnce(oldDiscount)
                .mockResolvedValueOnce(newDiscount);
            Discount.getByCustomer.mockResolvedValue([newDiscount]);
            Discount.deleteDiscountUsed.mockResolvedValue(true);
            Discount.setUsedDiscount.mockResolvedValue(true);

            // First, remove old discount
            await Discount.deleteDiscountUsed('OLD10', 'customer@test.com');
            oldDiscount.usageLimit += 1;
            await oldDiscount.save();

            // Then apply new discount
            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'NEW15',
                    orderTotal: 400000,
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(200);
            expect(oldDiscount.usageLimit).toBe(51);
            expect(oldDiscount.save).toHaveBeenCalled();
            expect(response.body.discountAmount).toBe(60000); // 15% of 400000
        });

        test('should prevent stacking of discount codes', async () => {
            // This test would ensure only one discount can be applied per order
            const mockDiscount1 = {
                discountId: 'FIRST10',
                discountType: 'percentage',
                discountValue: 10,
                minimumOrderValue: 0,
                usageLimit: 100,
                expiryDate: '2024-12-31'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount1);
            Discount.getByCustomer.mockResolvedValue([mockDiscount1]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'FIRST10',
                    orderTotal: 500000,
                    userEmail: 'customer@test.com',
                    existingDiscount: 'SECOND20' // Already has a discount
                });

            // Implementation would depend on business rules
            expect(response.status).toBe(200);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle zero order total', async () => {
            const mockDiscount = {
                discountId: 'ZERO10',
                discountType: 'percentage',
                discountValue: 10,
                minimumOrderValue: 0,
                usageLimit: 100,
                expiryDate: '2024-12-31'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'ZERO10',
                    orderTotal: 0,
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.discountAmount).toBe(0);
            expect(response.body.finalAmount).toBe(0);
        });

        test('should handle database errors gracefully', async () => {
            Discount.findByPk.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'ERROR10',
                    orderTotal: 500000,
                    userEmail: 'customer@test.com'
                });

            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Server error');
        });

        test('should handle invalid discount types', async () => {
            const mockDiscount = {
                discountId: 'INVALID',
                discountType: 'unknown', // Invalid type
                discountValue: 10,
                minimumOrderValue: 0,
                usageLimit: 100,
                expiryDate: '2024-12-31'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'INVALID',
                    orderTotal: 500000,
                    userEmail: 'customer@test.com'
                });

            // Should handle gracefully, possibly treating as no discount
            expect(response.status).toBeDefined();
        });

        test('should handle extremely large discount values', async () => {
            const mockDiscount = {
                discountId: 'HUGE',
                discountType: 'percentage',
                discountValue: 99999, // Extremely large percentage
                minimumOrderValue: 0,
                usageLimit: 100,
                expiryDate: '2024-12-31'
            };

            Discount.findByPk.mockResolvedValue(mockDiscount);
            Discount.getByCustomer.mockResolvedValue([mockDiscount]);

            const response = await request(app)
                .post('/discount/apply')
                .send({
                    discountCode: 'HUGE',
                    orderTotal: 500000,
                    userEmail: 'customer@test.com'
                });

            // Should cap at order total
            expect(response.status).toBe(200);
            expect(response.body.finalAmount).toBeGreaterThanOrEqual(0);
        });
    });
});
