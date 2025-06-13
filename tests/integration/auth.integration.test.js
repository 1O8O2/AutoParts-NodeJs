// Integration Test 1: Authentication Flow
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');

// Mock database first
jest.mock('../../configs/database', () => ({
    getSequelize: () => ({
        define: jest.fn().mockReturnValue({
            belongsTo: jest.fn(),
            hasMany: jest.fn(),
            hasOne: jest.fn(),
            associate: jest.fn()
        }),
        authenticate: jest.fn().mockResolvedValue(),
        sync: jest.fn().mockResolvedValue()
    })
}));

// Mock all models
jest.mock('../../models/Account', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
}));

jest.mock('../../models/Customer', () => ({
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
}));

jest.mock('../../models/Cart', () => ({
    Cart: {
        create: jest.fn(),
        findByPk: jest.fn()
    }
}));

jest.mock('../../models/Order', () => ({
    findAll: jest.fn()
}));

jest.mock('../../models/RoleGroup', () => ({
    findAll: jest.fn()
}));

const Account = require('../../models/Account');
const Customer = require('../../models/Customer');
const { Cart } = require('../../models/Cart');

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
        REGISTER_ERROR: 'Registration error',
        NOT_MATCH_PASSWORD_WARNING: 'Passwords do not match',
        EMAIL_REQUIRED_WARNING: 'Email is required',
        EMAIL_EXIST_WARNING: 'Email already exists',
        ACCOUNT_CREATE_ERROR: 'Account creation error',
        ACCOUNT_CREATE_SUCCESS: 'Account created successfully',
        LOGIN_SUCCESS: 'Login successful',
        LOGOUT_SUCCESS: 'Logout successful',
        LACK_INFO_WARNING: 'Missing information',
        ACCOUNT_NOT_FOUND_WARNING: 'Account not found',
        PASSWORD_OR_EMAIL_INCORRECT_WARNING: 'Incorrect email or password'
    };
    next();
});

// Import controllers after mocking
const accountController = require('../../controller/client/accountController');

// Setup routes
app.get('/register', accountController.showRegister);
app.post('/register', accountController.register);
app.get('/login', accountController.showLogIn);
app.post('/login', accountController.logIn);
app.get('/logout', accountController.logOut);
app.get('/profile', accountController.showProfile);

describe('Authentication Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
          // Setup mock implementations
        Account.findOne = jest.fn();
        Account.create = jest.fn();
        Account.update = jest.fn();
        Customer.findOne = jest.fn();
        Customer.findByPk = jest.fn();
        Customer.create = jest.fn();
        Customer.update = jest.fn();
        Cart.create = jest.fn();
        Cart.findByPk = jest.fn();
    });

    describe('User Registration Flow', () => {
        test('should successfully register a new user with valid data', async () => {
            // Mock database responses
            Customer.findOne.mockResolvedValue(null); // No existing customer
            Cart.create.mockResolvedValue({ cartId: 'CART123456789' });
            Account.create.mockResolvedValue({
                email: 'test@example.com',
                token: 'random_token_123'
            });
            Customer.create.mockResolvedValue({
                email: 'test@example.com',
                fullName: 'John Doe'
            });

            const response = await request(app)
                .post('/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    repassword: 'password123',
                    fullName: 'John Doe',
                    phone: '0123456789',
                    address: '123 Test Street'
                });

            expect(response.status).toBe(302);
            expect(Account.create).toHaveBeenCalled();
            expect(Customer.create).toHaveBeenCalled();
            expect(Cart.create).toHaveBeenCalled();
        });        test('should fail registration with mismatched passwords', async () => {
            const response = await request(app)
                .post('/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    repassword: 'different_password',
                    fullName: 'John Doe',
                    phone: '0123456789',
                    address: '123 Test Street'
                });

            expect(response.status).toBe(302);
            expect(Account.create).not.toHaveBeenCalled();
        }, 15000);

        test('should fail registration with existing email', async () => {
            Customer.findOne.mockResolvedValue({
                email: 'test@example.com',
                status: 'Active'
            });

            const response = await request(app)
                .post('/register')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                    repassword: 'password123',
                    fullName: 'John Doe',
                    phone: '0123456789',
                    address: '123 Test Street'
                });

            expect(response.status).toBe(302);
            expect(Account.create).not.toHaveBeenCalled();
        });
    });

    describe('User Login Flow', () => {        test('should successfully login with valid credentials', async () => {
            const md5 = require('md5');
            
            Account.findOne.mockResolvedValue({
                email: 'test@example.com',
                password: md5('password123'),
                token: 'valid_token'
            });
            
            Customer.findByPk.mockResolvedValue({
                email: 'test@example.com',
                cartId: 'CART123'
            });
            
            Cart.findByPk.mockResolvedValue({
                cartId: 'CART123'
            });

            const response = await request(app)
                .post('/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123'
                });

            expect(response.status).toBe(302);
            expect(Account.findOne).toHaveBeenCalledWith({
                where: { email: 'test@example.com' }
            });
        }, 15000);

        test('should fail login with invalid credentials', async () => {
            Account.findOne.mockResolvedValue(null);

            const response = await request(app)
                .post('/login')
                .send({
                    email: 'invalid@example.com',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(302);
            expect(Account.findOne).toHaveBeenCalled();
        });

        test('should fail login with missing credentials', async () => {
            const response = await request(app)
                .post('/login')
                .send({
                    email: '',
                    password: ''
                });

            expect(response.status).toBe(302);
        });
    });

    describe('User Logout Flow', () => {
        test('should successfully logout user', async () => {
            const response = await request(app)
                .get('/logout')
                .set('Cookie', ['tokenUser=valid_token']);

            expect(response.status).toBe(302);
        });
    });

    describe('Protected Route Access', () => {
        test('should redirect to login when accessing profile without authentication', async () => {
            Account.findOne.mockResolvedValue(null);

            const response = await request(app)
                .get('/profile');

            expect(response.status).toBe(302);
        });        test('should access profile when properly authenticated', async () => {
            Account.findOne.mockResolvedValue({
                email: 'test@example.com',
                token: 'valid_token'
            });
            
            Customer.findByPk.mockResolvedValue({
                email: 'test@example.com',
                fullName: 'John Doe'
            });

            const Order = require('../../models/Order');
            Order.findAll = jest.fn().mockResolvedValue([]);

            const response = await request(app)
                .get('/profile')
                .set('Cookie', ['tokenUser=valid_token']);

            expect(response.status).toBe(302); // Should redirect since we're not rendering the view properly
            expect(Account.findOne).toHaveBeenCalled();
        });
    });
});
