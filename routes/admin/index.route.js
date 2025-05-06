const systemConfig = require('../../configs/system');

const userMiddleware = require("../../middlewares/admin/user.middleware");

const dashboardRoute = require('./dashboard.route');
const authRoute = require('./auth.route');
const blogRoute = require('./blog.route.js');
const discountRoute = require('./discount.route.js');
const generalSettingRoute = require('./generalSetting.route.js');
const orderRoute = require('./order.route.js');
const accountRoute = require('./account.route.js');
const roleRoute = require('./role.route.js');
const statisticRoute = require('./statistic.route.js');
const productRoute = require('./product.route.js');
const productGroupRoute = require('./productGroup.route.js');
const brandRoute = require('./brand.route.js');
const customerRoute = require('./customer.route.js');
const employeeRoute = require('./employee.route.js');
const chatRoute = require('./chat.route.js');

module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;

    app.use(PATH_ADMIN + '/auth', authRoute);
    app.use(PATH_ADMIN + '/dashboard', userMiddleware.infoUser, dashboardRoute);
    app.use(PATH_ADMIN + '/blog', userMiddleware.infoUser, blogRoute);
    app.use(PATH_ADMIN + '/discount', userMiddleware.infoUser, discountRoute);
    app.use(PATH_ADMIN + '/generalSetting', userMiddleware.infoUser, generalSettingRoute);
    app.use(PATH_ADMIN + '/order', userMiddleware.infoUser, orderRoute);
    app.use(PATH_ADMIN + '/account', userMiddleware.infoUser, accountRoute);
    app.use(PATH_ADMIN + '/role', userMiddleware.infoUser, roleRoute);
    app.use(PATH_ADMIN + '/statistic', userMiddleware.infoUser, statisticRoute);
    app.use(PATH_ADMIN + '/product', userMiddleware.infoUser, productRoute);
    app.use(PATH_ADMIN + '/productGroup', userMiddleware.infoUser, productGroupRoute);
    app.use(PATH_ADMIN + '/brand', userMiddleware.infoUser, brandRoute);
    app.use(PATH_ADMIN + '/customer', userMiddleware.infoUser, customerRoute);
    app.use(PATH_ADMIN + '/employee', userMiddleware.infoUser, employeeRoute);
    app.use(PATH_ADMIN + '/chat', userMiddleware.infoUser, chatRoute);
}