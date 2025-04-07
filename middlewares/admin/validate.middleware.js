const systemConfig = require("../../configs/system");

const checkPermission = (requiredRole) => {
    return (req, res, next) => {
        const userRole = res.locals.permission;

        if (!userRole || !userRole.includes(requiredRole)) {
            return res.redirect(`${systemConfig.prefixAdmin}/auth/access-denied`);
        }
        
        next(); 
    };
};

module.exports = {
    checkPermission
};