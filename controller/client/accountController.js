// Models
const Account = require('../../models/Account');
const Customer = require('../../models/Customer');
const {Cart, productInCart} = require('../../models/Cart');
const Order = require('../../models/Order');

// Helper
const generate = require("../../helpers/generate");

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

    try {
        // Create a new Cart
        const cartId = 'CART' + phone;
        const newCart = await Cart.create({ cartId });
        if (!newCart) {
            req.session.message = 'Không thể thêm tài khoản';
            return res.render('register', { message: req.session.message });
        }

        // Create a new Account
        const token = generate.generateRandomString(20);
        const newAccount = await Account.create({
            phone: phone, 
            password,
            token: token,
            email: email || '',
            permission: 'RG002', 
            status: 'Active',
            deleted: false
        });
        if (!newAccount) {
            req.session.message = 'Không thể thêm tài khoản';
            return res.render('register', { message: req.session.message });
        }
        res.cookie("tokenUser", newAccount.token);

        // Create a new Customer
        const newCustomer = await Customer.create({
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
            await Account.destroy({ where: { phoneNumber: phone } });
            req.session.message = 'Không thể thêm tài khoản';
            return res.render('register', { message: req.session.message });
        }
    } catch (error) {
        req.session.message = 'Đăng ký thất bại, có lỗi xảy ra';
        return res.render('register', { message: req.session.message });
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
    const { phone, password } = req.body;

    // Validation
    if (!password || !phone || password.length < 4 || phone.length < 10) {
        return res.render('client/pages/user/login', { message: 'Dữ liệu không hợp lệ' });
    }

    const account = await Account.findOne({ where: { phone: phone } });
    if (!account) {
        return res.render('client/pages/user/login', { message: 'Không tìm thấy tài khoản' });
    }

    if (password !== account.password) {
        return res.render('client/pages/user/login', { message: 'Sai email hoặc mật khẩu' }); 
    } 

    const customer = await Customer.findByPk(account.phone);
    const cart = await Cart.findByPk(customer.cartId);

    // const productsInCart = cart.products; // Assuming Cart has a virtual 'products' field
    // const products = {};
    // for (const productId of Object.keys(productsInCart)) {
    //     const product = await Product.findOne({ where: { productId } });
    //     products[productId] = productsInCart[productId];
    // }

    res.cookie("cartId", cart.cartId);
    res.cookie("tokenUser", account.token);

    return res.redirect('/AutoParts');
}

// [GET] /account/profile
module.exports.showProfile = async (req, res) => {
    const tokenUser = req.cookies.tokenUser;

    try {
        const acc = await Account.findOne({ where: { token: tokenUser } });
        const customer = await Customer.findByPk(acc.phone);
        const orderLst = await Order.findAll({ where: { userPhone: acc.phone } }); 

        return res.render('client/pages/user/profile', {
            customer,
            orders: orderLst
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        //res.render('profile', { message: 'Đã xảy ra lỗi khi tải thông tin' });
    }
}

// [POST] /account/edit
module.exports.accountEdit = async(req, res) => {
    const acc = await Account.findOne({
        where: { token: req.cookies.tokenUser }
    });

    try {
        await Customer.update(
            req.body,
            { 
                where: { 
                    phone: acc.phone
                } 
            }
        );

        return res.redirect('back');
    } catch (error) {
        return res.render('profile', { message: 'Cập nhật thất bại' });
    }
}

// [POST] /account/changePass
module.exports.changePassword = async(req, res) => {
    const acc = await Account.findOne({
        where: { token: req.cookies.tokenUser }
    });
    
    try {
        const { pass, newpass } = req.body;

        if (acc.password === pass) {
            await Account.update(
                { 
                    password: newpass 
                },
                { 
                    where: { 
                        phone: acc.phone 
                    } 
                }
            );
            return res.redirect('/AutoParts/account/profile');
        } else {
            return res.json("Sai mat khau cu");
        }
    } catch (error) {
        return res.render('profile', { message: 'Đổi mật khẩu thất bại' });
    }
}

// [GET] /account/logout
module.exports.logOut = async(req, res) => {
    res.clearCookie("tokenUser");
    res.clearCookie("cartId");
    return res.redirect('/AutoParts')
}