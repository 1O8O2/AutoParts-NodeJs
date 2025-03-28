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


module.exports = (app) => {
    // app.use(categoryMiddleware.category);
    app.use(cartMiddleware.cartId); 
    app.use(userMiddleware.infoUser);
    app.use(headerMiddleware.headerInfo);
    // app.use(settingMiddleware.settingGeneral);

    app.use('/AutoParts', dashboardRoute);
    app.use('/AutoParts/blog', blogRoute);
    app.use('/AutoParts/account', accountRoute);
    app.use('/AutoParts/product', productRoute);
    app.use('/AutoParts/order', orderRoute)
}