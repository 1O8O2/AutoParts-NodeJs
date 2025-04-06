const systemConfig = require('../../configs/system');

const userMiddleware = require("../../middlewares/admin/user.middleware");

const dashboardRoute = require('./dashboard.route');
const authRoute = require('./auth.route');
const blogRoute = require('./blog.route.js');
const discountRoute = require('./discount.route.js');
const generalSettingRoute = require('./generalSetting.route.js');
const orderRoute = require('./order.route.js');
const accountRoute = require('./account.route.js');

module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;

    // app.use(userMiddleware.infoUser);
    app.use(PATH_ADMIN + '/auth', authRoute);
    app.use(PATH_ADMIN + '/dashboard', userMiddleware.infoUser, dashboardRoute);
    app.use(PATH_ADMIN + '/blog', userMiddleware.infoUser, blogRoute);
    app.use(PATH_ADMIN + '/discount', userMiddleware.infoUser, discountRoute);
    app.use(PATH_ADMIN + '/generalSetting', userMiddleware.infoUser, generalSettingRoute);
    app.use(PATH_ADMIN + '/order', userMiddleware.infoUser, orderRoute);
    app.use(PATH_ADMIN + '/account', userMiddleware.infoUser, accountRoute);
}