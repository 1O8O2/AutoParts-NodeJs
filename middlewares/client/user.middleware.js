const Account = require("../../models/Account");
const Customer = require("../../models/Customer");

module.exports.infoUser = async (req, res, next) => {
    if (req.cookies.tokenUser) {
        const account = await Account.findOne({
            where: {
                token: req.cookies.tokenUser,
                status: "Active"
            }
        });

        if (account) {
            const user = await Customer.findOne({
                where: { email: account.email }
            });
            res.locals.user = user;
        }
    }
    
    next();
}