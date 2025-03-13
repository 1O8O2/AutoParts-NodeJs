const Account = require('../models/Account');
const Customer = require('../models/Customer');
const {Cart, productInCart} = require('../models/Cart');

module.exports.register = async(req, res) =>
{
    const { email, password, repassword, phone, address, fullName } = req.body;
    console.log(email + password + fullName + repassword + phone + address);

    // Validate passwords match
    if (password === repassword) {
        try {
            // Create a new Cart
            const cartId = 'CART'+phone;
            const newCart = await Cart.create({
                cartId
            });

            if (newCart) {
                // Create a new Account
                const newAccount = await Account.create({
                    phone: phone, // Assuming phone maps to a unique identifier
                    password,
                    email: email || '',
                    permission: 'RG002', // Hardcoded as in Java
                    status: 'Active',
                    deleted: false
                });

                if (newAccount) {
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
                } else {
                    req.session.message = 'Không thể thêm tài khoản';
                    return res.render('register', { message: req.session.message });
                }
            } else {
                req.session.message = 'Không thể thêm tài khoản';
                return res.render('register', { message: req.session.message });
            }
        } catch (error) {
            console.error('Error during registration:', error);
            req.session.message = 'Đăng ký thất bại, có lỗi xảy ra';
            return res.render('register', { message: req.session.message });
        }
    } else {
        req.session.message = 'Mật khẩu không khớp';
        return res.render('register', { message: req.session.message });
    }
}

module.exports.showRegister = (req, res)=>{
    res.render('register');
}

module.exports.showLogIn = (req, res)=>{
    const acc = req.session.user;
    console.log(acc)
    if(acc)
    {
        res.redirect('/AutoParts/account/profile');
    }
    return res.render('login');
    
}

module.exports.logIn = async(req, res)=>
{
    const { phone, password } = req.body;

    // Run test function (for debugging, remove in production)
    // await test();

    // Validation
    if (!password || !phone || password.length < 4 || phone.length < 10) {
        return res.render('login', { message: 'Dữ liệu không hợp lệ' });
    }

    const account = await Account.findOne({ where: { phone: phone } });

    if (!account) {
        return res.render('login', { message: 'Không tìm thấy tài khoản' });
    }

    if (password === account.password) {
        // Add user info to session
        req.session.user = account;
        const customer = await Customer.findByPk(account.phone);
        req.session.userName = customer.fullName;

        const cart = await Cart.findByPk(customer.cartId)
        // const productsInCart = cart.products; // Assuming Cart has a virtual 'products' field
        // const products = {};
        // for (const productId of Object.keys(productsInCart)) {
        //     const product = await Product.findOne({ where: { productId } });
        //     products[productId] = productsInCart[productId];
        // }
        req.session.productInCart = cart.products;

        return res.redirect('/AutoParts'); // Direct to profile
        // return res.redirect('/AutoParts');
    } else {
        return res.render('login', { message: 'Sai email hoặc mật khẩu' });
    }
}

module.exports.showProfile = async(req, res) =>
{
    console.log("profile")
        const acc = req.session.user;


    try {
        const customer = await Customer.findByPk(acc.phone);
        const orderLst = await Order.findAll({ where: { userPhone: acc.phone } }); 

        console.log(orderLst);
        return res.render('profile', {
            customer,
            orders: orderLst,
            userName: customer.fullName 
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        //res.render('profile', { message: 'Đã xảy ra lỗi khi tải thông tin' });
    }
}

module.exports.accountEdit = async(req, res) =>
{
    const acc = req.session.user;


    try {
        const {fullName, address} = req.body
        const customer = await Customer.findByPk(acc.phone); 

        if (customer) {
            const updated = await Customer.update(
                { fullName: fullName, address: address },
                { where: { phone: customer.phone } }
            );
            console.log(updated); 

            req.session.userName = fullName || customer.fullName;
        }

        return res.render('profile', {customer: customer});
    } catch (error) {
        console.error('Error updating profile:', error);
        return res.render('profile', { message: 'Cập nhật thất bại' });
    }
}

module.exports.changePassword = async(req, res) =>
{
    const acc = req.session.user;


    const { pass, newpass } = req.body;
    console.log('changepassword');
    console.log(pass);

    try {
        const account = await Account.findByPk(acc.phone);

        if (account.password === pass) {
            await Account.update(
                { password: newpass },
                { where: { phone: acc.phone } }
            );
            return res.redirect('/AutoParts/account/profile');
        } else {
            return res.render('profile', { message: 'Mật khẩu cũ không đúng' });
        }
    } catch (error) {
        console.error('Error changing password:', error);
        return res.render('profile', { message: 'Đổi mật khẩu thất bại' });
    }
}

