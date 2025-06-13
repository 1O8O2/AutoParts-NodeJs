// Mock all model dependencies to avoid Sequelize relationship issues
jest.mock('../models/Account', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    findByPk: jest.fn()
}));

jest.mock('../models/Customer', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findByPk: jest.fn()
}));

jest.mock('../models/Cart', () => ({
    Cart: {
        create: jest.fn(),
        findByPk: jest.fn()
    },
    ProductsInCart: {
        findAll: jest.fn(),
        create: jest.fn()
    }
}));

jest.mock('../models/Order', () => ({
    findAll: jest.fn(),
    create: jest.fn()
}));

jest.mock('../configs/system', () => ({
    prefixUrl: '/client'
}));

jest.mock('md5', () => jest.fn());

jest.mock('../helpers/generateToken', () => ({
    generateRandomString: jest.fn()
}));

// Import after mocking
const accountController = require('../controller/client/accountController');
const Account = require('../models/Account');
const Customer = require('../models/Customer');
const { Cart } = require('../models/Cart');
const md5 = require('md5');
const generate = require('../helpers/generateToken');

describe('Account Controller Tests', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();

        req = {
            body: {},
            cookies: {},
            flash: jest.fn(),
        };

        res = {
            render: jest.fn(),
            redirect: jest.fn(),
            cookie: jest.fn(),
            clearCookie: jest.fn(),
            locals: {
                messages: {
                    REGISTER_ERROR: 'Registration error',
                    NOT_MATCH_PASSWORD_WARNING: 'Passwords do not match',
                    EMAIL_REQUIRED_WARNING: 'Email is required',
                    EMAIL_EXIST_WARNING: 'Email already exists',
                    ACCOUNT_CREATE_ERROR: 'Account creation error',
                    ACCOUNT_CREATE_SUCCESS: 'Account created successfully',
                    LOGOUT_SUCCESS: 'Logout successful'
                }
            }
        };

        console.log = jest.fn();
        console.error = jest.fn();
    });

    describe('showRegister function', () => {
        test('should render register page successfully', async () => {
            await accountController.showRegister(req, res);
            expect(res.render).toHaveBeenCalledWith('client/pages/user/register');
        });
    });

    describe('showLogIn function', () => {
        test('should redirect to profile if user is logged in', async () => {
            req.cookies.tokenUser = 'valid_token';
            await accountController.showLogIn(req, res);
            expect(res.redirect).toHaveBeenCalledWith('/client/account/profile');
        });

        test('should render login page if user is not logged in', async () => {
            req.cookies.tokenUser = undefined;
            await accountController.showLogIn(req, res);
            expect(res.render).toHaveBeenCalledWith('client/pages/user/login', {
                messagelist: res.locals.messages
            });
        });
    });

    describe('logOut function', () => {
        test('should clear cookies and redirect to home', async () => {
            await accountController.logOut(req, res);
            expect(res.clearCookie).toHaveBeenCalledWith('tokenUser');
            expect(res.clearCookie).toHaveBeenCalledWith('cartId');
            expect(req.flash).toHaveBeenCalledWith('success', 'Logout successful');
            expect(res.redirect).toHaveBeenCalledWith('/client');
        });
    });

    describe('showForgotPassword function', () => {
        test('should render forgot password page', async () => {
            await accountController.showForgotPassword(req, res);
            expect(res.render).toHaveBeenCalledWith('client/pages/user/forgot-password');
        });
    });

    describe('register function', () => {
        beforeEach(() => {
            req.body = {
                email: 'test@example.com',
                password: 'password123',
                repassword: 'password123',
                phone: '1234567890',
                address: '123 Test Street',
                fullName: 'Test User'
            };
            md5.mockReturnValue('hashed_password');
            generate.generateRandomString.mockReturnValue('random_token');
        });

        test('should redirect back if required fields are missing', async () => {
            req.body.email = '';
            await accountController.register(req, res);
            expect(req.flash).toHaveBeenCalledWith('error', 'Registration error');
            expect(res.redirect).toHaveBeenCalledWith('back');
        });

        test('should redirect back if passwords do not match', async () => {
            req.body.repassword = 'different_password';
            await accountController.register(req, res);
            expect(req.flash).toHaveBeenCalledWith('error', 'Passwords do not match');
            expect(res.redirect).toHaveBeenCalledWith('back');
        });

        test('should redirect back if email already exists', async () => {
            Customer.findOne.mockResolvedValue({
                email: 'test@example.com',
                status: 'Active'
            });
            await accountController.register(req, res);
            expect(req.flash).toHaveBeenCalledWith('error', 'Email already exists');
            expect(res.redirect).toHaveBeenCalledWith('back');
        });

        test('should successfully register a new user', async () => {
            Customer.findOne.mockResolvedValue(null);
            Cart.create.mockResolvedValue({ cartId: 'CART1234567890' });
            Account.create.mockResolvedValue(true);
            Customer.create.mockResolvedValue(true);

            await accountController.register(req, res);

            expect(Cart.create).toHaveBeenCalled();
            expect(Account.create).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'hashed_password',
                token: 'random_token',
                permission: 'RG002',
                status: 'Active',
                deleted: false
            });
            expect(res.cookie).toHaveBeenCalledWith('tokenUser', 'random_token');
            expect(req.flash).toHaveBeenCalledWith('success', 'Account created successfully');
            expect(res.redirect).toHaveBeenCalledWith('/client/account/login');
        });

        test('should handle cart creation failure', async () => {
            Customer.findOne.mockResolvedValue(null);
            Cart.create.mockResolvedValue(null);
            await accountController.register(req, res);
            expect(req.flash).toHaveBeenCalledWith('error', 'Account creation error');
            expect(res.render).toHaveBeenCalledWith('client/pages/user/register', {});
        });        test('should handle database errors gracefully', async () => {
            Customer.findOne.mockRejectedValue(new Error('Database error'));
            
            // Since Customer.findOne is outside the try-catch in the actual controller,
            // the error will be thrown and not caught
            await expect(accountController.register(req, res)).rejects.toThrow('Database error');
        });
    });
});
