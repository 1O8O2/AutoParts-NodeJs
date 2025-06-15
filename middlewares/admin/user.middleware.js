const systemConfig = require("../../configs/system");

const Account = require("../../models/Account");
const Employee = require("../../models/Employee");
const { RoleGroup } = require("../../models/RoleGroup");

module.exports.infoUser = async (req, res, next) => {
    if (req.cookies.token) {
        const account = await Account.findOne({
            where: {
                token: req.cookies.token,
                status: "Active"
            }
        });

        if (account) {
            const permission = await RoleGroup.findOne({
                where: {
                    roleGroupId: account.permission
                }
            });

            const user = await Employee.findOne({
                where: { email: account.email }
            });
            
            res.locals.user = user;
            res.locals.permission = permission.permissions;

            next();
        }
        else {
            res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
        }
    }
    else {
        res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
}