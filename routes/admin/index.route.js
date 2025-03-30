const systemConfig = require('../../configs/system');

const dashboardRoute = require('./dashboard.route');

module.exports = (app) => {
    const PATH_ADMIN = systemConfig.prefixAdmin;

    app.use(PATH_ADMIN + '', dashboardRoute);
}