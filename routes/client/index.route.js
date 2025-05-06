const systemConfig = require('../../configs/system');

// const categoryMiddleware = require("../../middlewares/client/category.middleware");
const cartMiddleware = require("../../middlewares/client/cart.middleware");
const userMiddleware = require("../../middlewares/client/user.middleware");
const headerMiddleware = require("../../middlewares/client/header.middleware");
// const authMiddleware = require("../../middlewares/client/auth.middleware");
// const settingMiddleware = require("../../middlewares/client/setting.middleware");

const dashboardRoute = require('./dashboard.route');
const blogRoute = require('./blog.route');
const accountRoute = require('./account.route')
const productRoute = require('./product.route')
const orderRoute = require('./order.route')
const forgotPasswordRoute = require('./forgotPassword.route')
const chatRoute = require('./chat.route')



module.exports = (app) => {
    const PATH_URL = systemConfig.prefixUrl;

    // app.use(categoryMiddleware.category);
    app.use(cartMiddleware.cartId); 
    app.use(userMiddleware.infoUser);
    app.use(headerMiddleware.headerInfo);
    // app.use(settingMiddleware.settingGeneral);

    app.use(PATH_URL + '', dashboardRoute);
    app.use(PATH_URL + '/blog', blogRoute);
    app.use(PATH_URL + '/account', accountRoute);
    app.use(PATH_URL + '/product', productRoute);
    app.use(PATH_URL + '/order', orderRoute);
    app.use(PATH_URL + '/forgot-password', forgotPasswordRoute);
    app.use(PATH_URL + '/chat', chatRoute);
}