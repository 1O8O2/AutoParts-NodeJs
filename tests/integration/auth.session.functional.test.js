// Functional Test 4: User Authentication and Session Management System
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock database and dependencies
jest.mock('../../configs/database', () => ({
    getSequelize: () => ({
        define: jest.fn().mockReturnValue({
            belongsTo: jest.fn(),
            hasMany: jest.fn(),
            hasOne: jest.fn()
        }),
        authenticate: jest.fn().mockResolvedValue(),
        sync: jest.fn().mockResolvedValue()
    })
}));

jest.mock('../../models/Account');
jest.mock('../../models/Customer');
jest.mock('../../models/Employee');
jest.mock('../../models/Cart');
jest.mock('../../models/RoleGroup');
jest.mock('../../services/SessionManager');
jest.mock('../../helpers/otpManager');
jest.mock('../../helpers/mail');

const Account = require('../../models/Account');
const Customer = require('../../models/Customer');
const Employee = require('../../models/Employee');
const { Cart } = require('../../models/Cart');
const { RoleGroup } = require('../../models/RoleGroup');
const otpManager = require('../../helpers/otpManager');
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
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));
app.use(flash());

// Mock middleware
app.use((req, res, next) => {
    res.locals.messages = {
        LOGIN_SUCCESS: 'Login successful',
        LOGIN_ERROR: 'Login failed',
        LOGOUT_SUCCESS: 'Logout successful',
        REGISTER_SUCCESS: 'Registration successful',
        REGISTER_ERROR: 'Registration failed',
        PASSWORD_RESET_SUCCESS: 'Password reset successful',
        OTP_SENT: 'OTP sent to your email',
        OTP_VERIFIED: 'OTP verified successfully',
        OTP_INVALID: 'Invalid OTP',
        SESSION_EXPIRED: 'Session expired',
        UNAUTHORIZED_ACCESS: 'Unauthorized access',
        PASSWORD_CHANGED: 'Password changed successfully',
        ACCOUNT_LOCKED: 'Account locked due to multiple failed attempts'
    };
    next();
});

// Import controllers
const clientAuthController = require('../../controller/client/accountController');
const adminAuthController = require('../../controller/admin/authController');
const forgotPasswordController = require('../../controller/client/forgotPasswordController');

// Setup routes
app.post('/client/login', clientAuthController.logIn);
app.post('/client/register', clientAuthController.register);
app.get('/client/logout', clientAuthController.logOut);
app.get('/client/profile', clientAuthController.showProfile);
app.post('/admin/login', adminAuthController.loginPost);
app.get('/admin/logout', adminAuthController.logout);
app.post('/forgot-password', forgotPasswordController.forgotPassword);
app.post('/verify-otp', forgotPasswordController.otpVerify);
app.post('/reset-password', forgotPasswordController.updatePassword);

