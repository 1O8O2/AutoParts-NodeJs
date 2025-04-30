// Models
const Account = require('../../models/Account');
const Customer = require('../../models/Customer');
const {Cart, ProductsInCart} = require('../../models/Cart');
const Order = require('../../models/Order');

// Helper
const generate = require("../../helpers/generateToken");

// [GET] /account/register
module.exports.showRegister = async (req, res) => {
    res.render('client/pages/user/register');
}

// [POST] /account/register
module.exports.register = async (req, res) => {
    const { email, password, repassword, phone, address, fullName } = req.body;

    if (password !== repassword) {
        req.session.message = 'Mật khẩu không khớp';
        return res.render('client/pages/user/register', { message: req.session.message });
    }

    if (!email) {
        req.session.message = 'Email là bắt buộc';
        return res.render('client/pages/user/register', { message: req.session.message });
    }

    try {
        // Create a new Cart
        const cartId = 'CART' + Date.now().toString().substring(8);
        const newCart = await Cart.create({ cartId });
        if (!newCart) {
            req.session.message = 'Không thể thêm tài khoản';
            return res.render('client/pages/user/register', { message: req.session.message });
        }

        // Create a new Account
        const token = generate.generateRandomString(20);
        const newAccount = await Account.create({
            email: email,
            password,
            token: token,
            permission: 'RG002', 
            status: 'Active',
            deleted: false
        });
        if (!newAccount) {
            req.session.message = 'Không thể thêm tài khoản';
            return res.render('client/pages/user/register', { message: req.session.message });
        }
        res.cookie("tokenUser", newAccount.token);

        // Create a new Customer
        const newCustomer = await Customer.create({
            email: email,
            cartId: newCart.cartId,
            fullName,
            phone,
            address,
            status: 'Active'
        });
        if (newCustomer) {
            req.session.message = 'Đăng ký thành công, vui lòng đăng nhập';
            return res.redirect('/AutoParts/account/login');
        } else {
            // Rollback Account if Customer creation fails
            await Account.destroy({ where: { email: email } });
            req.session.message = 'Không thể thêm tài khoản';
            return res.render('client/pages/user/register', { message: req.session.message });
        }
    } catch (error) {
        console.error("Registration error:", error);
        req.session.message = 'Đăng ký thất bại, có lỗi xảy ra';
        return res.render('client/pages/user/register', { message: req.session.message });
    }
}

// [GET] /account/login
module.exports.showLogIn = async (req, res) => {
    if (req.cookies?.tokenUser) {
        return res.redirect('/AutoParts/account/profile');
    }
    return res.render('client/pages/user/login');
};

// [POST] /account/login
module.exports.logIn = async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!password || !email) {
        return res.render('client/pages/user/login', { message: 'Dữ liệu không hợp lệ' });
    }

    const account = await Account.findOne({ where: { email: email } });
    if (!account) {
        return res.render('client/pages/user/login', { message: 'Không tìm thấy tài khoản' });
    }

    if (password !== account.password) {
        return res.render('client/pages/user/login', { message: 'Sai email hoặc mật khẩu' }); 
    } 

    const customer = await Customer.findByPk(account.email);
    const cart = await Cart.findByPk(customer.cartId);

    res.cookie("cartId", cart.cartId);
    res.cookie("tokenUser", account.token);

    return res.redirect('/AutoParts');
}

// [GET] /account/profile
module.exports.showProfile = async (req, res) => {
    const tokenUser = req.cookies.tokenUser;

    try {
        const acc = await Account.findOne({ where: { token: tokenUser } });
        if (!acc) {
            return res.redirect('/AutoParts/account/login');
        }
        
        const customer = await Customer.findByPk(acc.email);
        const orderLst = await Order.findAll({ where: { userEmail: acc.email, deleted : false} }); 

        return res.render('client/pages/user/profile', {
            customer,
            orders: orderLst
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.render('client/pages/user/profile', { message: 'Đã xảy ra lỗi khi tải thông tin' });
    }
}

// [POST] /account/edit
module.exports.accountEdit = async(req, res) => {
    const acc = await Account.findOne({
        where: { token: req.cookies.tokenUser }
    });
    console.log(req.body)
    if (!acc) {
        return res.redirect('/AutoParts/account/login');
    }
    if (req.body.phone.length < 10) {
        req.flash('error', res.locals.messages.INVALID_PHONE_WARNING);
        return res.redirect('back');
    }
    if (req.body.fullName.length < 6) {
        req.flash('error', res.locals.messages.INVALID_NAME_WARNING);
        return res.redirect('back');
    }
    if (req.body.address.length < 6) {
        req.flash('error', res.locals.messages.INVALID_ADDRESS_WARNING);
        return res.redirect('back');
    }
    if (req.body.fullName === acc.fullName && req.body.phone === acc.phone && req.body.address === acc.address) {
        req.flash('error', res.locals.messages.NO_CHANGE_WARNING);
        return res.redirect('back');
    }
    if (req.body.email !== acc.email) {
        req.flash('error', res.locals.messages.EMAIL_CHANGE_WARNING);
        return res.redirect('back');
    }
    if (req.body.status !== acc.status) {
        req.flash('error', res.locals.messages.STATUS_CHANGE_WARNING);
        return res.redirect('back');
    }

    try {
        await Customer.update(
            req.body,
            { 
                where: { 
                    email: acc.email
                } 
            }
        );
        console.log("Update customer successfully",res.locals.messages.EDIT_PROFILE_SUCCESS)
        req.flash('success', res.locals.messages.EDIT_PROFILE_SUCCESS);
        return res.redirect('back');
    } catch (error) {
        req.flash('error', res.locals.messages.EDIT_PROFILE_ERROR);
        return res.redirect('back');
    }
}

// [POST] /account/changePass
module.exports.changePassword = async(req, res) => {
    const acc = await Account.findOne({
        where: { token: req.cookies.tokenUser }
    });
    
    if (!acc) {
        return res.redirect('/AutoParts/account/login');
    }
    
    try {
        const { pass, newpass ,confirmpass} = req.body;
        if (newpass !== confirmpass) {
            req.flash('error', res.locals.messages.NOT_MATCH_PASSWORD_WARNING);
            return res.redirect('back');
        }
        if (newpass.length < 6||pass.length < 6 ||confirmpass.length < 6) {
            req.flash('error', res.locals.messages.INVALID_PASSWORD_WARNING);
            return res.redirect('back');
        }
        if (newpass === pass) {
            req.flash('error', res.locals.messages.NOT_DIFFERENT_PASSWORD_WARNING);
            return res.redirect('back');
        }
        if (acc.password === pass) {
            await Account.update(
                { 
                    password: newpass 
                },
                { 
                    where: { 
                        email: acc.email 
                    } 
                }
            );
            req.flash('success', res.locals.messages.EDIT_PROFILE_SUCCESS);
            return res.redirect('/AutoParts/account/profile');
        } else {
            req.flash('error', res.locals.messages.INCORRECT_PASSWORD_WARNING);
            return res.redirect('back');
        }
    } catch (error) {
        req.flash('error', res.locals.messages.PASSWORD_CHANGE_ERROR);
        return res.redirect('back');
    }
}

// [GET] /account/logout
module.exports.logOut = async(req, res) => {
    res.clearCookie("tokenUser");
    res.clearCookie("cartId");
    return res.redirect('/AutoParts');
}


// [GET] /account/forgot-password
module.exports.showForgotPassword = async (req, res) => {
    res.render('client/pages/user/forgot-password');
}

