const systemConfig = require('../../configs/system');

const userMiddleware = require("../../middlewares/admin/user.middleware");

const dashboardRoute = require('./dashboard.route');
const authRoute = require('./auth.route');

module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;

    // app.use(userMiddleware.infoUser);
    app.use(PATH_ADMIN + '/dashboard', userMiddleware.infoUser, dashboardRoute);
    app.use(PATH_ADMIN + '/auth', authRoute);
}