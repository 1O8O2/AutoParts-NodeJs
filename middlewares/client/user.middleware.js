const Account = require("../../models/Account");
const Customer = require("../../models/Customer");

module.exports.infoUser = async (req, res, next) => {
    if (req.cookies.tokenUser) {
        const account = await Account.findOne({
            where: {
                token: req.cookies.tokenUser,
                // deleted: false,
                status: "Active"
            }
        });

        if (account) {
            const user = await Customer.findOne({
                where: { phone: account.phone }
            });
            res.locals.user = user;
        }
    }
    
    next();
}