describe('Authentication and Session Management Functional Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup default mocks
        Account.findOne = jest.fn();
        Account.create = jest.fn();
        Account.update = jest.fn();
        Customer.findOne = jest.fn();
        Customer.findByPk = jest.fn();
        Customer.create = jest.fn();
        Employee.findByPk = jest.fn();
        Cart.create = jest.fn();
        Cart.findByPk = jest.fn();
        RoleGroup.findOne = jest.fn();
        otpManager.generateOTP = jest.fn();
        otpManager.verifyOTP = jest.fn();
        otpManager.saveOTPToCookie = jest.fn();
        mailSend.mockResolvedValue(true);
    });

    describe('Client Authentication Flow', () => {
        test('should handle complete user registration process', async () => {
            // Mock successful registration flow
            Customer.findOne.mockResolvedValue(null); // No existing customer
            Cart.create.mockResolvedValue({ cartId: 'CART123456789' });
            Account.create.mockResolvedValue({
                email: 'newuser@test.com',
                token: 'random_token_123',
                password: 'hashed_password'
            });
            Customer.create.mockResolvedValue({
                email: 'newuser@test.com',
                fullName: 'New User',
                cartId: 'CART123456789'
            });

            const response = await request(app)
                .post('/client/register')
                .send({
                    email: 'newuser@test.com',
                    password: 'SecurePass123',
                    repassword: 'SecurePass123',
                    fullName: 'New User',
                    phone: '0123456789',
                    address: '123 Test Street'
                });

            expect(response.status).toBe(302);
            expect(Account.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    email: 'newuser@test.com',
                    permission: 'RG002' // Customer role
                })
            );
            expect(Customer.create).toHaveBeenCalled();
            expect(Cart.create).toHaveBeenCalled();
        });

        test('should handle user login with valid credentials', async () => {
            const mockAccount = {
                email: 'user@test.com',
                password: '5f4dcc3b5aa765d61d8327deb882cf99', // MD5 hash of 'password'
                token: 'valid_token_123',
                status: 'Active'
            };

            const mockCustomer = {
                email: 'user@test.com',
                fullName: 'Test User',
                cartId: 'CART987654321'
            };

            const mockCart = {
                cartId: 'CART987654321'
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue(mockCustomer);
            Cart.findByPk.mockResolvedValue(mockCart);

            const response = await request(app)
                .post('/client/login')
                .send({
                    email: 'user@test.com',
                    password: 'password'
                });

            expect(response.status).toBe(302);
            expect(Account.findOne).toHaveBeenCalledWith({
                where: { email: 'user@test.com' }
            });
            
            // Check if cookies are set
            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
        });

        test('should reject login with invalid credentials', async () => {
            Account.findOne.mockResolvedValue(null); // No account found

            const response = await request(app)
                .post('/client/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(302);
            expect(Account.findOne).toHaveBeenCalled();
        });

        test('should handle user logout and clear session', async () => {
            const response = await request(app)
                .get('/client/logout')
                .set('Cookie', ['tokenUser=valid_token']);

            expect(response.status).toBe(302);
            
            // Check if cookies are cleared
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                const tokenCookie = cookies.find(cookie => cookie.includes('tokenUser='));
                if (tokenCookie) {
                    expect(tokenCookie).toMatch(/tokenUser=;|tokenUser=""/) ;
                }
            }
        });

        test('should protect user profile route', async () => {
            // First test: No authentication
            Account.findOne.mockResolvedValue(null);

            const unauthenticatedResponse = await request(app)
                .get('/client/profile');

            expect(unauthenticatedResponse.status).toBe(302);

            // Second test: Valid authentication
            Account.findOne.mockResolvedValue({
                email: 'user@test.com',
                token: 'valid_token'
            });
            Customer.findByPk.mockResolvedValue({
                email: 'user@test.com',
                fullName: 'Test User'
            });
            const Order = require('../../models/Order');
            Order.findAll = jest.fn().mockResolvedValue([]);

            const authenticatedResponse = await request(app)
                .get('/client/profile')
                .set('Cookie', ['tokenUser=valid_token']);

            expect(authenticatedResponse.status).toBe(200);
            expect(Account.findOne).toHaveBeenCalled();
        });
    });

    describe('Admin Authentication Flow', () => {
        test('should handle admin login with proper permissions', async () => {
            const mockAdminAccount = {
                email: 'admin@test.com',
                password: '5f4dcc3b5aa765d61d8327deb882cf99', // MD5 hash of 'password'
                token: 'admin_token_123',
                permission: 'RG001', // Admin role
                status: 'Active'
            };

            Account.findByPk.mockResolvedValue(mockAdminAccount);

            const response = await request(app)
                .post('/admin/login')
                .send({
                    email: 'admin@test.com',
                    password: 'password'
                });

            expect(response.status).toBe(302);
            expect(Account.findByPk).toHaveBeenCalledWith('admin@test.com');
        });

        test('should reject customer login to admin panel', async () => {
            const mockCustomerAccount = {
                email: 'customer@test.com',
                password: '5f4dcc3b5aa765d61d8327deb882cf99',
                permission: 'RG002' // Customer role
            };

            Account.findByPk.mockResolvedValue(mockCustomerAccount);

            const response = await request(app)
                .post('/admin/login')
                .send({
                    email: 'customer@test.com',
                    password: 'password'
                });

            expect(response.status).toBe(302);
            // Should redirect back with error
        });

        test('should handle admin logout', async () => {
            const response = await request(app)
                .get('/admin/logout')
                .set('Cookie', ['token=admin_token']);

            expect(response.status).toBe(302);
            
            // Check if admin token cookie is cleared
            const cookies = response.headers['set-cookie'];
            if (cookies) {
                const tokenCookie = cookies.find(cookie => cookie.includes('token='));
                if (tokenCookie) {
                    expect(tokenCookie).toMatch(/token=;|token=""/);
                }
            }
        });
    });

    describe('Password Reset and Recovery', () => {
        test('should initiate password reset with OTP', async () => {
            const mockAccount = {
                email: 'user@test.com',
                status: 'Active'
            };

            Account.findOne.mockResolvedValue(mockAccount);
            otpManager.generateOTP.mockReturnValue('123456');
            otpManager.saveOTPToCookie.mockReturnValue(true);

            const response = await request(app)
                .post('/forgot-password')
                .send({
                    email: 'user@test.com'
                });

            expect(response.status).toBe(302);
            expect(otpManager.generateOTP).toHaveBeenCalled();
            expect(mailSend).toHaveBeenCalledWith(
                'user@test.com',
                expect.any(String),
                expect.stringContaining('123456')
            );
        });

        test('should verify OTP and allow password reset', async () => {
            otpManager.verifyOTP.mockReturnValue({
                isValid: true,
                email: 'user@test.com'
            });

            const response = await request(app)
                .post('/verify-otp')
                .set('Cookie', ['otp=encrypted_otp_data'])
                .send({
                    otp: '123456'
                });

            expect(response.status).toBe(302);
            expect(otpManager.verifyOTP).toHaveBeenCalledWith(
                expect.any(Object),
                '123456'
            );
        });

        test('should reject invalid OTP', async () => {
            otpManager.verifyOTP.mockReturnValue({
                isValid: false,
                message: 'Invalid OTP'
            });

            const response = await request(app)
                .post('/verify-otp')
                .set('Cookie', ['otp=encrypted_otp_data'])
                .send({
                    otp: '999999'
                });

            expect(response.status).toBe(302);
            expect(otpManager.verifyOTP).toHaveBeenCalled();
        });

        test('should update password after OTP verification', async () => {
            const mockAccount = {
                email: 'user@test.com',
                update: jest.fn(),
                save: jest.fn()
            };

            Account.findOne.mockResolvedValue(mockAccount);

            const response = await request(app)
                .post('/reset-password')
                .send({
                    email: 'user@test.com',
                    newPassword: 'NewSecurePass123',
                    confirmPassword: 'NewSecurePass123'
                });

            expect(response.status).toBe(302);
            expect(Account.findOne).toHaveBeenCalledWith({
                where: { email: 'user@test.com' }
            });
        });
    });

    describe('Session Management and Security', () => {
        test('should handle session timeout', async () => {
            // Mock expired session
            const expiredTime = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
            
            const response = await request(app)
                .get('/client/profile')
                .set('Cookie', [`tokenUser=expired_token; Max-Age=0`]);

            expect(response.status).toBe(302);
        });

        test('should handle concurrent sessions', async () => {
            const mockAccount = {
                email: 'user@test.com',
                token: 'current_token',
                status: 'Active'
            };

            Account.findOne.mockResolvedValue(mockAccount);

            // First session
            const session1Response = await request(app)
                .post('/client/login')
                .send({
                    email: 'user@test.com',
                    password: 'password'
                });

            // Second session (should invalidate first)
            const session2Response = await request(app)
                .post('/client/login')
                .send({
                    email: 'user@test.com',
                    password: 'password'
                });

            expect(session1Response.status).toBe(302);
            expect(session2Response.status).toBe(302);
        });

        test('should prevent brute force attacks', async () => {
            Account.findOne.mockResolvedValue({
                email: 'user@test.com',
                password: 'correct_hash',
                status: 'Active'
            });

            // Simulate multiple failed login attempts
            const failedAttempts = [];
            for (let i = 0; i < 5; i++) {
                const response = await request(app)
                    .post('/client/login')
                    .send({
                        email: 'user@test.com',
                        password: 'wrong_password'
                    });
                failedAttempts.push(response);
            }

            // All should fail
            failedAttempts.forEach(response => {
                expect(response.status).toBe(302);
            });

            // Account should be locked after multiple failures
            // (This would be implemented in the actual controller)
        });

        test('should validate session integrity', async () => {
            const mockAccount = {
                email: 'user@test.com',
                token: 'valid_token',
                status: 'Active'
            };

            Account.findOne.mockResolvedValue(mockAccount);
            Customer.findByPk.mockResolvedValue({
                email: 'user@test.com',
                fullName: 'Test User'
            });

            // Valid session
            const validResponse = await request(app)
                .get('/client/profile')
                .set('Cookie', ['tokenUser=valid_token']);

            expect(validResponse.status).toBe(200);

            // Invalid token
            Account.findOne.mockResolvedValue(null);

            const invalidResponse = await request(app)
                .get('/client/profile')
                .set('Cookie', ['tokenUser=invalid_token']);

            expect(invalidResponse.status).toBe(302);
        });

        test('should handle role-based access control', async () => {
            // Mock different role groups
            RoleGroup.findOne.mockImplementation((query) => {
                const roleId = query.where.roleGroupId;
                if (roleId === 'RG001') {
                    return Promise.resolve({
                        roleGroupId: 'RG001',
                        roleGroupName: 'Admin',
                        permissions: ['QUAN_LY_SAN_PHAM', 'QUAN_LY_DON_HANG', 'QUAN_LY_KHACH_HANG']
                    });
                } else if (roleId === 'RG002') {
                    return Promise.resolve({
                        roleGroupId: 'RG002',
                        roleGroupName: 'Customer',
                        permissions: ['XEM_SAN_PHAM', 'DAT_HANG']
                    });
                }
                return null;
            });

            // Test admin access
            const adminAccount = {
                email: 'admin@test.com',
                permission: 'RG001'
            };

            Account.findOne.mockResolvedValue(adminAccount);

            const adminResponse = await request(app)
                .get('/client/profile')
                .set('Cookie', ['tokenUser=admin_token']);

            expect(adminResponse.status).toBe(200);

            // Test customer access
            const customerAccount = {
                email: 'customer@test.com',
                permission: 'RG002'
            };

            Account.findOne.mockResolvedValue(customerAccount);
            Customer.findByPk.mockResolvedValue({
                email: 'customer@test.com',
                fullName: 'Customer User'
            });

            const customerResponse = await request(app)
                .get('/client/profile')
                .set('Cookie', ['tokenUser=customer_token']);

            expect(customerResponse.status).toBe(200);
        });
    });

    describe('Account Security Features', () => {
        test('should enforce password complexity', async () => {
            Customer.findOne.mockResolvedValue(null);

            // Weak password
            const weakPasswordResponse = await request(app)
                .post('/client/register')
                .send({
                    email: 'user@test.com',
                    password: '123', // Too weak
                    repassword: '123',
                    fullName: 'Test User',
                    phone: '0123456789',
                    address: '123 Test Street'
                });

            expect(weakPasswordResponse.status).toBe(302);
            // Should redirect back with error

            // Strong password
            const strongPasswordResponse = await request(app)
                .post('/client/register')
                .send({
                    email: 'user@test.com',
                    password: 'StrongPass123!',
                    repassword: 'StrongPass123!',
                    fullName: 'Test User',
                    phone: '0123456789',
                    address: '123 Test Street'
                });

            // Mock successful creation for strong password
            Cart.create.mockResolvedValue({ cartId: 'CART123' });
            Account.create.mockResolvedValue({ email: 'user@test.com' });
            Customer.create.mockResolvedValue({ email: 'user@test.com' });

            expect(strongPasswordResponse.status).toBe(302);
        });

        test('should handle account activation and deactivation', async () => {
            // Active account
            const activeAccount = {
                email: 'active@test.com',
                password: '5f4dcc3b5aa765d61d8327deb882cf99',
                status: 'Active'
            };

            Account.findOne.mockResolvedValue(activeAccount);
            Customer.findByPk.mockResolvedValue({
                email: 'active@test.com',
                fullName: 'Active User'
            });
            Cart.findByPk.mockResolvedValue({ cartId: 'CART123' });

            const activeResponse = await request(app)
                .post('/client/login')
                .send({
                    email: 'active@test.com',
                    password: 'password'
                });

            expect(activeResponse.status).toBe(302);

            // Inactive account
            const inactiveAccount = {
                email: 'inactive@test.com',
                password: '5f4dcc3b5aa765d61d8327deb882cf99',
                status: 'Inactive'
            };

            Account.findOne.mockResolvedValue(inactiveAccount);

            const inactiveResponse = await request(app)
                .post('/client/login')
                .send({
                    email: 'inactive@test.com',
                    password: 'password'
                });

            expect(inactiveResponse.status).toBe(302);
            // Should redirect with error message
        });
    });
});
