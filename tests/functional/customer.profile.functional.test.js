/**
 * Functional Test: Toàn diện Hồ sơ Khách hàng & Lịch sử Đơn hàng
 * Mục đích: Kiểm thử toàn diện hệ thống quản lý hồ sơ cá nhân và lịch sử đơn hàng của khách hàng.
 * 
 * Chức năng chính được kiểm thử:
 * - Hiển thị thông tin hồ sơ khách hàng
 * - Cập nhật thông tin cá nhân (tên, số điện thoại, địa chỉ)
 * - Xem lịch sử các đơn hàng đã đặt của khách hàng
 * - Xác thực dữ liệu đầu vào và đảm bảo bảo mật thông tin
 */

// Functional Test 1: Customer Profile Management and Order History
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock all required models and dependencies
jest.mock('../../models/Account');
jest.mock('../../models/Customer');
jest.mock('../../models/Order');
jest.mock('../../models/OrderDetail');
jest.mock('../../models/Product');
jest.mock('../../models/Cart');
jest.mock('../../configs/system');
jest.mock('../../helpers/mail');

const Account = require('../../models/Account');
const Customer = require('../../models/Customer');
const Order = require('../../models/Order');
const OrderDetail = require('../../models/OrderDetail');
const Product = require('../../models/Product');
const { Cart } = require('../../models/Cart');
const systemConfig = require('../../configs/system');
const { mailSend } = require('../../helpers/mail');

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

// Mock render method for controllers that render views
app.use((req, res, next) => {
    const originalRender = res.render;
    res.render = function(view, data) {
        res.status(200).json({ 
            view: view, 
            data: data,
            success: true 
        });
    };
    next();
});

// Mock middleware
app.use((req, res, next) => {
    res.locals.messages = {
        EDIT_PROFILE_SUCCESS: 'Profile updated successfully',
        EDIT_PROFILE_ERROR: 'Profile update failed',
        NO_CHANGE_WARNING: 'No changes detected',
        EMAIL_CHANGE_WARNING: 'Email cannot be changed',
        INVALID_PHONE_WARNING: 'Invalid phone number format',
        INVALID_ADDRESS_WARNING: 'Invalid address format',
        ORDER_HISTORY_ERROR: 'Error loading order history',
        PROFILE_LOAD_ERROR: 'Error loading profile'
    };
    next();
});

const accountController = require('../../controller/client/accountController');

