// Models
const Account = require('../../models/Account');
const Customer = require('../../models/Customer');
const {Cart, ProductsInCart} = require('../../models/Cart');
const Order = require('../../models/Order');
const systemConfig = require('../../configs/system');

// Helper
const generate = require("../../helpers/generateToken");

// [GET] /account/register
module.exports.showRegister = async (req, res) => {
    res.render('client/pages/user/register');
}

// [POST] /account/register
module.exports.register = async (req, res) => {
    const { email, password, repassword, phone, address, fullName } = req.body;
    if( !email || !password || !repassword || !phone || !address || !fullName) {
        req.flash('error', res.locals.messages.REGISTER_ERROR);
        res.redirect('back');

    }

    if (password !== repassword) {
        req.flash('error', res.locals.messages.NOT_MATCH_PASSWORD_WARNING);
        res.redirect('back');
    }

    if (!email) {
        req.flash('error', res.locals.messages.EMAIL_REQUIRED_WARNING);
        return res.redirect('back');
    }

    let customer = await Customer.findOne({ where: { email: email } });
    if (customer) {
        req.flash('error', res.locals.messages.EMAIL_EXIST_WARNING);
        return res.redirect('back');
    }

    try {
        // Create a new Cart
        const cartId = 'CART' + Date.now().toString().substring(8);
        const newCart = await Cart.create({ cartId });
        if (!newCart) {
            req.flash('error', res.locals.messages.ACCOUNT_CREATE_ERROR);
            return res.render('client/pages/user/register', { });
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
            req.flash('error', res.locals.messages.ACCOUNT_CREATE_ERROR);
            return res.redirect('back');
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
            req.flash('success', res.locals.messages.ACCOUNT_CREATE_SUCCESS);
            return res.redirect(systemConfig.prefixUrl+'/account/login');
        } else {
            // Rollback Account if Customer creation fails
            await Account.destroy({ where: { email: email } });
            req.flash('error', res.locals.messages.ACCOUNT_CREATE_ERROR);
            return res.redirect('back');       
        }
    } catch (error) {
        console.error("Registration error:", error);
        req.flash('error', res.locals.messages.ACCOUNT_CREATE_ERROR);
        return res.redirect('back');
    }
}

// [GET] /account/login
module.exports.showLogIn = async (req, res) => {
    if (req.cookies?.tokenUser) {
        return res.redirect(systemConfig.prefixUrl+'/account/profile');
    }
    return res.render('client/pages/user/login',
        {
            messagelist: res.locals.messages,
        }
    );
};

// [POST] /account/login
module.exports.logIn = async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!password || !email) {
        req.flash('error', res.locals.messages.LACK_INFO_WARNING);
        return res.redirect('back')
    }

    const account = await Account.findOne({ where: { email: email } });
    if (!account) {
        req.flash('error', res.locals.messages.ACCOUNT_NOT_FOUND_WARNING);
        return res.redirect('back');
    }

    if (password !== account.password) {
        req.flash('error', res.locals.messages.PASSWORD_OR_EMAIL_INCORRECT_WARNING);
        return res.redirect('back');
    } 

    const customer = await Customer.findByPk(account.email);
    if (!customer) {
        req.flash('error', res.locals.messages.ACCOUNT_NOT_FOUND_WARNING);
        return res.redirect('back');
    }

    const cart = await Cart.findByPk(customer.cartId);
    res.cookie("cartId", cart.cartId);
    res.cookie("tokenUser", account.token);
    req.flash('success', res.locals.messages.LOGIN_SUCCESS);
    return res.redirect(systemConfig.prefixUrl+'/account/profile');
}

// [GET] /account/profile
module.exports.showProfile = async (req, res) => {
    const tokenUser = req.cookies.tokenUser;

    try {
        const acc = await Account.findOne({ where: { token: tokenUser } });
        if (!acc) {
            return res.redirect(systemConfig.prefixUrl+'account/login');
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
        req.flash('error', res.locals.messages.DATA_ERROR);
        return res.redirect('back');
    }
}

// [POST] /account/edit
module.exports.accountEdit = async(req, res) => {
    
    const acc = await Account.findOne({
        where: { token: req.cookies.tokenUser }
    });
    if (!acc) {
        req.flash('error', res.locals.messages.ACCOUNT_NOT_FOUND_WARNING);
        return res.redirect(systemConfig.prefixUrl+'account/login');
    }
    console.log(req.body)
    if( !acc ||!req.body.phone || !req.body.fullName || !req.body.address ||!req.body.status|| !req.body.email) {
        req.flash('error', res.locals.messages.EDIT_PROFILE_ERROR);
        return res.redirect("back");
    }

    if (req.body.phone.length < 10) {
        req.flash('error', res.locals.messages.INVALID_PHONE_WARNING);
        return res.redirect("back")
    }
    if (req.body.fullName.length < 6) {
        req.flash('error', res.locals.messages.INVALID_NAME_WARNING);
        return res.redirect("back")
    }
    if (req.body.address.length < 6) {
        req.flash('error', res.locals.messages.INVALID_ADDRESS_WARNING);
        return res.redirect("back")
    }
    if (req.body.fullName === acc.fullName && req.body.phone === acc.phone && req.body.address === acc.address) {
        req.flash('error', res.locals.messages.NO_CHANGE_WARNING);
        return res.redirect("back")
    }
    if (req.body.email !== acc.email) {
        req.flash('error', res.locals.messages.EMAIL_CHANGE_WARNING);
        return res.redirect("back")
    }
    if (req.body.status !== acc.status) {
        req.flash('error', res.locals.messages.STATUS_CHANGE_WARNING);
        return res.redirect("back")
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
        req.flash('success', res.locals.messages.EDIT_PROFILE_SUCCESS);
        return res.redirect(systemConfig.prefixUrl+'/account/profile');   
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
        req.flash('error', res.locals.messages.ACCOUNT_NOT_FOUND_WARNING);
        return res.redirect(systemConfig.prefixUrl+'/account/login');
    }
    
    try {
        const { pass, newpass ,confirmpass} = req.body;
        if (newpass !== confirmpass) {
            req.flash('error', res.locals.messages.NOT_MATCH_PASSWORD_WARNING);
            return res.redirect('back');
        }
        if (newpass.length < 4||pass.length < 4 ||confirmpass.length < 4) {
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

            req.flash('success', res.locals.messages.CHANGE_PASSWORD_SUCCESS);
            return res.redirect('back');
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
    req.flash('success', res.locals.messages.LOGOUT_SUCCESS);
    return res.redirect(systemConfig.prefixUrl);
}



// [GET] /account/forgot-password
module.exports.showForgotPassword = async (req, res) => {
    
    res.render('client/pages/user/forgot-password');
}