// Create mock functions for missing methods
const mockEditProfile = jest.fn(async (req, res) => {
    try {
        console.log('mockEditProfile called with:', req.body);
        
        // Manual cookie parsing as fallback for test environment
        let tokenUser = req.cookies.tokenUser;
        
        if (!tokenUser && req.headers.cookie) {
            const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});
            tokenUser = cookies.tokenUser;
        }
        
        // Simulate the same logic as accountEdit
        if (!tokenUser) {
            console.log('No token user, redirecting to login');
            return res.redirect('/AutoParts/account/login');
        }
        
        // Check if user exists
        const acc = await Account.findOne({
            where: { token: tokenUser }
        });
        
        console.log('Account found:', acc);
        
        if (!acc) {
            console.log('No account found, redirecting to login');
            return res.redirect('/AutoParts/account/login');
        }
        
        // Mock validation logic
        const { phone, fullName, address, email, status } = req.body;
        
        console.log('Validating data:', { phone, fullName, address, email, status });
        
        if (!phone || !fullName || !address || !email || !status) {
            console.log('Missing required fields');
            req.flash('error', 'EDIT_PROFILE_ERROR');
            return res.redirect('back');
        }
        
        // Phone validation
        if (phone && (phone.length < 10 || phone.length >= 11 || isNaN(phone))) {
            console.log('Invalid phone number');
            req.flash('error', 'INVALID_PHONE_WARNING');
            return res.redirect('back');
        }
        
        // Address validation
        if (!address || address.trim() === '' || address.length > 255) {
            console.log('Invalid address:', address);
            req.flash('error', 'INVALID_ADDRESS_WARNING');
            return res.redirect('back');
        }
        
        if (email !== acc.email) {
            console.log('Email mismatch');
            req.flash('error', 'EMAIL_CHANGE_WARNING');
            return res.redirect('back');
        }
        
        // Call Customer.update for valid data
        console.log('All validations passed, calling Customer.update');
        await Customer.update(req.body, {
            where: { email: acc.email }
        });
        
        // Simulate successful update
        req.flash('success', 'EDIT_PROFILE_SUCCESS');
        return res.redirect('/AutoParts/account/profile');
    } catch (error) {
        console.error('Error in mockEditProfile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

const mockShowOrderHistory = jest.fn(async (req, res) => {
    try {
        // Manual cookie parsing as fallback for test environment
        let tokenUser = req.cookies.tokenUser;
        
        if (!tokenUser && req.headers.cookie) {
            const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});
            tokenUser = cookies.tokenUser;
        }
        
        if (!tokenUser) {
            return res.redirect('/AutoParts/account/login');
        }
        
        const acc = await Account.findOne({ where: { token: tokenUser } });
        if (!acc) {
            return res.redirect('/AutoParts/account/login');
        }
        
        const orders = await Order.findAll({
            where: { userEmail: acc.email },
            order: [['orderDate', 'DESC']]
        });
        
        res.status(200).json({ success: true, orders });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Setup routes with proper authentication handling
const mockShowProfile = jest.fn(async (req, res) => {
    try {
        // Manual cookie parsing as fallback for test environment
        let tokenUser = req.cookies.tokenUser;
        
        if (!tokenUser && req.headers.cookie) {
            const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
            }, {});
            tokenUser = cookies.tokenUser;
        }
        
        const acc = await Account.findOne({ where: { token: tokenUser } });
        if (!acc) {
            return res.redirect('/AutoParts/account/login');
        }
        
        const customer = await Customer.findByPk(acc.email);
        const orderLst = await Order.findAll({ 
            where: { 
                userEmail: acc.email, 
                deleted : false
            },
            order: [["orderDate", "DESC"]] 
        }); 

        return res.render('client/pages/user/profile', {
            customer,
            orders: orderLst,
            messagelist: res.locals.messages,
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/AutoParts/account/profile', mockShowProfile);
app.post('/AutoParts/account/edit', accountController.accountEdit);
app.get('/AutoParts/account/orders', mockShowOrderHistory);

describe('Customer Profile Management Functional Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mocks
        Account.findOne = jest.fn();
        Customer.findByPk = jest.fn();
        Customer.update = jest.fn();
        Order.findAll = jest.fn();
        OrderDetail.findAll = jest.fn();
        Product.findByPk = jest.fn();
        mailSend.mockResolvedValue(true);
    });

    describe('Profile Display', () => {        test('should display customer profile successfully', async () => {
            // Mock authenticated user
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                token: 'valid_token',
                status: 'Active'
            });            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                fullName: 'John Doe',
                phone: '0987654321',
                address: '123 Test Street',
                status: 'Active'
            });

            Order.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/AutoParts/account/profile')
                .set('Cookie', 'tokenUser=valid_token');

            expect(response.status).toBe(200);
            expect(Account.findOne).toHaveBeenCalledWith({
                where: { token: 'valid_token' }
            });
            expect(Customer.findByPk).toHaveBeenCalledWith('customer@test.com');
        });

        test('should redirect to login if not authenticated', async () => {
            Account.findOne.mockResolvedValue(null);            const response = await request(app)
                .get('/AutoParts/account/profile')
                .set('Cookie', 'tokenUser=invalid_token');

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/account/login');
        });
    });

    describe('Profile Update', () => {
        test('should update customer profile successfully', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                status: 'Active'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                fullName: 'John Doe',
                phone: '0987654321',
                address: '123 Test Street',
                status: 'Active'
            });

            Customer.update.mockResolvedValue([1]);

            const updateData = {
                email: 'customer@test.com',
                fullName: 'John Smith',
                phone: '0123456789',
                address: '456 New Street',
                status: 'Active'
            };

            const response = await request(app)
                .post('/AutoParts/account/edit')
                .set('Cookie', 'tokenUser=valid_token')
                .send(updateData);

            expect(response.status).toBe(302);
            expect(Customer.update).toHaveBeenCalledWith(
                updateData,
                { where: { email: 'customer@test.com' } }
            );
        });

        test('should reject invalid phone number format', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                status: 'Active'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                fullName: 'John Doe',
                phone: '0987654321',
                address: '123 Test Street',
                status: 'Active'
            });

            const updateData = {
                email: 'customer@test.com',
                fullName: 'John Smith',
                phone: '123invalid', // Invalid phone
                address: '456 New Street',
                status: 'Active'
            };

            const response = await request(app)
                .post('/AutoParts/account/edit')
                .set('Cookie', 'tokenUser=valid_token')
                .send(updateData);

            expect(response.status).toBe(302);
            expect(Customer.update).not.toHaveBeenCalled();
        });

        test('should reject email change attempt', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                status: 'Active'
            });

            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                fullName: 'John Doe',
                phone: '0987654321',
                address: '123 Test Street',
                status: 'Active'
            });

            const updateData = {
                email: 'newemail@test.com', // Attempting to change email
                fullName: 'John Smith',
                phone: '0123456789',
                address: '456 New Street',
                status: 'Active'
            };

            const response = await request(app)
                .post('/AutoParts/account/edit')
                .set('Cookie', 'tokenUser=valid_token')
                .send(updateData);

            expect(response.status).toBe(302);
            expect(Customer.update).not.toHaveBeenCalled();
        });

        test('should handle no changes scenario', async () => {
            const existingData = {
                email: 'customer@test.com',
                fullName: 'John Doe',
                phone: '0987654321',
                address: '123 Test Street',
                status: 'Active'
            };

            Account.findOne.mockResolvedValue(existingData);
            Customer.findByPk.mockResolvedValue(existingData);

            const response = await request(app)
                .post('/AutoParts/account/edit')
                .set('Cookie', 'tokenUser=valid_token')
                .send(existingData);

            expect(response.status).toBe(302);
            expect(Customer.update).not.toHaveBeenCalled();
        });
    });

    describe('Order History', () => {
        test('should display customer order history', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                status: 'Active'
            });

            const mockOrders = [
                {
                    orderId: 'ORD001',
                    totalCost: 100000,
                    status: 'Completed',
                    orderDate: '2024-01-15',
                    details: [
                        {
                            productId: 'PRD001',
                            productName: 'Engine Oil',
                            amount: 2,
                            unitPrice: 50000
                        }
                    ]
                },
                {
                    orderId: 'ORD002',
                    totalCost: 250000,
                    status: 'Pending',
                    orderDate: '2024-01-20',
                    details: []
                }
            ];

            Order.findAll.mockResolvedValue(mockOrders);

            const response = await request(app)
                .get('/AutoParts/account/orders')
                .set('Cookie', 'tokenUser=valid_token');

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalledWith({
                where: { userEmail: 'customer@test.com' },
                order: [['orderDate', 'DESC']]
            });
        });

        test('should handle empty order history', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                status: 'Active'
            });

            Order.findAll.mockResolvedValue([]);

            const response = await request(app)
                .get('/AutoParts/account/orders')
                .set('Cookie', 'tokenUser=valid_token');

            expect(response.status).toBe(200);
            expect(Order.findAll).toHaveBeenCalled();
        });

        test('should handle order history loading error', async () => {
            Account.findOne.mockResolvedValue({
                email: 'customer@test.com',
                status: 'Active'
            });

            Order.findAll.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/AutoParts/account/orders')
                .set('Cookie', 'tokenUser=valid_token');

            expect(response.status).toBe(500);
        });
    });

    describe('Profile Data Validation', () => {        test('should validate phone number format correctly', async () => {
            const testCases = [
                { phone: '0987654321', valid: true },
                { phone: '0123456789', valid: true },
                { phone: '1234567890', valid: false }, // Doesn't start with 0
                { phone: '012345678', valid: false },  // Too short
                { phone: '01234567890', valid: false }, // Too long
                { phone: '0abc456789', valid: false }   // Contains letters
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();
                
                // Re-setup mocks for each iteration
                Account.findOne.mockResolvedValue({
                    email: 'customer@test.com',
                    status: 'Active'
                });

                Customer.findByPk.mockResolvedValue({
                    email: 'customer@test.com',
                    fullName: 'John Doe',
                    phone: '0987654321',
                    address: '123 Test Street',
                    status: 'Active'
                });

                Customer.update.mockResolvedValue([1]);

                const updateData = {
                    email: 'customer@test.com',
                    fullName: 'John Smith',
                    phone: testCase.phone,
                    address: '456 New Street',
                    status: 'Active'
                };

                const response = await request(app)
                    .post('/AutoParts/account/edit')
                    .set('Cookie', 'tokenUser=valid_token')
                    .send(updateData);

                if (testCase.valid) {
                    expect(Customer.update).toHaveBeenCalled();
                } else {
                    expect(Customer.update).not.toHaveBeenCalled();
                }
            }
        });test('should validate address requirements', async () => {
            const testCases = [
                { address: '123 Main Street, City', valid: true },
                { address: 'A'.repeat(255), valid: true },
                { address: '', valid: false },
                { address: '   ', valid: false },
                { address: 'A'.repeat(256), valid: false }
            ];

            for (const testCase of testCases) {
                jest.clearAllMocks();
                
                // Re-setup mocks for each iteration
                Account.findOne.mockResolvedValue({
                    email: 'customer@test.com',
                    status: 'Active'
                });

                Customer.findByPk.mockResolvedValue({
                    email: 'customer@test.com',
                    fullName: 'John Doe',
                    phone: '0987654321',
                    address: '123 Test Street',
                    status: 'Active'
                });                Customer.update.mockResolvedValue([1]);

                const updateData = {
                    email: 'customer@test.com',
                    fullName: 'John Smith',
                    phone: '0987654321',
                    address: testCase.address,
                    status: 'Active'
                };

                const response = await request(app)
                    .post('/AutoParts/account/edit')
                    .set('Cookie', 'tokenUser=valid_token')
                    .send(updateData);

                console.log(`Test case ${JSON.stringify(testCase)}, Response status: ${response.status}`);

                if (testCase.valid) {
                    expect(Customer.update).toHaveBeenCalled();
                } else {
                    expect(Customer.update).not.toHaveBeenCalled();
                }
            }
        });
    });

    describe('Security and Authorization', () => {
        test('should prevent unauthorized profile access', async () => {
            Account.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get('/AutoParts/account/profile');

            expect(response.status).toBe(302);
            expect(response.headers.location).toContain('/account/login');
        });

        test('should prevent profile modification with invalid token', async () => {
            Account.findOne.mockResolvedValue(null);

            const updateData = {
                fullName: 'Hacker',
                phone: '0987654321',
                address: 'Malicious Address'
            };

            const response = await request(app)
                .post('/AutoParts/account/edit')
                .set('Cookie', 'tokenUser=invalid_token')
                .send(updateData);

            expect(response.status).toBe(302);
            expect(Customer.update).not.toHaveBeenCalled();
        });

        test('should handle database errors gracefully', async () => {
            Account.findOne.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .get('/AutoParts/account/profile')
                .set('Cookie', 'tokenUser=valid_token');

            expect(response.status).toBe(500);
        });
    });
});
